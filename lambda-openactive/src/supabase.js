/**
 * Supabase client and database operations for Lambda
 */

const { createClient } = require('@supabase/supabase-js');
const { slotToRow } = require('./slot-mapper');

// Initialize Supabase client
let supabase;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabase;
}

/**
 * Store cached slot data with multi-provider merge support.
 * Reads existing cache entry, replaces slots from the given provider, and upserts the merged result.
 *
 * NOTE: This read-merge-write is NOT atomic. It is safe because all providers
 * run sequentially within a single Lambda invocation. Do NOT run concurrent
 * Lambdas writing to the same cache_key — the last write wins and drops data.
 */
async function setCachedData(city, date, slots, providerName = 'playtomic') {
  const supabase = getSupabaseClient();
  const cacheKey = `${city.toLowerCase()}:${date}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes TTL

  // Stamp each new slot with collection time for staleness checks
  const now = new Date().toISOString();
  for (const s of slots) {
    s._collectedAt = now;
  }

  // Read existing cache entry to merge with other providers' data
  let mergedSlots = slots;
  const { data: existing } = await supabase
    .from('playscanner_cache')
    .select('slots')
    .eq('cache_key', cacheKey)
    .single();

  if (existing?.slots && Array.isArray(existing.slots)) {
    // Keep slots from other providers, but discard if older than 60 minutes
    const staleThreshold = Date.now() - 60 * 60 * 1000;
    const otherSlots = existing.slots.filter((s) => {
      if (!s.provider || s.provider === providerName) return false;
      // Discard stale provider data
      if (s._collectedAt && new Date(s._collectedAt).getTime() < staleThreshold)
        return false;
      return true;
    });
    mergedSlots = [...otherSlots, ...slots];
  }

  // Build per-provider stats for metadata
  const providerStats = {};
  for (const s of mergedSlots) {
    const p = s.provider || 'unknown';
    if (!providerStats[p]) providerStats[p] = { slots: 0, venues: new Set() };
    providerStats[p].slots++;
    providerStats[p].venues.add(s.venue?.id);
  }
  const providers = Object.keys(providerStats);
  const providerDetails = {};
  for (const p of providers) {
    providerDetails[p] = {
      slots: providerStats[p].slots,
      venues: providerStats[p].venues.size,
    };
  }

  const cacheEntry = {
    cache_key: cacheKey,
    city: city.toLowerCase(),
    date,
    slots: mergedSlots,
    metadata: {
      totalSlots: mergedSlots.length,
      uniqueVenues: [...new Set(mergedSlots.map((s) => s.venue.id))].length,
      collectedAt: new Date().toISOString(),
      providers,
      providerDetails,
    },
    expires_at: expiresAt.toISOString(),
  };

  const { error } = await supabase
    .from('playscanner_cache')
    .upsert(cacheEntry, { onConflict: 'cache_key' });

  if (error) {
    throw new Error(`Failed to cache data: ${error.message}`);
  }

  console.log(
    `💾 Cached ${slots.length} ${providerName} slots for ${city} ${date} (${mergedSlots.length} total)`
  );
}

// storeVenue function removed - playscanner_venues table dropped as unused

/**
 * Dual-write: upsert a provider's slots into the flat `playscanner_slots` table
 * via the `playscanner_write_slots` Postgres function. Also runs a scoped
 * tombstone sweep that marks rows `available = FALSE` if they existed in a
 * previous run but are missing from this one — but only within the scope the
 * run actually attempted. A failed fetch for a different city/sport never
 * tombstones its rows.
 *
 * The server function uses DB-side NOW() as the watermark, so Lambda clock
 * skew can't make a slow run tombstone its own freshly-written rows.
 *
 * Duplicated from lambda-playscanner/src/supabase.js — keep the two copies in
 * sync until the two Lambdas share a common package.
 *
 * @param {Array<object>} slots          raw slots from a provider's fetchAvailability()
 * @param {string} providerName          provider name (matches slot.provider)
 * @param {object} scope                 attempted scope
 * @param {string[]} scope.cities        cities in the run (lowercase)
 * @param {string[]} scope.sports        sports in the run
 * @param {string[]} scope.dates         YYYY-MM-DD dates in the run
 * @returns {Promise<{written: number, tombstoned: number}>}
 */
async function writeSlots(slots, providerName, scope) {
  const supabase = getSupabaseClient();

  if (!scope || !Array.isArray(scope.cities) || scope.cities.length === 0) {
    throw new Error('writeSlots: scope.cities must be a non-empty array');
  }
  if (!Array.isArray(scope.sports) || scope.sports.length === 0) {
    throw new Error('writeSlots: scope.sports must be a non-empty array');
  }
  if (!Array.isArray(scope.dates) || scope.dates.length === 0) {
    throw new Error('writeSlots: scope.dates must be a non-empty array');
  }

  // Map to flat rows then drop any rows whose resolved sport is outside the
  // declared scope. Defense-in-depth guard — see lambda-playscanner copy.
  const allRows = (slots || []).map((slot) => slotToRow(slot, scope.cities[0]));
  const rows = allRows.filter((r) => scope.sports.includes(r.sport));
  if (rows.length === 0 && allRows.length > 0) {
    console.warn(
      `writeSlots: all ${allRows.length} rows for ${providerName} filtered out — none match scope.sports=${JSON.stringify(scope.sports)}`
    );
  }

  const sortedDates = [...scope.dates].sort();
  const startMin = `${sortedDates[0]}T00:00:00.000Z`;
  const startMax = `${sortedDates[sortedDates.length - 1]}T23:59:59.999Z`;

  const { data, error } = await supabase.rpc('playscanner_write_slots', {
    p_provider: providerName,
    p_rows: rows,
    p_attempted_cities: scope.cities.map((c) => c.toLowerCase()),
    p_attempted_sports: scope.sports,
    p_attempted_start_min: startMin,
    p_attempted_start_max: startMax,
  });

  if (error) {
    throw new Error(`writeSlots rpc failed: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;
  return {
    written: result?.written || 0,
    tombstoned: result?.tombstoned || 0,
  };
}

/**
 * Log collection results
 */
async function logCollection(logEntry) {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('playscanner_collection_log')
    .insert(logEntry);

  if (error) {
    console.error('Failed to log collection:', error.message);
    // Don't throw - logging failures shouldn't stop collection
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const supabase = getSupabaseClient();

  try {
    // Get total and active entries
    const { data: cacheData, error: cacheError } = await supabase
      .from('playscanner_cache')
      .select('cache_key, expires_at, city, date', { count: 'exact' });

    if (cacheError) throw cacheError;

    const now = new Date();
    const activeEntries = cacheData.filter(
      (entry) => new Date(entry.expires_at) > now
    );

    // Get unique cities
    const cities = [...new Set(cacheData.map((entry) => entry.city))];

    // Get date range
    const dates = cacheData.map((entry) => entry.date).sort();
    const dateRange = {
      oldest: dates[0] || null,
      newest: dates[dates.length - 1] || null,
    };

    // Get last collection
    const { data: lastLog } = await supabase
      .from('playscanner_collection_log')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      totalEntries: cacheData.length,
      activeEntries: activeEntries.length,
      expiredEntries: cacheData.length - activeEntries.length,
      citiesCovered: cities.length,
      dateRange,
      lastCollection: lastLog?.created_at || null,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      totalEntries: 0,
      activeEntries: 0,
      expiredEntries: 0,
      citiesCovered: 0,
      dateRange: { oldest: null, newest: null },
      lastCollection: null,
    };
  }
}

/**
 * Get the stored RPDE cursor for a feed URL
 */
async function getCursor(feedUrl) {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from('playscanner_rpde_cursors')
    .select('next_url')
    .eq('feed_url', feedUrl)
    .single();

  return data?.next_url || null;
}

/**
 * Save the RPDE cursor for a feed URL
 */
async function saveCursor(feedUrl, nextUrl) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('playscanner_rpde_cursors').upsert(
    {
      feed_url: feedUrl,
      next_url: nextUrl,
      last_polled_at: new Date().toISOString(),
    },
    { onConflict: 'feed_url' }
  );

  if (error) {
    console.error(`Failed to save cursor for ${feedUrl}: ${error.message}`);
  }
}

module.exports = {
  getSupabaseClient,
  setCachedData,
  writeSlots,
  logCollection,
  getCacheStats,
  getCursor,
  saveCursor,
};

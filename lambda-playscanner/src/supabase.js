/**
 * Supabase client and database operations for Lambda
 */

const { createClient } = require('@supabase/supabase-js');

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
    // Determine sport of incoming batch for provider+sport merge
    // This prevents e.g. tennis Playtomic from overwriting padel Playtomic
    const incomingSport = slots[0]?.sport || null;
    const otherSlots = existing.slots.filter((s) => {
      if (!s.provider) return false;
      if (s.provider === providerName) {
        // If both have sport info, only remove same-sport slots from this provider
        if (incomingSport && s.sport && s.sport !== incomingSport) return true;
        return false;
      }
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

module.exports = {
  setCachedData,
  logCollection,
  getCacheStats,
};

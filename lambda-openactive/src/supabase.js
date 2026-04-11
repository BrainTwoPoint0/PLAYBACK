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
 * Upsert a provider's slots into the flat `playscanner_slots` table
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
  writeSlots,
  logCollection,
  getCursor,
  saveCursor,
};

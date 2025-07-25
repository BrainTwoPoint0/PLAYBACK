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
 * Store cached slot data
 */
async function setCachedData(city, date, slots) {
  const supabase = getSupabaseClient();
  const cacheKey = `${city.toLowerCase()}:${date}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes TTL

  const cacheEntry = {
    cache_key: cacheKey,
    city: city.toLowerCase(),
    date,
    slots,
    metadata: {
      totalSlots: slots.length,
      uniqueVenues: [...new Set(slots.map((s) => s.venue.id))].length,
      collectedAt: new Date().toISOString(),
      provider: 'playtomic',
    },
    expires_at: expiresAt.toISOString(),
  };

  const { error } = await supabase
    .from('playscanner_cache')
    .upsert(cacheEntry, { onConflict: 'cache_key' });

  if (error) {
    throw new Error(`Failed to cache data: ${error.message}`);
  }

  console.log(`💾 Cached ${slots.length} slots for ${city} ${date}`);
}

/**
 * Store venue information
 */
async function storeVenue(venue, city) {
  const supabase = getSupabaseClient();

  const venueData = {
    venue_id: venue.id,
    provider: 'playtomic',
    city: city.toLowerCase(),
    venue_data: venue,
    is_active: true,
    last_seen: new Date().toISOString(),
  };

  const { error } = await supabase.from('playscanner_venues').upsert(venueData);

  if (error) {
    throw new Error(`Failed to store venue: ${error.message}`);
  }
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

module.exports = {
  setCachedData,
  storeVenue,
  logCollection,
  getCacheStats,
};

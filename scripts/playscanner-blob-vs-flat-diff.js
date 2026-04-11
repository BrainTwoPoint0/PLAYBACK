#!/usr/bin/env node

/**
 * Phase 1e gate: blob vs flat comparison
 *
 * Validates that the flat `playscanner_slots` table is populated with the
 * same (provider, sport, city, date) slot coverage as the legacy
 * `playscanner_cache` JSONB blob. Used as the go/no-go signal before Phase 2
 * flips `persistent-cache.ts:search()` to read from the flat table.
 *
 * What it compares (per (sport, city, date) tuple):
 *   - For each provider that has rows in either source:
 *     - blob_count:  distinct (venue_id, court_name, start_time) tuples in
 *                    the blob for that slice (DISTINCT-ed because the legacy
 *                    setCachedData has a known concurrent-write race that
 *                    inflates the blob with duplicates).
 *     - flat_count:  count of available=TRUE rows in playscanner_slots for
 *                    that slice.
 *     - delta:       flat - blob (signed)
 *
 * Acceptance criteria for Phase 2 cutover:
 *   - Every provider that appears in the blob also appears in the flat table
 *     (no missing providers).
 *   - |delta| ≤ 5 for every (provider, slice) combination. Small deltas are
 *     expected: providers run on different schedules, so the flat table and
 *     the blob can be up to one collection cycle out of sync with each other.
 *
 * Usage:
 *   node scripts/playscanner-blob-vs-flat-diff.js                 # today + next 2 days, London, all sports
 *   node scripts/playscanner-blob-vs-flat-diff.js --days 7        # today + next 6 days
 *   node scripts/playscanner-blob-vs-flat-diff.js --sport tennis  # single sport
 *   node scripts/playscanner-blob-vs-flat-diff.js --city london --sport padel --date 2026-04-12
 */

const { createClient } = require('@supabase/supabase-js');
// Try both .env.local and .env — PLAYBACK uses .env in practice
try { require('dotenv').config({ path: '.env.local' }); } catch {}
try { require('dotenv').config({ path: '.env' }); } catch {}

const SPORTS = ['padel', 'tennis', 'football', 'basketball'];
const DEFAULT_CITY = 'london';

function parseArgs(argv) {
  const args = {
    days: 3,
    city: DEFAULT_CITY,
    sport: null,
    date: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--days') args.days = parseInt(argv[++i], 10);
    else if (k === '--city') args.city = argv[++i].toLowerCase();
    else if (k === '--sport') args.sport = argv[++i];
    else if (k === '--date') args.date = argv[++i];
  }
  return args;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function buildSlices(args) {
  const sports = args.sport ? [args.sport] : SPORTS;
  const dates = [];
  if (args.date) {
    dates.push(args.date);
  } else {
    const today = new Date();
    for (let offset = 0; offset < args.days; offset++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + offset);
      dates.push(isoDate(d));
    }
  }
  const slices = [];
  for (const sport of sports) {
    for (const date of dates) {
      slices.push({ sport, city: args.city, date });
    }
  }
  return slices;
}

async function queryBlobSlice(supabase, { sport, city, date }) {
  // Pull the blob row and count distinct (venue, court, start_time) per provider
  // for the requested sport. The DISTINCT is critical: the legacy setCachedData
  // race inflates the blob with duplicate entries.
  const cacheKey = `${city.toLowerCase()}:${date}`;
  const { data, error } = await supabase
    .from('playscanner_cache')
    .select('slots')
    .eq('cache_key', cacheKey)
    .maybeSingle();

  if (error || !data || !Array.isArray(data.slots)) {
    return {};
  }

  // collapse duplicates per provider
  const perProvider = {}; // provider -> Set of dedupe keys
  const nowMs = Date.now();
  for (const s of data.slots) {
    if (s.sport !== sport) continue;
    if (new Date(s.startTime).getTime() <= nowMs) continue;
    const p = s.provider || 'unknown';
    if (!perProvider[p]) perProvider[p] = new Set();
    const vid = s.venue && s.venue.id;
    const cname = (s.court && s.court.name) || '';
    const st = s.startTime;
    perProvider[p].add(`${vid}::${cname}::${st}`);
  }

  const counts = {};
  for (const [p, set] of Object.entries(perProvider)) {
    counts[p] = set.size;
  }
  return counts;
}

async function queryFlatSlice(supabase, { sport, city, date }) {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;
  const nowIso = new Date().toISOString();

  // Paginate in case a slice has more than 1000 rows (Supabase default cap).
  const batchSize = 1000;
  let from = 0;
  const counts = {};
  /* eslint-disable no-constant-condition */
  while (true) {
    const { data, error } = await supabase
      .from('playscanner_slots')
      .select('provider', { count: 'exact' })
      .eq('city', city.toLowerCase())
      .eq('sport', sport)
      .eq('available', true)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .gt('start_time', nowIso)
      .range(from, from + batchSize - 1);

    if (error) {
      console.error(`flat query error ${sport}/${city}/${date}:`, error.message);
      return {};
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const p = row.provider || 'unknown';
      counts[p] = (counts[p] || 0) + 1;
    }

    if (data.length < batchSize) break;
    from += batchSize;
  }
  return counts;
}

function formatDelta(blob, flat) {
  const providers = new Set([...Object.keys(blob), ...Object.keys(flat)]);
  return [...providers].sort().map((p) => {
    const b = blob[p] || 0;
    const f = flat[p] || 0;
    return { provider: p, blob: b, flat: f, delta: f - b };
  });
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error(
      'Missing SUPABASE_URL / SUPABASE_SERVICE_KEY. Check .env.local in PLAYBACK.'
    );
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const args = parseArgs(process.argv.slice(2));
  const slices = buildSlices(args);

  console.log(
    `\nblob-vs-flat diff — ${slices.length} slice(s)  (city=${args.city})\n`
  );

  let blocking = 0;
  let warnings = 0;

  for (const slice of slices) {
    const [blob, flat] = await Promise.all([
      queryBlobSlice(supabase, slice),
      queryFlatSlice(supabase, slice),
    ]);

    const rows = formatDelta(blob, flat);
    const title = `${slice.sport.padEnd(10)} ${slice.city.padEnd(12)} ${slice.date}`;

    if (rows.length === 0) {
      console.log(`${title}   (no rows in either source)`);
      continue;
    }

    console.log(title);
    for (const row of rows) {
      const marker =
        row.delta === 0
          ? '  '
          : Math.abs(row.delta) <= 5
            ? ' ~'
            : ' !';
      const missing = row.flat === 0 && row.blob > 0 ? ' [missing in flat]' : '';
      console.log(
        `  ${marker} ${row.provider.padEnd(14)} blob=${String(row.blob).padStart(5)}  flat=${String(row.flat).padStart(5)}  Δ=${String(row.delta).padStart(5)}${missing}`
      );
      if (row.flat === 0 && row.blob > 0) blocking++;
      else if (Math.abs(row.delta) > 5) warnings++;
    }
    console.log('');
  }

  console.log(
    `summary: ${blocking} blocking (provider missing from flat), ${warnings} warnings (|Δ| > 5)`
  );
  if (blocking > 0) {
    console.log('\nNOT READY for Phase 2 cutover — resolve blocking items first.');
    process.exit(2);
  }
  if (warnings > 0) {
    console.log(
      '\nSoft warnings present. Investigate before cutover but not blocking.'
    );
    process.exit(1);
  }
  console.log('\nREADY for Phase 2 cutover.');
}

main().catch((err) => {
  console.error(err);
  process.exit(3);
});

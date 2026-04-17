#!/usr/bin/env node
/**
 * Fails CI if any provider listed in `src/lib/playscanner/providers.json`
 * produced zero slots in the last 24 hours of collection runs.
 *
 * This catches silent-failure drift — the scraper/API integration keeps
 * "succeeding" (status=success) but returns zero rows. Example: footy_addicts
 * was in this state for weeks after footyaddicts.com was redesigned.
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Exit codes:
 *   0 — all registered providers produced >0 slots in the window
 *   1 — one or more providers silently produced zero slots (ALERT)
 *   2 — missing env or query failed
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const WINDOW_HOURS = Number(process.env.HEALTH_WINDOW_HOURS || 24);
const here = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(here, '../src/lib/playscanner/providers.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const knownProviders = new Set(registry.providers);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(2);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const sinceIso = new Date(
  Date.now() - WINDOW_HOURS * 60 * 60 * 1000
).toISOString();

// Aggregate per provider from the collection log.
const { data, error } = await supabase
  .from('playscanner_collection_log')
  .select('provider, slots_collected, status, error_message, created_at')
  .gte('created_at', sinceIso);

if (error) {
  console.error('Query failed:', error.message);
  process.exit(2);
}

const byProvider = new Map();
for (const row of data) {
  if (!row.provider) continue;
  const p = row.provider;
  const agg = byProvider.get(p) || {
    runs: 0,
    slots: 0,
    errors: 0,
    emptyRuns: 0,
    lastRun: null,
    lastError: null,
  };
  agg.runs += 1;
  agg.slots += row.slots_collected || 0;
  if (row.status === 'error') {
    agg.errors += 1;
    if (row.error_message) agg.lastError = row.error_message.slice(0, 200);
  }
  if ((row.slots_collected || 0) === 0) agg.emptyRuns += 1;
  if (!agg.lastRun || row.created_at > agg.lastRun) agg.lastRun = row.created_at;
  byProvider.set(p, agg);
}

const rows = [...knownProviders]
  .map((p) => ({ provider: p, ...(byProvider.get(p) || { runs: 0, slots: 0, errors: 0, emptyRuns: 0, lastRun: null, lastError: null }) }))
  .sort((a, b) => a.slots - b.slots);

const pad = (s, n) => String(s).padEnd(n, ' ');
console.log(
  `\nProvider health — last ${WINDOW_HOURS}h (${rows.length} registered providers)\n`
);
console.log(
  pad('provider', 18),
  pad('runs', 6),
  pad('slots', 10),
  pad('errors', 8),
  pad('empty_runs', 11),
  'last_run'
);
for (const r of rows) {
  console.log(
    pad(r.provider, 18),
    pad(r.runs, 6),
    pad(r.slots, 10),
    pad(r.errors, 8),
    pad(r.emptyRuns, 11),
    r.lastRun || '—'
  );
}

const dead = rows.filter((r) => r.slots === 0);
const ignoreList = new Set(registry.healthIgnoreProviders || []);
const failing = dead.filter((r) => !ignoreList.has(r.provider));
const ignored = dead.filter((r) => ignoreList.has(r.provider));

if (ignored.length > 0) {
  console.log(
    `\nIgnored (listed in healthIgnoreProviders): ${ignored.map((r) => r.provider).join(', ')}`
  );
}

if (failing.length > 0) {
  console.error(
    `\nALERT: ${failing.length} provider(s) produced 0 slots in the last ${WINDOW_HOURS}h:`
  );
  for (const r of failing) {
    console.error(
      `  - ${r.provider}: ${r.runs} runs, ${r.errors} errors` +
        (r.lastError ? `, last error: ${r.lastError}` : '')
    );
  }
  console.error(
    `\nFix the lambda emitter, or if the provider is intentionally offline,` +
      ` add it to "healthIgnoreProviders" in providers.json.`
  );
  process.exit(1);
}

console.log('\nOK — every registered provider produced slots in the window.');

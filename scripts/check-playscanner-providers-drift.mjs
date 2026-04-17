#!/usr/bin/env node
/**
 * Asserts that every distinct `provider` value in `playscanner_slots`
 * (last 7 days, future slots only) is enumerated in
 * `src/lib/playscanner/providers.json`.
 *
 * Exits 1 on drift so CI fails. Designed to run on a daily cron.
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const { data, error } = await supabase
  .from('playscanner_slots')
  .select('provider')
  .gte('start_time', new Date().toISOString())
  .gte('collected_at', sinceIso);

if (error) {
  console.error('Query failed:', error.message);
  process.exit(2);
}

const cacheProviders = new Set(data.map((r) => r.provider).filter(Boolean));
const drift = [...cacheProviders].filter((p) => !knownProviders.has(p));
const unused = [...knownProviders].filter((p) => !cacheProviders.has(p));

console.log(`Cache providers (${cacheProviders.size}):`, [...cacheProviders].sort().join(', '));
console.log(`Registry providers (${knownProviders.size}):`, [...knownProviders].sort().join(', '));

if (drift.length > 0) {
  console.error(
    `\nDRIFT: ${drift.length} provider(s) in cache but missing from registry: ${drift.join(', ')}`
  );
  console.error(
    'Add them to PLAYBACK/src/lib/playscanner/providers.json or fix the lambda emitter.'
  );
  process.exit(1);
}

if (unused.length > 0) {
  console.warn(
    `\nWarn: ${unused.length} provider(s) in registry with no recent cache data: ${unused.join(', ')}`
  );
  console.warn(
    'These may be stale. Consider removing if the lambda emitter no longer produces them.'
  );
}

console.log('\nOK — no drift.');

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

const { data, error } = await queryWithRetry(
  () =>
    supabase
      .from('playscanner_slots')
      .select('provider')
      .gte('start_time', new Date().toISOString())
      .gte('collected_at', sinceIso),
  'slots'
);

if (error) {
  console.error('Query failed:', error.message || error);
  process.exit(2);
}

async function queryWithRetry(fn, label, attempts = 3, baseDelayMs = 2000) {
  const isTransient = (msg) =>
    /fetch failed|network|timeout|ECONNRESET|ETIMEDOUT|EAI_AGAIN|unexpected token|502|503|504|bad gateway|service unavailable|gateway timeout/i.test(
      String(msg || '')
    );
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await fn();
      if (!result.error) return result;
      lastErr = result.error;
      if (!isTransient(result.error.message) || i === attempts - 1) return result;
    } catch (e) {
      lastErr = e;
      if (!isTransient(e?.message) || i === attempts - 1) throw e;
    }
    const delay = baseDelayMs * 2 ** i;
    console.warn(
      `[${label}] transient error (attempt ${i + 1}/${attempts}): ${lastErr?.message || lastErr}. Retrying in ${delay}ms...`
    );
    await new Promise((r) => setTimeout(r, delay));
  }
  return { data: null, error: lastErr };
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

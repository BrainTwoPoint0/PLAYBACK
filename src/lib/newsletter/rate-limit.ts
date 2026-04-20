import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Production: Upstash Redis-backed distributed limiter (set UPSTASH_REDIS_REST_URL
// + UPSTASH_REDIS_REST_TOKEN env vars). Dev / when Upstash isn't configured:
// in-memory sliding window per lambda instance - fine for local dev and small
// self-hosted deploys, lossy across instances under load.
//
// Fixed 5/min window - tight enough to stop casual abuse, loose enough for
// a real person triple-clicking. Each distinct key has its own bucket.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

type LimitResult = { ok: boolean; retryAfter: number };

// --- In-memory fallback ---------------------------------------------------
type WindowEntry = { count: number; firstHit: number };
const windows = new Map<string, WindowEntry>();
const MAX_ENTRIES = 10_000;

function checkInMemory(key: string): LimitResult {
  const now = Date.now();

  if (windows.size > MAX_ENTRIES) {
    for (const [k, v] of windows) {
      if (now - v.firstHit > WINDOW_MS) windows.delete(k);
    }
    if (windows.size > MAX_ENTRIES) {
      const oldest = windows.keys().next().value;
      if (oldest) windows.delete(oldest);
    }
  }

  const entry = windows.get(key);
  if (!entry || now - entry.firstHit > WINDOW_MS) {
    windows.set(key, { count: 1, firstHit: now });
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_PER_WINDOW) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.firstHit)) / 1000);
    return { ok: false, retryAfter };
  }

  entry.count += 1;
  return { ok: true, retryAfter: 0 };
}

// --- Upstash-backed (production) -----------------------------------------
let cachedRatelimit: Ratelimit | null = null;

function getUpstashLimiter(): Ratelimit | null {
  if (cachedRatelimit) return cachedRatelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  cachedRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_PER_WINDOW, `${WINDOW_MS} ms`),
    analytics: false,
    prefix: 'playback:rl',
  });
  return cachedRatelimit;
}

// --- Public API -----------------------------------------------------------
/**
 * Distributed rate check. Uses Upstash if configured, falls back to in-memory
 * otherwise. Always returns quickly (Upstash round-trips are single-digit ms
 * from Vercel/Netlify to the same region).
 */
export async function checkRateLimitAsync(key: string): Promise<LimitResult> {
  const limiter = getUpstashLimiter();
  if (!limiter) return checkInMemory(key);
  try {
    const result = await limiter.limit(key);
    return {
      ok: result.success,
      retryAfter: result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (err) {
    // Upstash outage - fail open to in-memory rather than blocking legitimate users.
    // eslint-disable-next-line no-console
    console.error('[rate-limit] upstash check failed, falling back', err);
    return checkInMemory(key);
  }
}

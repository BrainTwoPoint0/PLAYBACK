// Public-asset URL helpers for Supabase Storage.
//
// Marketing bucket is `marketing-assets` (public, hotlinkable, CDN-served).
// Migration: docs/migrations/create_marketing_assets_bucket.sql (applied via MCP).
//
// Version file names in the path (e.g. `hero.v5.mp4`) rather than via query string -
// survives Supabase's Cache-Control defaults cleanly and plays well with CF edge cache.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const BUCKET_NAME_RE = /^[a-z0-9-]+$/;
const DISALLOWED_PATH_CHARS = /[?#\\]/;

/**
 * Build a public URL for an object in a Supabase Storage bucket.
 * Works in client and server components - uses the public anon URL, no auth.
 *
 * Defense-in-depth: rejects traversal (`..`), query/fragment/backslash, and
 * non-conforming bucket names. Callers today pass static literals but the
 * helper is a reflected URL generator - one refactor away from user input.
 */
export function getPublicStorageUrl(bucket: string, path: string): string {
  if (!SUPABASE_URL) {
    throw new Error('getPublicStorageUrl: NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!BUCKET_NAME_RE.test(bucket)) {
    throw new Error(`getPublicStorageUrl: invalid bucket name '${bucket}'`);
  }
  if (path.includes('..') || DISALLOWED_PATH_CHARS.test(path)) {
    throw new Error('getPublicStorageUrl: invalid path');
  }
  const cleanPath = path
    .replace(/^\/+/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

/**
 * Shorthand for the `marketing-assets` bucket.
 */
export function getMarketingAssetUrl(path: string): string {
  return getPublicStorageUrl('marketing-assets', path);
}

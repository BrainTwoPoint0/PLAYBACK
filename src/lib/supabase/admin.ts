import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

let cached: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Returns a Supabase client authenticated with the service-role key. Bypasses RLS.
 * NEVER import this from a client component or pass the returned client to the browser.
 * Only use inside server-only code paths (Route Handlers, Server Actions, cron).
 */
export function createAdminClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  cached = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}

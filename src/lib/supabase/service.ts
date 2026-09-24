import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * service_role Supabase client — server-only. `import "server-only"` makes any
 * accidental client-component import fail the build instead of leaking the key.
 * Every privileged RPC call (confirm/cancel, alias approval, mapping review, ...)
 * goes through this client, never through a browser-issued anon-key client.
 */
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

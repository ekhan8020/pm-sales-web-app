import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * anon-key Supabase client, used server-side ONLY to call
 * `auth.signInWithPassword` during login. It never touches privileged tables
 * (RLS blocks it) and its session is never persisted — the login route reads
 * the result once and then issues our own signed session cookie.
 */
export function getAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars"
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

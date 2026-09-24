import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAnonSupabase } from "@/lib/supabase/anon";
import { getServiceSupabase } from "@/lib/supabase/service";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

/**
 * POST { username, password } -> sets an HttpOnly session cookie.
 *
 * Flow: map username -> the placeholder Supabase Auth email -> sign in via
 * Supabase Auth (proves the password) -> look up the matching, active
 * `staff_users` row via service_role -> issue our own signed session cookie.
 * The browser never receives a Supabase session or the service_role key.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, reason: "username_and_password_required" },
      { status: 400 }
    );
  }

  const domain = process.env.STAFF_EMAIL_DOMAIN;
  if (!domain) {
    return NextResponse.json(
      { ok: false, reason: "server_misconfigured" },
      { status: 500 }
    );
  }
  const email = `${username.toLowerCase()}@${domain}`;

  const anonClient = getAnonSupabase();
  const { error: authError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    // Deliberately vague — do not reveal whether the username exists.
    return NextResponse.json(
      { ok: false, reason: "invalid_credentials" },
      { status: 401 }
    );
  }

  const serviceClient = getServiceSupabase();
  const { data: staffRow, error: staffError } = await serviceClient
    .from("staff_users")
    .select("id, username, role, must_change_password, is_active")
    .ilike("username", username)
    .maybeSingle();

  if (staffError || !staffRow || staffRow.is_active !== true) {
    return NextResponse.json(
      { ok: false, reason: "staff_account_not_found_or_inactive" },
      { status: 403 }
    );
  }

  const token = await createSessionToken({
    staffId: staffRow.id,
    username: staffRow.username,
    role: staffRow.role,
    mustChangePassword: staffRow.must_change_password,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  return NextResponse.json({
    ok: true,
    mustChangePassword: staffRow.must_change_password,
  });
}

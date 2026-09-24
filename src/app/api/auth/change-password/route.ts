import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/current-session";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * POST { new_password, confirm_password } — requires an existing session
 * (does not accept staffId from the body). Used both for the forced
 * first-login password change and for voluntary password changes later.
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, reason: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const newPassword = typeof body?.new_password === "string" ? body.new_password : "";
  const confirmPassword =
    typeof body?.confirm_password === "string" ? body.confirm_password : "";

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { ok: false, reason: "password_too_short" },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { ok: false, reason: "passwords_do_not_match" },
      { status: 400 }
    );
  }

  const serviceClient = getServiceSupabase();

  const { data: staffRow, error: staffError } = await serviceClient
    .from("staff_users")
    .select("id, auth_user_id")
    .eq("id", session.staffId)
    .maybeSingle();

  if (staffError || !staffRow) {
    return NextResponse.json({ ok: false, reason: "staff_account_not_found" }, { status: 404 });
  }

  const { error: updateAuthError } = await serviceClient.auth.admin.updateUserById(
    staffRow.auth_user_id,
    { password: newPassword }
  );

  if (updateAuthError) {
    return NextResponse.json({ ok: false, reason: "password_update_failed" }, { status: 500 });
  }

  await serviceClient
    .from("staff_users")
    .update({ must_change_password: false })
    .eq("id", staffRow.id);

  return NextResponse.json({ ok: true });
}

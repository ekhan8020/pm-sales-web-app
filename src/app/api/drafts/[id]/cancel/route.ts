import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/current-session";
import { getServiceSupabase } from "@/lib/supabase/service";

const CAN_ACT_ROLES = ["operator", "mapping_reviewer", "administrator"];

/** POST { reason, idempotency_key } — soft-cancels a pending draft. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, reason: "not_authenticated" }, { status: 401 });
  }
  if (!CAN_ACT_ROLES.includes(session.role)) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const idempotencyKey = typeof body?.idempotency_key === "string" ? body.idempotency_key : "";

  if (!reason) {
    return NextResponse.json({ ok: false, reason: "cancel_reason_required" }, { status: 400 });
  }
  if (!idempotencyKey) {
    return NextResponse.json({ ok: false, reason: "missing_idempotency_key" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase.rpc("cancel_pm_sales_draft_v1", {
    p_draft_id: id,
    p_actor_id: session.staffId,
    p_reason: reason,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 409 });
  }

  return NextResponse.json(data);
}

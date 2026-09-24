import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/current-session";
import { getServiceSupabase } from "@/lib/supabase/service";

const CAN_ACT_ROLES = ["operator", "mapping_reviewer", "administrator"];

/**
 * POST { preview_hash, issued_at, idempotency_key } — applies a previously
 * previewed confirm. The three fields must come from a prior /preview call's
 * response; the RPC itself re-validates them (hash/expiry/idempotency), this
 * route does not trust anything beyond passing them through.
 */
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
  const previewHash = typeof body?.preview_hash === "string" ? body.preview_hash : "";
  const issuedAt = typeof body?.issued_at === "string" ? body.issued_at : "";
  const idempotencyKey = typeof body?.idempotency_key === "string" ? body.idempotency_key : "";

  if (!previewHash || !issuedAt || !idempotencyKey) {
    return NextResponse.json({ ok: false, reason: "missing_preview_binding" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase.rpc("confirm_pm_sales_draft_v1", {
    p_draft_id: id,
    p_actor_id: session.staffId,
    p_preview_hash: previewHash,
    p_issued_at: issuedAt,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 409 });
  }

  return NextResponse.json(data);
}

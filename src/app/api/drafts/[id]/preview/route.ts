import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/current-session";
import { getServiceSupabase } from "@/lib/supabase/service";

const CAN_ACT_ROLES = ["operator", "mapping_reviewer", "administrator"];

/** POST — preview a draft confirm (read-only, no DB writes). */
export async function POST(
  _request: NextRequest,
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
  const supabase = getServiceSupabase();

  const { data, error } = await supabase.rpc("preview_pm_sales_draft_confirm_v1", {
    p_draft_id: id,
    p_actor_id: session.staffId,
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: "rpc_error", detail: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

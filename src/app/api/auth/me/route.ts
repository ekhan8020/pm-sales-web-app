import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/current-session";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ ok: false, reason: "not_authenticated" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, session });
}

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/current-session";
import { NavLink } from "@/components/nav-link";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div style={{ background: "var(--background)" }} className="flex min-h-screen">
      <aside
        style={{ background: "var(--sidebar)" }}
        className="flex w-[220px] shrink-0 flex-col gap-1.5 p-6"
      >
        <div className="flex items-center gap-2 px-2.5 pb-5">
          <div style={{ background: "var(--accent)" }} className="h-6 w-6 rounded-lg" />
          <span className="text-sm font-extrabold text-white">BMT PM Sales</span>
        </div>

        <NavLink href="/drafts">📝 草稿 / 订单</NavLink>
        {session.role === "administrator" || session.role === "mapping_reviewer" ? (
          <NavLink href="/admin/mapping-review">🗂️ 映射审核</NavLink>
        ) : null}
        {session.role === "administrator" ? (
          <NavLink href="/admin/exceptions">⚠️ 系统异常</NavLink>
        ) : null}

        <div className="flex-1" />

        <div
          style={{ borderColor: "#3a362f" }}
          className="flex flex-col gap-1 border-t pt-3.5 text-sm"
        >
          <span style={{ color: "var(--sidebar-text)" }}>
            👤 {session.username}（{session.role}）
          </span>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

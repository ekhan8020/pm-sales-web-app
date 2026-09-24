import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/current-session";
import { getServiceSupabase } from "@/lib/supabase/service";

const PROBLEM_STATUSES = ["write_failed", "write_partial", "reconciled_missing"];

export default async function ExceptionsPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "administrator") {
    redirect("/drafts");
  }

  const supabase = getServiceSupabase();

  const { data: rows, error } = await supabase
    .from("order_sync_monitor")
    .select("id, source_system, source_record_id, source_status, severity, error_message, last_seen_at")
    .in("source_status", PROBLEM_STATUSES)
    .order("last_seen_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold" style={{ color: "var(--foreground)" }}>
          系统异常
        </h1>
        <span
          style={{ background: "#ece8de", color: "#6b6558" }}
          className="rounded-full px-3 py-1 text-xs font-bold"
        >
          仅 administrator 可见
        </span>
      </div>

      {error ? (
        <p style={{ color: "var(--danger)" }} className="text-sm">
          读取失败：{error.message}
        </p>
      ) : null}

      <div
        style={{ background: "var(--card)", borderRadius: "var(--radius-card)" }}
        className="flex flex-col gap-2 p-5 shadow-sm"
      >
        {(rows ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>没有发现异常</p>
        ) : (
          (rows ?? []).map((row) => (
            <div
              key={row.id}
              style={{ background: "var(--danger-bg)" }}
              className="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  style={{ color: "var(--danger)" }}
                  className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold"
                >
                  {row.source_status}
                </span>
                <span>
                  {row.source_system} · {row.source_record_id}
                </span>
              </div>
              <span style={{ color: "var(--ink-soft)" }} className="text-xs">
                {new Date(row.last_seen_at).toLocaleString("zh-CN")}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
        这份清单直接读 `order_sync_monitor`（跟 Telegram 生产流程共用同一张表），不是独立的检测逻辑，跟之前设计文档里"网页异常页面自己复刻检测查询"的方向一致，目前只做了最基本的按 source_status 筛选。
      </p>
    </div>
  );
}

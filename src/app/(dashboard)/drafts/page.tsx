import { getServiceSupabase } from "@/lib/supabase/service";

const STATUS_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "待处理", bg: "var(--accent-soft)", fg: "var(--accent-dark)" },
  confirmed: { label: "已确认", bg: "var(--success-bg)", fg: "var(--success)" },
  cancelled: { label: "已取消", bg: "#ece8de", fg: "#6b6558" },
  needs_resubmit: { label: "需重新提交", bg: "var(--danger-bg)", fg: "var(--danger)" },
};

export default async function DraftsPage() {
  const supabase = getServiceSupabase();

  // Direct filtered read via the service client — this is a plain SELECT with
  // no state-changing effect, so it does not need a dedicated RPC the way
  // confirm/cancel/alias-approval do. Confirm/cancel actions are not wired up
  // yet; this page is read-only for now.
  const { data: drafts, error } = await supabase
    .from("pm_sales_drafts")
    .select(
      "id, source_channel, sales_platform, contact_source, customer_name, revenue_amount, parse_status, confirmation_status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: "var(--foreground)" }}>
          草稿 / 订单列表
        </h1>
      </div>

      {error ? (
        <p style={{ color: "var(--danger)" }} className="text-sm">
          读取失败：{error.message}
        </p>
      ) : null}

      <div
        style={{ background: "var(--card)", borderRadius: "var(--radius-card)" }}
        className="overflow-hidden shadow-sm"
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: "var(--ink-soft)" }} className="text-left text-xs uppercase">
              <th className="px-4 py-3 font-bold">状态</th>
              <th className="px-4 py-3 font-bold">来源</th>
              <th className="px-4 py-3 font-bold">客户</th>
              <th className="px-4 py-3 font-bold">平台</th>
              <th className="px-4 py-3 font-bold">金额</th>
              <th className="px-4 py-3 font-bold">解析状态</th>
              <th className="px-4 py-3 font-bold">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {(drafts ?? []).map((d) => {
              const status = STATUS_LABEL[d.confirmation_status] ?? {
                label: d.confirmation_status,
                bg: "#ece8de",
                fg: "#6b6558",
              };
              return (
                <tr key={d.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td className="px-4 py-3">
                    <span
                      style={{ background: status.bg, color: status.fg }}
                      className="rounded-full px-3 py-1 text-xs font-bold"
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">{d.source_channel}</td>
                  <td className="px-4 py-3">{d.customer_name ?? "—"}</td>
                  <td className="px-4 py-3">{d.sales_platform ?? "—"}</td>
                  <td className="px-4 py-3">
                    {d.revenue_amount != null ? `RM ${Number(d.revenue_amount).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3">{d.parse_status}</td>
                  <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                    {new Date(d.created_at).toLocaleString("zh-CN")}
                  </td>
                </tr>
              );
            })}
            {(drafts ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "var(--ink-soft)" }}>
                  暂无草稿
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
        这一页目前是只读的——新建/确认/取消草稿的表单还没接上，需要单独设计商品搜索、预览、确认三步流程。
      </p>
    </div>
  );
}

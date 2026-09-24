import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/current-session";
import { getServiceSupabase } from "@/lib/supabase/service";

export default async function MappingReviewPage() {
  const session = await getCurrentSession();
  if (!session || (session.role !== "administrator" && session.role !== "mapping_reviewer")) {
    redirect("/drafts");
  }

  const supabase = getServiceSupabase();

  const [pmAliasResult, shopifyResult, shopeeResult] = await Promise.all([
    supabase.rpc("list_pm_alias_review_queue_v1", { p_actor_id: session.staffId }),
    supabase.rpc("list_mapping_review_queue_v1", {
      p_actor_id: session.staffId,
      p_platform: "shopify",
      p_status: "needs_review",
      p_search: null,
      p_page: 1,
      p_page_size: 10,
    }),
    supabase.rpc("list_mapping_review_queue_v1", {
      p_actor_id: session.staffId,
      p_platform: "shopee",
      p_status: "needs_review",
      p_search: null,
      p_page: 1,
      p_page_size: 10,
    }),
  ]);

  const pmQueue = pmAliasResult.data?.queue ?? [];
  const shopifyQueue = shopifyResult.data?.rows ?? [];
  const shopifyTotal = shopifyResult.data?.total ?? 0;
  const shopeeQueue = shopeeResult.data?.rows ?? [];
  const shopeeTotal = shopeeResult.data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-extrabold" style={{ color: "var(--foreground)" }}>
        映射审核
      </h1>

      <section
        style={{ background: "var(--card)", borderRadius: "var(--radius-card)" }}
        className="flex flex-col gap-3 p-5 shadow-sm"
      >
        <h2 className="text-sm font-extrabold">PM Sales 未解决短语（{pmQueue.length}）</h2>
        {pmQueue.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>暂无待处理项</p>
        ) : (
          pmQueue.map((item: { raw_phrase: string; affected_draft_count: number }) => (
            <div
              key={item.raw_phrase}
              style={{ borderColor: "var(--line)" }}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>{item.raw_phrase}</span>
              <span style={{ color: "var(--ink-soft)" }}>影响 {item.affected_draft_count} 条草稿</span>
            </div>
          ))
        )}
        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
          批准/拒绝操作的界面还没接上（对应 `preview_pm_alias_approval_v1`/`apply_pm_alias_approval_v1`）。
        </p>
      </section>

      <section
        style={{ background: "var(--card)", borderRadius: "var(--radius-card)" }}
        className="flex flex-col gap-3 p-5 shadow-sm"
      >
        <h2 className="text-sm font-extrabold">Shopify 待审核（显示 {shopifyQueue.length} / 共 {shopifyTotal}）</h2>
        {shopifyQueue.map((row: { id: string; source_identity: { product_title: string; variant_title: string } }) => (
          <div key={row.id} style={{ borderColor: "var(--line)" }} className="rounded-lg border px-3 py-2 text-sm">
            {row.source_identity.product_title} — {row.source_identity.variant_title}
          </div>
        ))}
      </section>

      <section
        style={{ background: "var(--card)", borderRadius: "var(--radius-card)" }}
        className="flex flex-col gap-3 p-5 shadow-sm"
      >
        <h2 className="text-sm font-extrabold">Shopee 待审核（显示 {shopeeQueue.length} / 共 {shopeeTotal}）</h2>
        {shopeeQueue.map((row: { id: string; source_identity: { item_name: string; model_name: string } }) => (
          <div key={row.id} style={{ borderColor: "var(--line)" }} className="rounded-lg border px-3 py-2 text-sm">
            {row.source_identity.item_name} — {row.source_identity.model_name}
          </div>
        ))}
        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
          Shopify/Shopee 目前只有只读端点（A2.7 阶段一），激活/停用/回滚操作按设计要分阶段单独实现，这里不会有"批准"按钮。
        </p>
      </section>
    </div>
  );
}

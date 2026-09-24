"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PreviewResult = {
  ok: boolean;
  reason?: string;
  unresolved_item_count?: number;
  preview_hash?: string;
  issued_at?: string;
  current_status?: string;
  parse_status?: string;
};

const REASON_LABEL: Record<string, string> = {
  draft_not_pending: "草稿已不是待处理状态",
  draft_not_parsed: "草稿尚未解析完成",
  no_items: "草稿没有商品项",
  platform_not_selected: "销售平台/联系来源未确定",
};

export function DraftActions({ draftId }: { draftId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  async function runPreview() {
    setBusy(true);
    setErrorText(null);
    try {
      const res = await fetch(`/api/drafts/${draftId}/preview`, { method: "POST" });
      const data = (await res.json()) as PreviewResult;
      if (!res.ok) {
        setErrorText(data.reason ?? "预览失败");
        return;
      }
      setPreview(data);
      if (!data.ok) {
        setErrorText(REASON_LABEL[data.reason ?? ""] ?? data.reason ?? "无法确认");
      }
    } catch {
      setErrorText("网络错误，预览失败");
    } finally {
      setBusy(false);
    }
  }

  async function runConfirm() {
    if (!preview?.preview_hash || !preview?.issued_at) return;
    setBusy(true);
    setErrorText(null);
    try {
      const res = await fetch(`/api/drafts/${draftId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preview_hash: preview.preview_hash,
          issued_at: preview.issued_at,
          idempotency_key: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setErrorText(data.reason ?? "确认失败");
        return;
      }
      setPreview(null);
      router.refresh();
    } catch {
      setErrorText("网络错误，确认失败");
    } finally {
      setBusy(false);
    }
  }

  async function runCancel() {
    if (!cancelReason.trim()) {
      setErrorText("请填写取消原因");
      return;
    }
    setBusy(true);
    setErrorText(null);
    try {
      const res = await fetch(`/api/drafts/${draftId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim(), idempotency_key: crypto.randomUUID() }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setErrorText(data.reason ?? "取消失败");
        return;
      }
      setShowCancelForm(false);
      setCancelReason("");
      router.refresh();
    } catch {
      setErrorText("网络错误，取消失败");
    } finally {
      setBusy(false);
    }
  }

  if (preview?.ok) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div
          style={{ borderColor: "var(--line)" }}
          className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs"
        >
          <span>未匹配商品：{preview.unresolved_item_count ?? 0}</span>
          <span style={{ color: "var(--ink-soft)" }}>预览 5 分钟内有效，确认前请核对上方商品数量</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreview(null)}
            disabled={busy}
            className="rounded-md px-3 py-1 text-xs font-bold"
            style={{ background: "#ece8de", color: "#6b6558" }}
          >
            取消预览
          </button>
          <button
            onClick={runConfirm}
            disabled={busy || (preview.unresolved_item_count ?? 0) > 0}
            className="rounded-md px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {busy ? "处理中…" : "确认下单"}
          </button>
        </div>
        {errorText ? (
          <span style={{ color: "var(--danger)" }} className="text-xs">{errorText}</span>
        ) : null}
      </div>
    );
  }

  if (showCancelForm) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <input
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="取消原因（必填）"
          style={{ borderColor: "var(--line)" }}
          className="w-48 rounded-md border px-2 py-1 text-xs"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCancelForm(false);
              setCancelReason("");
              setErrorText(null);
            }}
            disabled={busy}
            className="rounded-md px-3 py-1 text-xs font-bold"
            style={{ background: "#ece8de", color: "#6b6558" }}
          >
            返回
          </button>
          <button
            onClick={runCancel}
            disabled={busy}
            className="rounded-md px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
            style={{ background: "var(--danger)" }}
          >
            {busy ? "处理中…" : "确定取消"}
          </button>
        </div>
        {errorText ? (
          <span style={{ color: "var(--danger)" }} className="text-xs">{errorText}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <button
          onClick={runPreview}
          disabled={busy}
          className="rounded-md px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {busy ? "处理中…" : "确认"}
        </button>
        <button
          onClick={() => setShowCancelForm(true)}
          disabled={busy}
          className="rounded-md px-3 py-1 text-xs font-bold"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
        >
          取消
        </button>
      </div>
      {errorText ? (
        <span style={{ color: "var(--danger)" }} className="text-xs">{errorText}</span>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (newPassword.length < 8) {
      setError("密码至少需要 8 位");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError("修改密码失败，请稍后重试");
        return;
      }

      router.push("/drafts");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ background: "var(--background)" }}
      className="flex min-h-screen items-center justify-center px-4"
    >
      <form
        onSubmit={handleSubmit}
        style={{ background: "var(--card)", borderRadius: "var(--radius-card)" }}
        className="flex w-full max-w-sm flex-col gap-5 p-10 shadow-sm"
      >
        <div
          style={{ background: "var(--accent-soft)" }}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
        >
          🔑
        </div>
        <h1 className="text-lg font-extrabold" style={{ color: "var(--foreground)" }}>
          请设置新密码
        </h1>
        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
          首次使用预设密码登录，需先设置新密码才能继续
        </p>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
            新密码
          </span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ borderColor: "var(--line)", background: "#fbfaf7" }}
            className="rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
            确认新密码
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ borderColor: "var(--line)", background: "#fbfaf7" }}
            className="rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        {error ? (
          <p style={{ color: "var(--danger)", background: "var(--danger-bg)" }} className="rounded-lg px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{ background: "var(--accent)" }}
          className="rounded-full py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "提交中…" : "确认修改并进入系统"}
        </button>
      </form>
    </div>
  );
}

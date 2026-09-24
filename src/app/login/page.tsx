"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError("用户名或密码不正确");
        return;
      }

      router.push(data.mustChangePassword ? "/change-password" : "/drafts");
      router.refresh();
    } catch {
      setError("登录失败，请稍后重试");
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
        style={{
          background: "var(--card)",
          borderRadius: "var(--radius-card)",
        }}
        className="flex w-full max-w-sm flex-col gap-5 p-10 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <div
            style={{ background: "var(--accent)" }}
            className="h-7 w-7 rounded-lg"
          />
          <span className="text-sm font-extrabold" style={{ color: "var(--foreground)" }}>
            BMT PM Sales
          </span>
        </div>

        <h1 className="text-xl font-extrabold" style={{ color: "var(--foreground)" }}>
          员工登录
        </h1>

        <label className="flex flex-col gap-1.5 text-sm">
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--ink-soft)" }}
          >
            用户名
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            style={{ borderColor: "var(--line)", background: "#fbfaf7" }}
            className="rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--ink-soft)" }}
          >
            密码
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{ borderColor: "var(--line)", background: "#fbfaf7" }}
            className="rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>

        {error ? (
          <p style={{ color: "var(--danger)" }} className="text-sm">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{ background: "var(--accent)" }}
          className="rounded-full py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "登录中…" : "登录"}
        </button>

        <p className="text-center text-xs" style={{ color: "var(--ink-soft)" }}>
          忘记密码请联系管理员重置
        </p>
      </form>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

type LoginState = {
  loading: boolean;
  error: string | null;
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("star");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>({ loading: false, error: null });

  const nextPath = searchParams.get("next") || "/";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({ loading: true, error: null });

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const payload = JSON.parse(text) as { message?: string };
        setState({ loading: false, error: payload.message ?? "Login failed" });
      } catch {
        setState({ loading: false, error: text || "Login failed" });
      }
      return;
    }

    window.location.href = nextPath;
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-8">
      <section className="museum-panel w-full rounded-3xl p-6">
        <p className="mb-2 text-xs text-[var(--muted)]">PRIVATE ACCESS</p>
        <h1 className="museum-title text-3xl text-[var(--ink)]">进入食物博物馆</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">仅允许你的个人账号访问和上传。</p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--muted)]">账号</span>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 outline-none focus:border-[var(--accent)]"
              onChange={(e) => setUsername(e.target.value)}
              required
              value={username}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--muted)]">密码</span>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 outline-none focus:border-[var(--accent)]"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button
            className="h-12 w-full rounded-2xl bg-[var(--ink)] text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={state.loading}
            type="submit"
          >
            {state.loading ? "登录中..." : "登录"}
          </button>
        </form>

        {state.error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {state.error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@nsperfume.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6f7] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-[#e1e3e5] bg-white p-8 shadow-sm"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-[#6d7175]">
          NS Perfume
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Log in to admin
        </h1>
        <p className="mt-2 text-sm text-[#6d7175]">
          First login with the bootstrap credentials creates your owner account.
        </p>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#c9cccf] px-3 py-2.5 text-sm outline-none focus:border-[#005bd3]"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#c9cccf] px-3 py-2.5 text-sm outline-none focus:border-[#005bd3]"
          />
        </label>
        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#1a1a1a] py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}

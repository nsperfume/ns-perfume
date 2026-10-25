"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password needs at least 6 characters"),
});

/**
 * Where to go after sign-in. Only same-site admin paths from `?next=`
 * (set by the admin gate) are honored; anything else falls back to /admin.
 */
function nextAdminPath() {
  try {
    const next = new URLSearchParams(window.location.search).get("next") || "";
    if (
      next.startsWith("/admin") &&
      !next.startsWith("//") &&
      !next.includes("\\") &&
      !next.startsWith("/admin/login")
    ) {
      return next;
    }
  } catch {
    /* ignore */
  }
  return "/admin";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Already signed in (DB-checked by the API): skip the form.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.ok) router.replace(nextAdminPath());
      })
      .catch(() => {
        /* stay on the form */
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] || "form");
        if (!next[k]) next[k] = issue.message;
      }
      setFieldErrors(next);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push(nextAdminPath());
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#eef0f3] px-4 py-10">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md rounded-lg border border-[#e4e6ea] bg-paper p-8 shadow-[0_8px_30px_rgba(28,31,38,0.06)] sm:p-10"
      >
        <Logo className="h-7 text-ink" />
        <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink">
          Admin sign in
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[#5c6370]">
          First bootstrap login creates the owner account.
        </p>
        <div className="mt-8 space-y-5">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            error={fieldErrors.email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            error={fieldErrors.password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error ? (
          <p className="mt-4 text-base font-medium text-rosewood">{error}</p>
        ) : null}
        <Button type="submit" disabled={loading} className="mt-8 w-full sm:w-full">
          {loading ? "Signing in…" : "Log in"}
        </Button>
        <Link
          href="/"
          className="mt-6 block text-center font-display text-sm font-medium text-brass underline-offset-4 hover:underline"
        >
          Back to store
        </Link>
      </form>
    </div>
  );
}

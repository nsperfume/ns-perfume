"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";

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
  const formRef = useRef<HTMLFormElement>(null);

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
      // Focus the first field with an error
      requestAnimationFrame(() => {
        const first = ["email", "password"].find((k) => next[k]);
        if (first) formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      });
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
    <div className="admin-app flex min-h-dvh items-center justify-center px-4 py-10">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md rounded-xl border border-admin-line bg-admin-paper p-7 shadow-[0_12px_40px_rgba(28,26,23,0.08)] sm:p-10"
      >
        <Logo className="h-7 text-admin-ink" />
        <h1 className="mt-7 text-[1.625rem] font-semibold tracking-[-0.015em] text-admin-ink">
          Sign in to your store
        </h1>
        <div className="mt-7 space-y-5">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            value={email}
            error={fieldErrors.email}
            aria-invalid={fieldErrors.email ? true : undefined}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            value={password}
            error={fieldErrors.password}
            aria-invalid={fieldErrors.password ? true : undefined}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-md border border-(--admin-tone-rose-line) bg-(--admin-tone-rose-bg) px-4 py-3 text-[0.9375rem] font-medium text-(--admin-tone-rose-text)"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={loading} className="mt-7 w-full sm:w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <Link
          href="/"
          className="mt-5 block text-center text-sm font-semibold text-admin-accent underline-offset-4 hover:underline"
        >
          Back to store
        </Link>
      </form>
    </div>
  );
}

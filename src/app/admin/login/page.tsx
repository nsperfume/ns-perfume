"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";
import { AdminIcon } from "@/components/admin/ui";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email")
    .pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password"),
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
  const [showPassword, setShowPassword] = useState(false);
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
      // Temporary password from the owner: choose your own before anything else.
      router.push(json.data?.mustChangePassword ? "/admin/profile" : nextAdminPath());
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
          <div className="flex flex-col gap-2 text-sm font-semibold text-taupe">
            <label htmlFor="admin-password" className="text-ink/80">
              Password
              <span aria-hidden="true" className="ml-0.5 text-rosewood">
                *
              </span>
            </label>
            <div className="relative">
              <Input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? "admin-password-message" : undefined}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="pr-13!"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                aria-controls="admin-password"
                className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center rounded-r-xs text-admin-muted outline-none transition-colors hover:text-admin-ink focus-visible:ring-2 focus-visible:ring-brass/50"
              >
                <AdminIcon name={showPassword ? "hide" : "view"} size={19} />
              </button>
            </div>
            {fieldErrors.password ? (
              <span id="admin-password-message" className="text-sm font-medium text-rosewood">
                {fieldErrors.password}
              </span>
            ) : null}
            <Link
              href="/admin/forgot-password"
              className="self-end text-sm font-semibold text-admin-accent underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
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

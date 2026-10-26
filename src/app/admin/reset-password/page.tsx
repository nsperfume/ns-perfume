"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";
import { AdminAuthCard } from "@/components/admin/auth-card";
import { AdminFormError } from "@/components/admin/form-validation";
import { PASSWORD_HINT, clientPasswordProblem } from "@/lib/admin-password";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <AdminAuthCard title="This link is incomplete" intro="Open the newest reset email again, or ask for a new link.">
        <Link href="/admin/forgot-password" className="inline-flex text-sm font-semibold text-admin-accent hover:underline">
          Ask for a new link
        </Link>
      </AdminAuthCard>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const next: Record<string, string> = {};
    const problem = clientPasswordProblem(password);
    if (problem) next.password = problem;
    if (!confirm) next.confirm = "Type the new password again";
    else if (confirm !== password) next.confirm = "The passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        const fe = (json?.details?.fieldErrors ?? {}) as Record<string, string>;
        if (Object.keys(fe).length) setErrors(fe);
        else setFormError(json?.error || "Could not update the password.");
      } else {
        setDone(json.data?.message || "Password updated.");
      }
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AdminAuthCard title="Password updated" intro={done}>
        <Button href="/admin/login" className="w-full sm:w-full!">
          Sign in
        </Button>
      </AdminAuthCard>
    );
  }

  return (
    <AdminAuthCard title="Choose a new password" intro="Every device signed in to this account will be signed out.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Input
          label="New password"
          name="password"
          type="password"
          required
          value={password}
          error={errors.password}
          hint={PASSWORD_HINT}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          autoFocus
        />
        <Input
          label="Confirm new password"
          name="confirm"
          type="password"
          required
          value={confirm}
          error={errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        {formError ? <AdminFormError>{formError}</AdminFormError> : null}
        <Button type="submit" disabled={loading} className="w-full sm:w-full!">
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AdminAuthCard>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}

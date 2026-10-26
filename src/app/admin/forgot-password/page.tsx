"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";
import { AdminAuthCard } from "@/components/admin/auth-card";
import { AdminFormError } from "@/components/admin/form-validation";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [sent, setSent] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldError(value ? "Enter a valid email" : "Enter your email");
      return;
    }
    setFieldError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) setError(json?.error || "Could not send the email. Please try again.");
      else setSent(json.data?.message || "Check your inbox for a reset link.");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthCard
      title={sent ? "Check your inbox" : "Reset your password"}
      intro={sent ? undefined : "Enter the email you sign in with. We will send you a link to choose a new password."}
    >
      {sent ? (
        <div className="space-y-6">
          <p role="status" className="text-[0.9375rem] leading-relaxed text-admin-ink">
            {sent}
          </p>
          <Link href="/admin/login" className="inline-flex text-sm font-semibold text-admin-accent hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            value={email}
            error={fieldError}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoFocus
          />
          {error ? <AdminFormError>{error}</AdminFormError> : null}
          <Button type="submit" disabled={loading} className="w-full sm:w-full!">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
          <Link href="/admin/login" className="inline-flex text-sm font-semibold text-admin-accent hover:underline">
            Back to sign in
          </Link>
        </form>
      )}
    </AdminAuthCard>
  );
}

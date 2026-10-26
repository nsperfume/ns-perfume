"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomer } from "@/context/customer";

export default function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();
  const { refresh } = useCustomer();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!token) {
    return (
      <div className="mt-8 border border-hairline bg-paper p-6 sm:p-8">
        <p className="text-body text-ink">
          This link is incomplete. Request a new one from the{" "}
          <Link href="/account" className="underline underline-offset-4">
            sign in page
          </Link>
          .
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Could not reset the password.");
        return;
      }
      await refresh();
      router.replace("/account");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="mt-4 text-body-lg text-taupe">
        Use at least 8 characters. After saving you will be signed in.
      </p>
      <div className="mt-8 border border-hairline bg-paper p-6 sm:p-8">
        <form className="space-y-4" onSubmit={submit} noValidate>
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label="Repeat new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error ? (
            <p className="text-body-sm text-rosewood" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save new password"}
          </Button>
        </form>
      </div>
    </>
  );
}

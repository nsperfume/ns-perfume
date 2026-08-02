"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [rates, setRates] = useState<{
    updatedAt?: string;
    source?: string;
    rates?: Record<string, number>;
  } | null>(null);
  const [topbarText, setTopbarText] = useState("");
  const [topbarEnabled, setTopbarEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    fetch("/api/currency/rates")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setRates(j.data);
      });
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.data) {
          setTopbarText(j.data.topbarText || "");
          setTopbarEnabled(Boolean(j.data.topbarEnabled));
        }
      });
  }, [router]);

  async function saveTopbar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topbarText, topbarEnabled }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || "Could not save.");
        return;
      }
      setTopbarText(j.data.topbarText);
      setTopbarEnabled(j.data.topbarEnabled);
      setMessage("Top bar saved. Storefront will pick it up on the next load.");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell user={user}>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="grid max-w-2xl gap-4">
        <section className="rounded-xl border border-[#e1e3e5] bg-white p-6">
          <h2 className="font-semibold">Top bar announcement</h2>
          <p className="mt-1 text-sm text-[#6d7175]">
            Shown above the black header on every storefront page. Keep it short
            and specific. Gold bar (#A9873C).
          </p>
          <form className="mt-4 space-y-4" onSubmit={saveTopbar}>
            <label className="block text-sm font-medium text-[#202223]">
              Message
              <textarea
                value={topbarText}
                onChange={(e) => setTopbarText(e.target.value)}
                rows={3}
                maxLength={220}
                className="mt-1.5 w-full rounded-lg border border-[#c9cccf] px-3 py-2 text-sm outline-none focus:border-[#A9873C]"
                placeholder="e.g. Complimentary shipping over Rs 8,000 · New arrivals this week"
                required
              />
              <span className="mt-1 block text-xs text-[#6d7175]">
                {topbarText.length}/220
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-[#202223]">
              <input
                type="checkbox"
                checked={topbarEnabled}
                onChange={(e) => setTopbarEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#A9873C]"
              />
              Show top bar on storefront
            </label>
            {error ? (
              <p className="text-sm text-[#8B4A45]">{error}</p>
            ) : null}
            {message ? (
              <p className="text-sm text-[#1f7a3a]">{message}</p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save top bar"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-[#e1e3e5] bg-white p-6">
          <h2 className="font-semibold">Store</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#4a4a4a]">
            <li>
              Default currency: <strong>PKR</strong>
            </li>
            <li>Display currencies: PKR, USD, AED, SAR, GBP, EUR</li>
            <li>Prices stored in MongoDB as PKR integers</li>
            <li>
              Live rates source: {rates?.source || "…"} · updated{" "}
              {rates?.updatedAt
                ? new Date(rates.updatedAt).toLocaleString()
                : "—"}
            </li>
          </ul>
          {rates?.rates ? (
            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-xs">
              {["PKR", "USD", "AED", "SAR", "GBP", "EUR"].map((c) => (
                <div key={c} className="rounded bg-[#f6f6f7] px-2 py-1">
                  1 PKR → {c} {(rates.rates?.[c] ?? 0).toPrecision(4)}
                </div>
              ))}
            </div>
          ) : null}
        </section>
        <section className="rounded-xl border border-[#e1e3e5] bg-white p-6">
          <h2 className="font-semibold">Cloudinary</h2>
          <p className="mt-2 text-sm text-[#4a4a4a]">
            Set these in{" "}
            <code className="rounded bg-[#f1f2f3] px-1">.env.local</code>:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-[#1a1a1a] p-4 text-xs text-white">
            {`CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=ns-perfume`}
          </pre>
        </section>
        <section className="rounded-xl border border-[#e1e3e5] bg-white p-6">
          <h2 className="font-semibold">Admin access</h2>
          <p className="mt-2 text-sm text-[#4a4a4a]">
            Logged in as {user?.email}. Bootstrap credentials from{" "}
            <code className="rounded bg-[#f1f2f3] px-1">ADMIN_EMAIL</code> /{" "}
            <code className="rounded bg-[#f1f2f3] px-1">ADMIN_PASSWORD</code> on
            first empty database.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}

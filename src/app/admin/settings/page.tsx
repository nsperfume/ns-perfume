"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { MoonIcon, SunIcon } from "@animateicons/react/lucide";
import { AdminShell } from "@/components/admin/admin-shell";
import { CouponManager } from "@/components/admin/coupon-manager";
import {
  AdminCard,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdminTheme, type AdminTheme } from "@/context/admin-theme";
import { cn } from "@/lib/cn";

type AdminUser = {
  email?: string;
  name?: string;
  role?: string;
  isSuperAdmin?: boolean;
};

type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const topbarSchema = z.object({
  topbarText: z
    .string()
    .trim()
    .min(4, "Message is too short")
    .max(220, "Keep under 220 characters"),
  topbarEnabled: z.boolean(),
});

function AppearancePicker() {
  const { theme, setTheme } = useAdminTheme();
  const options: {
    id: AdminTheme;
    label: string;
    hint: string;
    Icon: typeof SunIcon;
  }[] = [
    {
      id: "light",
      label: "Light",
      hint: "Soft stone background, white panels",
      Icon: SunIcon,
    },
    {
      id: "dark",
      label: "Dark",
      hint: "Dim charcoal panels for night work",
      Icon: MoonIcon,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map(({ id, label, hint, Icon }) => {
        const selected = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors",
              selected
                ? "border-[var(--admin-ink)] bg-[var(--admin-ink)] text-[var(--admin-paper)]"
                : "border-[var(--admin-line)] bg-[var(--admin-soft-2)] text-[var(--admin-ink)] hover:border-[var(--admin-muted)]",
            )}
          >
            <span className="inline-flex items-center gap-2 font-display text-sm font-medium">
              <Icon size={16} color="currentColor" isAnimated={false} />
              {label}
            </span>
            <span
              className={cn(
                "text-sm leading-snug",
                selected
                  ? "text-[var(--admin-paper)]/70"
                  : "text-[var(--admin-muted)]",
              )}
            >
              {hint}
            </span>
            {selected ? (
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-brass">
                Active
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [rates, setRates] = useState<{
    updatedAt?: string;
    source?: string;
    rates?: Record<string, number>;
  } | null>(null);

  const [topbarText, setTopbarText] = useState("");
  const [topbarEnabled, setTopbarEnabled] = useState(true);
  const [savingTopbar, setSavingTopbar] = useState(false);
  const [topbarMessage, setTopbarMessage] = useState<string | null>(null);
  const [topbarError, setTopbarError] = useState<string | null>(null);

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamForm, setTeamForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSaving, setTeamSaving] = useState(false);
  const [removeTeamId, setRemoveTeamId] = useState<string | null>(null);
  const [removingTeam, setRemovingTeam] = useState(false);

  const isSuper = Boolean(user?.isSuperAdmin || user?.role === "super_admin");

  function loadTeam() {
    if (!isSuper && user) return;
    fetch("/api/admin/team")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setTeam(j.data);
      });
  }

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

  useEffect(() => {
    if (isSuper) loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuper]);

  // Deep-link from dashboard: /admin/settings#coupons etc.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
    return () => window.clearTimeout(t);
  }, [user, isSuper]);

  async function saveTopbar(e: React.FormEvent) {
    e.preventDefault();
    setSavingTopbar(true);
    setTopbarMessage(null);
    setTopbarError(null);
    const parsed = topbarSchema.safeParse({ topbarText, topbarEnabled });
    if (!parsed.success) {
      setTopbarError(parsed.error.issues[0]?.message || "Invalid form");
      setSavingTopbar(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const j = await res.json();
      if (!j.ok) {
        setTopbarError(j.error || "Could not save.");
        return;
      }
      setTopbarText(j.data.topbarText);
      setTopbarEnabled(j.data.topbarEnabled);
      setTopbarMessage("Announcement bar saved.");
    } catch {
      setTopbarError("Network error while saving.");
    } finally {
      setSavingTopbar(false);
    }
  }

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setTeamSaving(true);
    setTeamError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm),
      });
      const j = await res.json();
      if (!j.ok) {
        setTeamError(j.error || "Could not create admin");
        return;
      }
      setTeamForm({ name: "", email: "", password: "" });
      loadTeam();
    } catch {
      setTeamError("Network error");
    } finally {
      setTeamSaving(false);
    }
  }

  async function confirmRemoveTeam() {
    if (!removeTeamId) return;
    setRemovingTeam(true);
    try {
      await fetch(`/api/admin/team/${removeTeamId}`, { method: "DELETE" });
      setRemoveTeamId(null);
      loadTeam();
    } finally {
      setRemovingTeam(false);
    }
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Settings"
        description="Announcement, coupons, account, appearance, and team."
      />

      <div className="grid max-w-3xl gap-5">
        <AdminCard title="Profile">
          <div id="profile" className="scroll-mt-24">
          <dl className="divide-y divide-[var(--admin-line)] px-5">
            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Name
              </dt>
              <dd className="text-base text-[var(--admin-ink)]">
                {user?.name || "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Email
              </dt>
              <dd className="text-base text-[var(--admin-ink)]">
                {user?.email || "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
              <dt className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Role
              </dt>
              <dd className="text-base text-[var(--admin-ink)]">
                {isSuper ? "Super admin" : "Admin"}
              </dd>
            </div>
          </dl>
          <div className="border-t border-[var(--admin-line)] px-5 py-4">
            <p className="text-sm text-[var(--admin-muted)]">
              Use Log out in the sidebar when you finish work.
            </p>
          </div>
          </div>
        </AdminCard>

        <div id="appearance" className="scroll-mt-24">
        <AdminCard title="Appearance">
          <div className="space-y-3 px-5 py-5">
            <p className="text-sm leading-relaxed text-[var(--admin-muted)]">
              Console theme only. Storefront branding stays the same.
            </p>
            <AppearancePicker />
          </div>
        </AdminCard>
        </div>

        <div id="announcement" className="scroll-mt-24">
        <AdminCard title="Announcement bar">
          <form className="space-y-4 p-5" onSubmit={saveTopbar} noValidate>
            <Textarea
              label="Message"
              value={topbarText}
              onChange={(e) => setTopbarText(e.target.value)}
              rows={3}
              maxLength={220}
              required
            />
            <p className="text-xs tabular-nums text-[var(--admin-faint)]">
              {topbarText.length}/220
            </p>
            <label className="flex items-center gap-2 text-sm text-[var(--admin-ink)]">
              <input
                type="checkbox"
                checked={topbarEnabled}
                onChange={(e) => setTopbarEnabled(e.target.checked)}
                className="h-4 w-4 accent-brass"
              />
              Show on storefront
            </label>
            {topbarError ? (
              <p className="text-sm font-medium text-rosewood">{topbarError}</p>
            ) : null}
            {topbarMessage ? (
              <p className="text-sm text-[var(--admin-muted)]">{topbarMessage}</p>
            ) : null}
            <Button type="submit" disabled={savingTopbar}>
              {savingTopbar ? "Saving…" : "Save announcement"}
            </Button>
          </form>
        </AdminCard>
        </div>

        <div id="coupons" className="scroll-mt-24">
          <CouponManager canDelete={isSuper} />
        </div>

        <AdminCard title="Store">
          <ul className="space-y-2 px-5 py-5 text-sm text-[var(--admin-muted)]">
            <li>
              Default currency:{" "}
              <strong className="text-[var(--admin-ink)]">PKR</strong>
            </li>
            <li>Display: PKR, USD, AED, SAR, GBP, EUR</li>
            <li>
              Rates: {rates?.source || "…"} ·{" "}
              {rates?.updatedAt
                ? new Date(rates.updatedAt).toLocaleString()
                : "—"}
            </li>
          </ul>
          {rates?.rates ? (
            <div className="grid grid-cols-2 gap-2 border-t border-[var(--admin-line)] px-5 py-4 sm:grid-cols-3">
              {["PKR", "USD", "AED", "SAR", "GBP", "EUR"].map((c) => (
                <div
                  key={c}
                  className="rounded-md border border-[var(--admin-line)] bg-[var(--admin-soft-2)] px-2 py-2 font-mono text-xs text-[var(--admin-ink)]"
                >
                  1 PKR → {c} {(rates.rates?.[c] ?? 0).toPrecision(4)}
                </div>
              ))}
            </div>
          ) : null}
        </AdminCard>

        {isSuper ? (
          <div id="team" className="scroll-mt-24">
          <AdminCard title="Team · admins">
            <form
              className="space-y-4 border-b border-[var(--admin-line)] p-5"
              onSubmit={createAdmin}
            >
              <p className="text-sm text-[var(--admin-muted)]">
                Admins can manage catalog and orders. They cannot delete
                records or view revenue.
              </p>
              <Input
                label="Name"
                required
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, name: e.target.value })
                }
              />
              <Input
                label="Email"
                type="email"
                required
                value={teamForm.email}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, email: e.target.value })
                }
              />
              <Input
                label="Password"
                type="password"
                required
                minLength={8}
                value={teamForm.password}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, password: e.target.value })
                }
              />
              {teamError ? (
                <p className="text-sm font-medium text-rosewood">{teamError}</p>
              ) : null}
              <Button type="submit" disabled={teamSaving}>
                {teamSaving ? "Creating…" : "Add admin"}
              </Button>
            </form>
            <ul className="divide-y divide-[var(--admin-line)]">
              {team.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-[var(--admin-ink)]">
                      {m.name}
                    </p>
                    <p className="text-sm text-[var(--admin-muted)]">
                      {m.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminStatusBadge
                      status={
                        m.role === "super_admin" ? "published" : "draft"
                      }
                    />
                    <span className="text-xs uppercase tracking-wide text-[var(--admin-muted)]">
                      {m.role === "super_admin" ? "Super admin" : "Admin"}
                    </span>
                    {m.role !== "super_admin" ? (
                      <Button
                        type="button"
                        variant="danger"
                        className="!h-10 !min-h-10 !w-auto !px-3"
                        onClick={() => setRemoveTeamId(m.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </AdminCard>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(removeTeamId)}
        onOpenChange={(o) => {
          if (!o && !removingTeam) setRemoveTeamId(null);
        }}
        title="Remove this admin?"
        description="They will lose access to the admin console immediately."
        confirmLabel="Remove admin"
        loading={removingTeam}
        onConfirm={confirmRemoveTeam}
      />
    </AdminShell>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { MoonIcon, SunIcon } from "@animateicons/react/lucide";
import { AdminShell } from "@/components/admin/admin-shell";
import { CouponManager } from "@/components/admin/coupon-manager";
import {
  AdminCard,
  AdminModal,
  AdminPageHeader,
  AdminStatusBadge,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Input, Textarea } from "@/components/admin/input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminFieldLabel } from "@/components/admin/form-section";
import {
  AdminFieldError,
  AdminFormError,
  useFormValidation,
} from "@/components/admin/form-validation";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import { toast } from "@/components/admin/toast";
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

/* Mirrors PUT /api/admin/settings */
const announcementSchema = z.object({
  topbarText: z
    .string()
    .trim()
    .min(1, "Enter a message")
    .max(220, "Use 220 characters or fewer"),
  topbarEnabled: z.boolean(),
});

/* Mirrors POST /api/admin/team */
const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter their name")
    .max(80, "Use 80 characters or fewer"),
  email: z.string().trim().min(1, "Enter their email").email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(120, "Use 120 characters or fewer"),
});

type TeamForm = z.infer<typeof teamSchema>;
const EMPTY_TEAM: TeamForm = { name: "", email: "", password: "" };

const SECTIONS = [
  { id: "announcement", label: "Announcement bar" },
  { id: "coupons", label: "Coupons" },
  { id: "team", label: "Team", superOnly: true },
  { id: "currency", label: "Currency" },
  { id: "appearance", label: "Appearance" },
  { id: "profile", label: "Your account" },
] as const;

const DISPLAY_CURRENCIES = ["USD", "AED", "SAR", "GBP", "EUR"] as const;

function Switch({
  checked,
  onChange,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-paper",
        checked ? "border-brass bg-brass" : "border-admin-input-border bg-admin-soft",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function Section({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      {children}
    </section>
  );
}

function AppearancePicker() {
  const { theme, setTheme } = useAdminTheme();
  const options: { id: AdminTheme; label: string; Icon: typeof SunIcon }[] = [
    { id: "light", label: "Light", Icon: SunIcon },
    { id: "dark", label: "Dark", Icon: MoonIcon },
  ];

  return (
    <div role="radiogroup" aria-label="Admin theme" className="grid gap-3 sm:grid-cols-2">
      {options.map(({ id, label, Icon }) => {
        const selected = theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(id)}
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-4 text-left text-[0.9375rem] font-semibold transition-colors",
              selected
                ? "border-brass bg-admin-soft-2 text-admin-ink ring-1 ring-brass"
                : "border-admin-line bg-admin-paper text-admin-muted hover:border-admin-faint hover:text-admin-ink",
            )}
          >
            <Icon size={18} color="currentColor" isAnimated={false} />
            <span className="flex-1">{label}</span>
            {selected ? (
              <span className="text-xs font-semibold text-admin-accent">In use</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function AddAdminModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<TeamForm>(EMPTY_TEAM);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const v = useFormValidation(teamSchema);
  const dirty = JSON.stringify(form) !== JSON.stringify(EMPTY_TEAM);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_TEAM);
    setServerError(null);
    v.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function update(patch: Partial<TeamForm>) {
    const next = { ...form, ...patch };
    setForm(next);
    if (v.submitted) v.revalidate(next);
  }

  function requestClose() {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!v.validate(form, formRef.current)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      const j = await readAdminJson(res);
      if (!j.ok) {
        const message = j.error || "Could not add this admin";
        if (res.status === 409) v.setErrors({ email: message });
        else setServerError(message);
        toast.error(message);
        return;
      }
      toast.success(`${form.name.trim()} can now sign in`);
      onAdded();
    } catch {
      setServerError("Network error. The admin was not added.");
      toast.error("Network error. The admin was not added.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminModal open={open} onClose={requestClose} title="Add admin">
        <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
          <p className="text-[0.9375rem] text-admin-muted">
            Admins manage products and orders. Only you can delete records or see revenue.
          </p>
          <div data-field="name">
            <AdminFieldLabel htmlFor="team-name" required>
              Name
            </AdminFieldLabel>
            <Input
              id="team-name"
              name="name"
              value={form.name}
              autoComplete="off"
              aria-invalid={v.errors.name ? true : undefined}
              onChange={(e) => update({ name: e.target.value })}
              onBlur={() => v.revalidate(form)}
            />
            <AdminFieldError message={v.errors.name} />
          </div>
          <div data-field="email">
            <AdminFieldLabel htmlFor="team-email" required>
              Email
            </AdminFieldLabel>
            <Input
              id="team-email"
              name="email"
              type="email"
              autoComplete="off"
              value={form.email}
              aria-invalid={v.errors.email ? true : undefined}
              onChange={(e) => update({ email: e.target.value })}
              onBlur={() => v.revalidate(form)}
            />
            <AdminFieldError message={v.errors.email} />
          </div>
          <div data-field="password">
            <AdminFieldLabel htmlFor="team-password" required>
              Password
            </AdminFieldLabel>
            <Input
              id="team-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              aria-invalid={v.errors.password ? true : undefined}
              onChange={(e) => update({ password: e.target.value })}
              onBlur={() => v.revalidate(form)}
            />
            {v.errors.password ? (
              <AdminFieldError message={v.errors.password} />
            ) : (
              <p className="mt-1.5 text-[0.8125rem] text-admin-muted">
                At least 8 characters. Share it with them privately.
              </p>
            )}
          </div>
          <AdminFormError>{serverError}</AdminFormError>
          <div className="flex flex-col-reverse gap-2 border-t border-admin-line pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={requestClose}
              disabled={saving}
              className="sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="sm:w-auto">
              {saving ? "Adding…" : "Add admin"}
            </Button>
          </div>
        </form>
      </AdminModal>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard this admin?"
        description="The details you entered will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
      />
    </>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const announcementRef = useRef<HTMLFormElement>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [rates, setRates] = useState<{
    updatedAt?: string;
    rates?: Record<string, number>;
  } | null>(null);

  const [announcement, setAnnouncement] = useState({
    topbarText: "",
    topbarEnabled: true,
  });
  const [savedAnnouncement, setSavedAnnouncement] = useState(announcement);
  const [announcementLoaded, setAnnouncementLoaded] = useState(false);
  const [savingTopbar, setSavingTopbar] = useState(false);
  const [topbarServerError, setTopbarServerError] = useState<string | null>(null);
  const av = useFormValidation(announcementSchema);

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removingTeam, setRemovingTeam] = useState(false);

  const isSuper = Boolean(user?.isSuperAdmin || user?.role === "super_admin");
  const announcementDirty =
    announcementLoaded &&
    (announcement.topbarText !== savedAnnouncement.topbarText ||
      announcement.topbarEnabled !== savedAnnouncement.topbarEnabled);

  const leaveGuard = useUnsavedChangesGuard(announcementDirty && !savingTopbar);

  function loadTeam() {
    setTeamLoading(true);
    fetch("/api/admin/team")
      .then((r) => readAdminJson<TeamMember[]>(r))
      .then((j) => {
        if (j.ok && j.data) setTeam(j.data);
      })
      .finally(() => setTeamLoading(false));
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
          const next = {
            topbarText: j.data.topbarText || "",
            topbarEnabled: Boolean(j.data.topbarEnabled),
          };
          setAnnouncement(next);
          setSavedAnnouncement(next);
        }
      })
      .finally(() => setAnnouncementLoaded(true));
  }, [router]);

  useEffect(() => {
    if (isSuper) loadTeam();
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

  function updateAnnouncement(patch: Partial<typeof announcement>) {
    const next = { ...announcement, ...patch };
    setAnnouncement(next);
    if (av.submitted) av.revalidate(next);
  }

  async function saveTopbar(e: React.FormEvent) {
    e.preventDefault();
    setTopbarServerError(null);
    if (!av.validate(announcement, announcementRef.current)) return;
    setSavingTopbar(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topbarText: announcement.topbarText.trim(),
          topbarEnabled: announcement.topbarEnabled,
        }),
      });
      const j = await readAdminJson<{ topbarText: string; topbarEnabled: boolean }>(res);
      if (!j.ok || !j.data) {
        const message = j.error || "Could not save the announcement";
        setTopbarServerError(message);
        toast.error(message);
        return;
      }
      const next = {
        topbarText: j.data.topbarText,
        topbarEnabled: j.data.topbarEnabled,
      };
      setAnnouncement(next);
      setSavedAnnouncement(next);
      toast.success("Announcement bar saved");
    } catch {
      setTopbarServerError("Network error. The announcement was not saved.");
      toast.error("Network error. The announcement was not saved.");
    } finally {
      setSavingTopbar(false);
    }
  }

  async function confirmRemoveTeam() {
    if (!removeTarget) return;
    setRemovingTeam(true);
    try {
      const res = await fetch(`/api/admin/team/${removeTarget.id}`, {
        method: "DELETE",
      });
      const j = await readAdminJson(res);
      if (!j.ok) {
        toast.error(j.error || "Could not remove this admin");
        return;
      }
      setTeam((prev) => prev.filter((m) => m.id !== removeTarget.id));
      toast.success(`${removeTarget.name || removeTarget.email} removed`);
    } catch {
      toast.error("Network error. The admin was not removed.");
    } finally {
      setRemoveTarget(null);
      setRemovingTeam(false);
    }
  }

  const sections = SECTIONS.filter((s) => !("superOnly" in s) || isSuper);

  return (
    <AdminShell user={user}>
      <AdminPageHeader title="Settings" />

      <div className="xl:grid xl:grid-cols-[12.5rem_minmax(0,1fr)] xl:gap-10">
        <nav aria-label="Settings sections" className="hidden xl:block">
          <ul className="sticky top-6 space-y-0.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                    history.replaceState(null, "", `#${s.id}`);
                  }}
                  className="flex min-h-10 items-center rounded-md px-3 text-[0.9375rem] font-medium text-admin-muted transition-colors hover:bg-admin-soft hover:text-admin-ink"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid min-w-0 max-w-5xl gap-6">
          <Section id="announcement">
            <AdminCard title="Announcement bar">
              <form
                ref={announcementRef}
                className="space-y-5 px-5 py-5 sm:px-6"
                onSubmit={saveTopbar}
                noValidate
              >
                <div data-field="topbarText">
                  <div className="flex items-end justify-between gap-3">
                    <AdminFieldLabel htmlFor="topbar-text" required>
                      Message
                    </AdminFieldLabel>
                    <span
                      className={cn(
                        "mb-2 font-mono text-xs tabular-nums",
                        announcement.topbarText.length > 220
                          ? "text-admin-danger"
                          : "text-admin-muted",
                      )}
                    >
                      {announcement.topbarText.length}/220
                    </span>
                  </div>
                  <Textarea
                    id="topbar-text"
                    name="topbarText"
                    value={announcement.topbarText}
                    onChange={(e) => updateAnnouncement({ topbarText: e.target.value })}
                    onBlur={() => av.revalidate(announcement)}
                    rows={2}
                    maxLength={220}
                    placeholder="Free delivery across Pakistan on orders over Rs 5,000"
                    aria-invalid={av.errors.topbarText ? true : undefined}
                    disabled={!announcementLoaded}
                  />
                  <AdminFieldError message={av.errors.topbarText} />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border border-admin-line bg-admin-soft-2 px-4 py-3">
                  <label
                    htmlFor="topbar-enabled"
                    className="cursor-pointer text-[0.9375rem] font-medium text-admin-ink"
                  >
                    Show on the store
                  </label>
                  <Switch
                    id="topbar-enabled"
                    checked={announcement.topbarEnabled}
                    disabled={!announcementLoaded}
                    onChange={(next) => updateAnnouncement({ topbarEnabled: next })}
                  />
                </div>
                <AdminFormError>{topbarServerError}</AdminFormError>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingTopbar || !announcementDirty}
                    className="sm:w-auto"
                  >
                    {savingTopbar ? "Saving…" : "Save"}
                  </Button>
                </div>
              </form>
            </AdminCard>
          </Section>

          <Section id="coupons">
            <CouponManager canDelete={isSuper} />
          </Section>

          {isSuper ? (
            <Section id="team">
              <AdminCard
                title="Team"
                action={
                  <Button size="sm" className="w-auto!" onClick={() => setAddOpen(true)}>
                    Add admin
                  </Button>
                }
              >
                {teamLoading && team.length === 0 ? (
                  <p className="px-6 py-10 text-center text-[0.9375rem] text-admin-muted">
                    Loading team…
                  </p>
                ) : (
                  <ul className="divide-y divide-admin-line">
                    {team.map((m) => {
                      const owner = m.role === "super_admin";
                      return (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-admin-ink">
                              {m.name || m.email}
                            </p>
                            <p className="truncate text-[0.8125rem] text-admin-muted">
                              {m.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <AdminStatusBadge
                              status={owner ? "active" : "staff"}
                              label={owner ? "Owner" : "Admin"}
                              tone={owner ? "brass" : "neutral"}
                            />
                            {!owner ? (
                              <Button
                                variant="danger-outline"
                                size="sm"
                                className="w-auto!"
                                onClick={() => setRemoveTarget(m)}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </AdminCard>
            </Section>
          ) : null}

          <Section id="currency">
            <AdminCard title="Currency">
              <div className="space-y-4 px-5 py-5 sm:px-6">
                <p className="text-[0.9375rem] text-admin-ink">
                  Prices are set in <strong className="font-semibold">PKR</strong>.
                  Shoppers can also view them in USD, AED, SAR, GBP and EUR.
                </p>
                {rates?.rates ? (
                  <>
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                      {DISPLAY_CURRENCIES.map((c) => {
                        const r = rates.rates?.[c];
                        const pkrPerUnit = r ? 1 / r : 0;
                        return (
                          <div
                            key={c}
                            className="rounded-md border border-admin-line bg-admin-soft-2 px-3 py-2.5"
                          >
                            <dt className="text-xs font-semibold text-admin-muted">
                              1 {c}
                            </dt>
                            <dd className="mt-0.5 font-mono text-sm tabular-nums text-admin-ink">
                              {pkrPerUnit
                                ? `Rs ${pkrPerUnit.toLocaleString("en-PK", {
                                    maximumFractionDigits: 0,
                                  })}`
                                : "Not available"}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                    {rates.updatedAt ? (
                      <p className="text-[0.8125rem] text-admin-muted">
                        Rates updated{" "}
                        {new Date(rates.updatedAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-[0.8125rem] text-admin-muted">Loading rates…</p>
                )}
              </div>
            </AdminCard>
          </Section>

          <Section id="appearance">
            <AdminCard title="Appearance">
              <div className="px-5 py-5 sm:px-6">
                <AppearancePicker />
                <p className="mt-3 text-[0.8125rem] text-admin-muted">
                  Changes this admin only. Your store looks the same.
                </p>
              </div>
            </AdminCard>
          </Section>

          <Section id="profile">
            <AdminCard title="Your account">
              <dl className="divide-y divide-admin-line px-5 sm:px-6">
                {[
                  ["Name", user?.name],
                  ["Email", user?.email],
                  ["Role", user ? (isSuper ? "Owner" : "Admin") : undefined],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <dt className="text-sm font-semibold text-admin-muted">{label}</dt>
                    <dd className="min-w-0 wrap-break-word text-[0.9375rem] text-admin-ink">
                      {value || "Not set"}
                    </dd>
                  </div>
                ))}
              </dl>
            </AdminCard>
          </Section>
        </div>
      </div>

      <AddAdminModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          loadTeam();
        }}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(o) => {
          if (!o && !removingTeam) setRemoveTarget(null);
        }}
        title={`Remove ${removeTarget?.name || "this admin"}?`}
        description="They will lose access to the admin right away."
        confirmLabel="Remove admin"
        loading={removingTeam}
        onConfirm={confirmRemoveTeam}
      />

      {leaveGuard}
    </AdminShell>
  );
}

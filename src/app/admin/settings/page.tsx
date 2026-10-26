"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLoader } from "@/components/brand/brand-loader";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { MoonIcon, SunIcon } from "@animateicons/react/lucide";
import { AdminShell } from "@/components/admin/admin-shell";
import { CouponManager } from "@/components/admin/coupon-manager";
import { CheckoutSettings } from "@/components/admin/checkout-settings";
import type { CheckoutConfig } from "@/lib/checkout-config";
import {
  AdminCard,
  AdminPageHeader,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Textarea } from "@/components/admin/input";
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

/* Mirrors PUT /api/admin/settings */
const announcementSchema = z.object({
  topbarText: z
    .string()
    .trim()
    .min(1, "Enter a message")
    .max(220, "Use 220 characters or fewer"),
  topbarEnabled: z.boolean(),
});

const SECTIONS = [
  { id: "announcement", label: "Announcement bar" },
  { id: "charges", label: "Shipping and charges" },
  { id: "coupons", label: "Coupons" },
  { id: "currency", label: "Currency" },
  { id: "appearance", label: "Appearance" },
  { id: "account", label: "Your account and team" },
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
          "inline-block h-4.5 w-4.5 rounded-full bg-white transition-transform",
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

  const isSuper = Boolean(user?.isSuperAdmin || user?.role === "super_admin");
  const announcementDirty =
    announcementLoaded &&
    (announcement.topbarText !== savedAnnouncement.topbarText ||
      announcement.topbarEnabled !== savedAnnouncement.topbarEnabled);

  const [checkout, setCheckout] = useState<CheckoutConfig | null>(null);
  const [chargesDirty, setChargesDirty] = useState(false);
  const onChargesDirty = useCallback((d: boolean) => setChargesDirty(d), []);

  const leaveGuard = useUnsavedChangesGuard(
    (announcementDirty && !savingTopbar) || chargesDirty,
  );

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
          if (j.data.checkout) setCheckout(j.data.checkout);
        }
      })
      .finally(() => setAnnouncementLoaded(true));
  }, [router]);

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
                        "mb-2 font-sans tabular-nums text-xs ",
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

          <Section id="charges">
            <CheckoutSettings initial={checkout} onDirtyChange={onChargesDirty} readOnly={!isSuper} />
          </Section>

          <Section id="coupons">
            <CouponManager canDelete={isSuper} />
          </Section>

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
                            <dd className="mt-0.5 font-sans tabular-nums text-sm text-admin-ink">
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
                  <div className="flex justify-center px-6 py-10"><BrandLoader size={56} label="Loading rates" /></div>
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

          <Section id="account">
            <AdminCard title="Your account and team">
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-[0.9375rem] text-admin-ink">
                  Signed in as <strong className="font-semibold">{user?.name || user?.email || "you"}</strong>
                  {user?.email ? <span className="text-admin-muted"> ({user.email})</span> : null}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button href="/admin/profile" variant="secondary" size="sm" className="w-auto!">
                    Profile and password
                  </Button>
                  {isSuper ? (
                    <Button href="/admin/team" variant="secondary" size="sm" className="w-auto!">
                      Manage team
                    </Button>
                  ) : null}
                </div>
              </div>
            </AdminCard>
          </Section>
        </div>
      </div>

      {leaveGuard}
    </AdminShell>
  );
}

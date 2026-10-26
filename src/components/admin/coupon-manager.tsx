"use client";

import { useEffect, useRef, useState } from "react";
import { BrandLoader } from "@/components/brand/brand-loader";
import { z } from "zod";
import {
  AdminActionDivider,
  AdminCard,
  AdminEmptyState,
  AdminIcon,
  AdminIconAction,
  AdminModal,
  AdminRowActions,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  readAdminJson,
} from "@/components/admin/ui";
import {
  CouponPosterStudio,
  type AdminCoupon,
} from "@/components/admin/coupon-poster-studio";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";
import { Select } from "@/components/admin/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminFieldLabel } from "@/components/admin/form-section";
import { AdminDatePickerField } from "@/components/admin/date-picker-field";
import {
  AdminFieldError,
  AdminFormError,
  useFormValidation,
} from "@/components/admin/form-validation";
import { toast } from "@/components/admin/toast";
import { cn } from "@/lib/cn";
import { formatCouponExpiry } from "@/lib/coupon-poster";

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

function discountLabel(c: Pick<AdminCoupon, "type" | "value">) {
  if (c.type === "percent") return `${c.value}% off`;
  if (c.type === "fixed")
    return `Rs ${Math.round(c.value).toLocaleString("en-PK")} off`;
  return "Free shipping";
}

/** Campaign name, unless it only repeats the code or the discount. */
function campaignName(c: AdminCoupon) {
  const label = (c.label || "").trim();
  if (!label) return "";
  const l = label.toLowerCase();
  if (l === c.code.toLowerCase()) return "";
  if (l.includes(discountLabel(c).toLowerCase())) return "";
  if (c.type === "free_shipping" && l.includes("free")) return "";
  return label;
}

function usedLabel(c: AdminCoupon) {
  if (c.usageLimit != null && c.usageLimit > 0) {
    return `${c.usedCount} of ${c.usageLimit}`;
  }
  return String(c.usedCount);
}

function isExpired(c: AdminCoupon) {
  return Boolean(c.expiresAt && new Date(c.expiresAt) < new Date());
}

function isExhausted(c: AdminCoupon) {
  return (
    c.usageLimit != null && c.usageLimit > 0 && c.usedCount >= c.usageLimit
  );
}

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 focus-visible:ring-offset-2 focus-visible:ring-offset-admin-paper",
        checked
          ? "border-brass bg-brass"
          : "border-admin-input-border bg-admin-soft",
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

/* ------------------------------------------------------------------ */
/* Create form + validation (mirrors /api/admin/coupons POST)          */
/* ------------------------------------------------------------------ */

type CouponFormState = {
  code: string;
  label: string;
  type: AdminCoupon["type"];
  value: string;
  minSubtotalPkr: string;
  usageLimit: string;
  expiresAt: string;
};

const EMPTY_FORM: CouponFormState = {
  code: "",
  label: "",
  type: "percent",
  value: "10",
  minSubtotalPkr: "",
  usageLimit: "",
  expiresAt: "",
};

const wholeNumber = /^\d+$/;

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Enter a code")
      .regex(/^[A-Z0-9]+$/, "Use letters A to Z and numbers only")
      .min(3, "Use at least 3 characters")
      .max(20, "Use 20 characters or fewer"),
    label: z.string().trim().max(80, "Use 80 characters or fewer"),
    type: z.enum(["percent", "fixed", "free_shipping"]),
    value: z.string().trim(),
    minSubtotalPkr: z
      .string()
      .trim()
      .refine((v) => v === "" || wholeNumber.test(v), "Enter a whole amount in PKR"),
    usageLimit: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || (wholeNumber.test(v) && Number(v) > 0),
        "Enter a number above 0, or leave empty for no limit",
      ),
    expiresAt: z
      .string()
      .refine((v) => v === "" || v >= todayIso(), "Pick today or a later date"),
  })
  .superRefine((d, ctx) => {
    if (d.type === "free_shipping") return;
    const n = Number(d.value);
    if (d.value === "" || !Number.isFinite(n)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message:
          d.type === "percent" ? "Enter a percentage" : "Enter an amount in PKR",
      });
      return;
    }
    if (n <= 0) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Must be more than 0" });
      return;
    }
    if (d.type === "percent" && n > 90) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage can be 90 at most",
      });
    }
    if (d.type === "percent" && !Number.isInteger(n)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Use a whole percentage",
      });
    }
    if (d.type === "fixed" && n > 1_000_000) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Amount is too large",
      });
    }
  });

function CreateCouponModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: AdminCoupon) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const v = useFormValidation(couponSchema);

  const dirty = JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setServerError(null);
    v.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function update(patch: Partial<CouponFormState>) {
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
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          label: form.label.trim(),
          type: form.type,
          value: form.type === "free_shipping" ? 0 : Number(form.value),
          minSubtotalPkr: form.minSubtotalPkr.trim()
            ? Number(form.minSubtotalPkr)
            : 0,
          usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
          expiresAt: form.expiresAt || null,
        }),
      });
      const j = await readAdminJson<AdminCoupon>(res);
      if (!j.ok || !j.data) {
        const message = j.error || "Could not create the coupon";
        if (res.status === 409) {
          v.setErrors({ code: "This code already exists" });
        } else {
          setServerError(message);
        }
        toast.error(message);
        return;
      }
      toast.success(`Coupon ${j.data.code} created`);
      onCreated(j.data);
    } catch {
      setServerError("Network error. The coupon was not created.");
      toast.error("Network error. The coupon was not created.");
    } finally {
      setSaving(false);
    }
  }

  const isPercent = form.type === "percent";

  return (
    <>
      <AdminModal open={open} onClose={requestClose} title="Create coupon" wide>
        <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div data-field="code">
              <AdminFieldLabel htmlFor="coupon-code" required>
                Code
              </AdminFieldLabel>
              <Input
                id="coupon-code"
                name="code"
                value={form.code}
                autoComplete="off"
                spellCheck={false}
                maxLength={20}
                placeholder="SPRING15"
                className="font-sans tabular-nums! uppercase tracking-wide"
                aria-invalid={v.errors.code ? true : undefined}
                aria-describedby={v.errors.code ? "coupon-code-error" : undefined}
                onChange={(e) =>
                  update({
                    code: e.target.value.toUpperCase().replace(/\s+/g, ""),
                  })
                }
                onBlur={() => v.revalidate(form)}
              />
              <AdminFieldError id="coupon-code-error" message={v.errors.code} />
            </div>
            <div data-field="label">
              <AdminFieldLabel htmlFor="coupon-label">Campaign name</AdminFieldLabel>
              <Input
                id="coupon-label"
                name="label"
                value={form.label}
                maxLength={80}
                placeholder="Spring sale"
                aria-invalid={v.errors.label ? true : undefined}
                onChange={(e) => update({ label: e.target.value })}
                onBlur={() => v.revalidate(form)}
              />
              <AdminFieldError message={v.errors.label} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div data-field="type">
              <AdminFieldLabel required>Discount</AdminFieldLabel>
              <Select
                aria-label="Discount type"
                value={form.type}
                onValueChange={(t) =>
                  update({
                    type: t as AdminCoupon["type"],
                    value:
                      t === "free_shipping"
                        ? ""
                        : form.value || (t === "percent" ? "10" : ""),
                  })
                }
                options={[
                  { value: "percent", label: "Percentage off" },
                  { value: "fixed", label: "Amount off (PKR)" },
                  { value: "free_shipping", label: "Free shipping" },
                ]}
              />
            </div>
            {form.type !== "free_shipping" ? (
              <div data-field="value">
                <AdminFieldLabel htmlFor="coupon-value" required>
                  {isPercent ? "Percentage" : "Amount"}
                </AdminFieldLabel>
                <div className="relative">
                  {!isPercent ? (
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted">
                      Rs
                    </span>
                  ) : null}
                  <Input
                    id="coupon-value"
                    name="value"
                    inputMode="numeric"
                    value={form.value}
                    className={cn(
                      "font-sans tabular-nums! ",
                      !isPercent && "pl-10!",
                      isPercent && "pr-9!",
                    )}
                    aria-invalid={v.errors.value ? true : undefined}
                    onChange={(e) =>
                      update({ value: e.target.value.replace(/[^\d.]/g, "") })
                    }
                    onBlur={() => v.revalidate(form)}
                  />
                  {isPercent ? (
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-admin-muted">
                      %
                    </span>
                  ) : null}
                </div>
                <AdminFieldError message={v.errors.value} />
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div data-field="minSubtotalPkr">
              <AdminFieldLabel htmlFor="coupon-min">Minimum order</AdminFieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted">
                  Rs
                </span>
                <Input
                  id="coupon-min"
                  name="minSubtotalPkr"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.minSubtotalPkr}
                  className={cn("pl-10! font-sans tabular-nums", form.minSubtotalPkr && "font-sans tabular-nums!")}
                  aria-invalid={v.errors.minSubtotalPkr ? true : undefined}
                  onChange={(e) =>
                    update({ minSubtotalPkr: e.target.value.replace(/\D/g, "") })
                  }
                  onBlur={() => v.revalidate(form)}
                />
              </div>
              <AdminFieldError message={v.errors.minSubtotalPkr} />
            </div>
            <div data-field="usageLimit">
              <AdminFieldLabel htmlFor="coupon-limit">Total uses</AdminFieldLabel>
              <Input
                id="coupon-limit"
                name="usageLimit"
                inputMode="numeric"
                placeholder="No limit"
                value={form.usageLimit}
                className={cn("font-sans tabular-nums", form.usageLimit && "font-sans tabular-nums!")}
                aria-invalid={v.errors.usageLimit ? true : undefined}
                onChange={(e) =>
                  update({ usageLimit: e.target.value.replace(/\D/g, "") })
                }
                onBlur={() => v.revalidate(form)}
              />
              <AdminFieldError message={v.errors.usageLimit} />
            </div>
            <AdminDatePickerField
              label="End date"
              name="expiresAt"
              value={form.expiresAt}
              onChange={(d) => update({ expiresAt: d })}
              onBlur={() => v.revalidate(form)}
              error={v.errors.expiresAt}
              placeholder="No end date"
              min={todayIso()}
              clearable
            />
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
              {saving ? "Creating…" : "Create coupon"}
            </Button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard this coupon?"
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

/* ------------------------------------------------------------------ */
/* Manager                                                             */
/* ------------------------------------------------------------------ */

type Props = {
  canDelete: boolean;
};

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  } catch {
    toast.error("Could not copy. Select the code and copy it instead.");
  }
}

export function CouponManager({ canDelete }: Props) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [disableTarget, setDisableTarget] = useState<AdminCoupon | null>(null);
  const [posterCoupon, setPosterCoupon] = useState<AdminCoupon | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function loadCoupons() {
    setLoading(true);
    setLoadError(null);
    fetch("/api/admin/coupons")
      .then((r) => readAdminJson<AdminCoupon[]>(r))
      .then((j) => {
        if (j.ok && j.data) setCoupons(j.data);
        else setLoadError(j.error || "Could not load coupons");
      })
      .catch(() => setLoadError("Network error while loading coupons"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function setActive(c: AdminCoupon, active: boolean) {
    setTogglingId(c.id);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, active }),
      });
      const j = await readAdminJson<AdminCoupon>(res);
      if (!j.ok) {
        toast.error(j.error || `Could not ${active ? "turn on" : "turn off"} ${c.code}`);
        return;
      }
      setCoupons((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, active } : x)),
      );
      toast.success(active ? `${c.code} is active` : `${c.code} turned off`);
    } catch {
      toast.error(`Network error. ${c.code} was not changed.`);
    } finally {
      setTogglingId(null);
    }
  }

  function onToggle(c: AdminCoupon, next: boolean) {
    // Turning off a live code stops checkout redemptions: confirm first.
    if (!next) setDisableTarget(c);
    else void setActive(c, true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const j = await readAdminJson(res);
      if (!j.ok) {
        toast.error(j.error || "Could not delete the coupon");
        return;
      }
      setCoupons((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success(`${deleteTarget.code} deleted`);
    } catch {
      toast.error("Network error. The coupon was not deleted.");
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  }

  function statusBadges(c: AdminCoupon) {
    if (isExpired(c)) return <AdminStatusBadge status="cancelled" label="Ended" />;
    if (isExhausted(c))
      return <AdminStatusBadge status="cancelled" label="Limit reached" />;
    return null;
  }

  function endsLabel(c: AdminCoupon) {
    return c.expiresAt ? formatCouponExpiry(c.expiresAt) : "No end date";
  }

  return (
    <>
      <AdminCard
        title="Coupons"
        action={
          <Button size="sm" className="w-auto!" onClick={() => setCreateOpen(true)}>
            Create coupon
          </Button>
        }
      >
        {loadError ? (
          <AdminEmptyState
            title="Coupons could not be loaded"
            description={loadError}
            action={
              <Button variant="secondary" size="sm" className="w-auto!" onClick={loadCoupons}>
                Try again
              </Button>
            }
          />
        ) : loading && coupons.length === 0 ? (
          <div className="flex justify-center px-6 py-10"><BrandLoader size={56} label="Loading coupons" /></div>
        ) : coupons.length === 0 ? (
          <AdminEmptyState
            title="No coupons yet"
            description="Create a code customers can enter at checkout."
            action={
              <Button className="w-auto!" onClick={() => setCreateOpen(true)}>
                Create coupon
              </Button>
            }
          />
        ) : (
          <>
            {/* Phones: one card per coupon */}
            <ul className="divide-y divide-admin-line md:hidden">
              {coupons.map((c) => (
                <li key={c.id} className="space-y-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-sans tabular-nums text-[0.9375rem] font-semibold tracking-wide text-admin-ink">
                        {c.code}
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] text-admin-muted">
                        {discountLabel(c)}
                        {c.minSubtotalPkr
                          ? ` · min Rs ${c.minSubtotalPkr.toLocaleString("en-PK")}`
                          : ""}
                      </p>
                    </div>
                    <Switch
                      checked={c.active}
                      disabled={togglingId === c.id}
                      label={`${c.code} active`}
                      onChange={(next) => onToggle(c, next)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-admin-muted">
                    <span>
                      Used{" "}
                      <span className="font-sans tabular-nums text-admin-ink">
                        {usedLabel(c)}
                      </span>
                    </span>
                    <span>{c.expiresAt ? `Ends ${endsLabel(c)}` : "No end date"}</span>
                    {statusBadges(c)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyCode(c.code)}
                    >
                      <AdminIcon name="copy" size={16} />
                      Copy code
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPosterCoupon(c)}
                    >
                      <AdminIcon name="poster" size={16} />
                      Poster
                    </Button>
                    {canDelete ? (
                      <>
                        <AdminActionDivider />
                        <AdminIconAction
                          icon="delete"
                          tone="danger"
                          label="Delete coupon"
                          ariaLabel={`Delete coupon ${c.code}`}
                          onClick={() => setDeleteTarget(c)}
                        />
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <AdminTable flush stickyFirst={false} className="hidden md:block">
              <thead>
                <tr>
                  <AdminTh>Code</AdminTh>
                  <AdminTh>Discount</AdminTh>
                  <AdminTh numeric>Used</AdminTh>
                  <AdminTh>Ends</AdminTh>
                  <AdminTh>Active</AdminTh>
                  <AdminTh className="w-36 text-right">Actions</AdminTh>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-admin-soft-2">
                    <AdminTd>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-sans tabular-nums text-[0.875rem] font-semibold tracking-wide">
                          {c.code}
                        </span>
                        {statusBadges(c)}
                      </div>
                      {campaignName(c) ? (
                        <p className="mt-0.5 text-[0.8125rem] text-admin-muted">
                          {campaignName(c)}
                        </p>
                      ) : null}
                    </AdminTd>
                    <AdminTd>
                      <p className="whitespace-nowrap">{discountLabel(c)}</p>
                      {c.minSubtotalPkr ? (
                        <p className="mt-0.5 whitespace-nowrap text-[0.8125rem] text-admin-muted">
                          Min order{" "}
                          <span className="font-sans tabular-nums ">
                            Rs {c.minSubtotalPkr.toLocaleString("en-PK")}
                          </span>
                        </p>
                      ) : null}
                    </AdminTd>
                    <AdminTd numeric>{usedLabel(c)}</AdminTd>
                    <AdminTd className="whitespace-nowrap text-admin-muted">
                      {endsLabel(c)}
                    </AdminTd>
                    <AdminTd>
                      <Switch
                        checked={c.active}
                        disabled={togglingId === c.id}
                        label={`${c.code} active`}
                        onChange={(next) => onToggle(c, next)}
                      />
                    </AdminTd>
                    <AdminTd className="py-2">
                      <AdminRowActions>
                        <AdminIconAction
                          icon="copy"
                          label="Copy code"
                          ariaLabel={`Copy coupon code ${c.code}`}
                          onClick={() => copyCode(c.code)}
                        />
                        <AdminIconAction
                          icon="poster"
                          label="Make a poster"
                          ariaLabel={`Make a poster for ${c.code}`}
                          onClick={() => setPosterCoupon(c)}
                        />
                        {canDelete ? (
                          <>
                            <AdminActionDivider />
                            <AdminIconAction
                              icon="delete"
                              tone="danger"
                              label="Delete coupon"
                              ariaLabel={`Delete coupon ${c.code}`}
                              onClick={() => setDeleteTarget(c)}
                            />
                          </>
                        ) : null}
                      </AdminRowActions>
                    </AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </>
        )}
      </AdminCard>

      <CreateCouponModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(c) => {
          setCreateOpen(false);
          setCoupons((prev) => [c, ...prev]);
          // Marketing flow: open the poster studio for the new code.
          setPosterCoupon(c);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => {
          if (!o && !deleting) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.code ?? "coupon"}?`}
        description="Customers will no longer be able to use this code. This cannot be undone."
        confirmLabel="Delete coupon"
        loading={deleting}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={Boolean(disableTarget)}
        onOpenChange={(o) => {
          if (!o) setDisableTarget(null);
        }}
        title={`Turn off ${disableTarget?.code ?? "coupon"}?`}
        description="Customers will not be able to use this code at checkout until you turn it back on."
        confirmLabel="Turn off"
        loading={Boolean(disableTarget && togglingId === disableTarget.id)}
        onConfirm={async () => {
          if (!disableTarget) return;
          await setActive(disableTarget, false);
          setDisableTarget(null);
        }}
      />

      {posterCoupon ? (
        <CouponPosterStudio
          coupon={posterCoupon}
          open={Boolean(posterCoupon)}
          onClose={() => setPosterCoupon(null)}
          onSaved={(updated) => {
            setPosterCoupon(updated);
            setCoupons((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
            );
          }}
        />
      ) : null}
    </>
  );
}

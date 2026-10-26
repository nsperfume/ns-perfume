"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { BrandLoader } from "@/components/brand/brand-loader";
import { AdminCard, formatPkr, readAdminJson } from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";
import { AdminFieldLabel } from "@/components/admin/form-section";
import {
  AdminFieldError,
  AdminFormError,
  type FieldErrors,
  useFormValidation,
} from "@/components/admin/form-validation";
import { toast } from "@/components/admin/toast";
import {
  computeTotals,
  normalizeCheckoutConfig,
  type CheckoutConfig,
  type ShippingMethodId,
  type TaxMode,
} from "@/lib/checkout-config";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Form model: numbers are edited as text so empty / invalid can show */
/* an inline error instead of silently becoming 0.                     */
/* ------------------------------------------------------------------ */

type MethodForm = {
  enabled: boolean;
  title: string;
  description: string;
  price: string;
};

export type ChargesForm = {
  standard: MethodForm;
  express: MethodForm;
  freeShippingOn: boolean;
  freeShippingThreshold: string;
  giftWrapOn: boolean;
  giftWrapFee: string;
  codFee: string;
  taxMode: TaxMode;
  taxRate: string;
  taxLabel: string;
};

const EXAMPLE_SUBTOTAL = 10_000;

const digits = (v: string) => v.replace(/[,\s]/g, "");
const isWhole = (v: string) => /^\d+$/.test(digits(v));
const toInt = (v: string) => (isWhole(v) ? Number(digits(v)) : 0);
const toRate = (v: string) => {
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : 0;
};

function rupees(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `Enter ${label}`)
    .refine(isWhole, "Use a whole rupee amount, like 350")
    .refine((v) => toInt(v) <= max, `Must be Rs ${max.toLocaleString("en-PK")} or less`);
}

const methodSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().min(1, "Enter a name").max(40, "Use 40 characters or fewer"),
  description: z.string().trim().max(80, "Use 80 characters or fewer"),
  price: rupees("a price", 100_000),
});

/** Mirrors checkoutConfigSchema in lib/validation/settings. */
const chargesSchema = z
  .object({
    standard: methodSchema,
    express: methodSchema,
    freeShippingOn: z.boolean(),
    freeShippingThreshold: z.string(),
    giftWrapOn: z.boolean(),
    giftWrapFee: rupees("a fee", 100_000),
    codFee: rupees("a fee, or 0 for none", 100_000),
    taxMode: z.enum(["none", "inclusive", "exclusive"]),
    taxRate: z.string(),
    taxLabel: z.string().trim().min(1, "Enter a tax name").max(20, "Use 20 characters or fewer"),
  })
  .superRefine((f, ctx) => {
    if (!f.standard.enabled && !f.express.enabled) {
      ctx.addIssue({ code: "custom", path: ["shipping"], message: "Keep at least one shipping method on" });
    }
    if (f.freeShippingOn) {
      const v = f.freeShippingThreshold.trim();
      if (!v) ctx.addIssue({ code: "custom", path: ["freeShippingThreshold"], message: "Enter the order amount" });
      else if (!isWhole(v)) ctx.addIssue({ code: "custom", path: ["freeShippingThreshold"], message: "Use a whole rupee amount, like 8000" });
      else if (toInt(v) < 1) ctx.addIssue({ code: "custom", path: ["freeShippingThreshold"], message: "Enter an amount above 0, or turn this off" });
      else if (toInt(v) > 10_000_000) ctx.addIssue({ code: "custom", path: ["freeShippingThreshold"], message: "Must be Rs 10,000,000 or less" });
    }
    if (f.taxMode !== "none") {
      const v = f.taxRate.trim();
      const n = Number(v);
      if (!v) ctx.addIssue({ code: "custom", path: ["taxRate"], message: "Enter a tax rate" });
      else if (!Number.isFinite(n)) ctx.addIssue({ code: "custom", path: ["taxRate"], message: "Use a number, like 18" });
      else if (n <= 0) ctx.addIssue({ code: "custom", path: ["taxRate"], message: "Enter a rate above 0, or turn tax off" });
      else if (n > 50) ctx.addIssue({ code: "custom", path: ["taxRate"], message: "Must be 50% or less" });
    }
  });

function toForm(c: CheckoutConfig): ChargesForm {
  const m = (id: ShippingMethodId): MethodForm => ({
    enabled: c.shipping[id].enabled,
    title: c.shipping[id].title,
    description: c.shipping[id].description,
    price: String(c.shipping[id].pricePkr),
  });
  return {
    standard: m("standard"),
    express: m("express"),
    freeShippingOn: c.freeShippingThresholdPkr > 0,
    freeShippingThreshold: c.freeShippingThresholdPkr > 0 ? String(c.freeShippingThresholdPkr) : "",
    giftWrapOn: c.giftWrap.enabled,
    giftWrapFee: String(c.giftWrap.feePkr),
    codFee: String(c.codFeePkr),
    taxMode: c.tax.mode,
    taxRate: c.tax.ratePercent > 0 ? String(c.tax.ratePercent) : "",
    taxLabel: c.tax.label || "GST",
  };
}

function toConfig(f: ChargesForm): CheckoutConfig {
  const m = (x: MethodForm) => ({
    enabled: x.enabled,
    title: x.title.trim(),
    description: x.description.trim(),
    pricePkr: toInt(x.price),
  });
  return {
    shipping: { standard: m(f.standard), express: m(f.express) },
    freeShippingThresholdPkr: f.freeShippingOn ? toInt(f.freeShippingThreshold) : 0,
    giftWrap: { enabled: f.giftWrapOn, feePkr: toInt(f.giftWrapFee) },
    codFeePkr: toInt(f.codFee),
    tax: {
      mode: f.taxMode,
      ratePercent: f.taxMode === "none" ? 0 : toRate(f.taxRate),
      label: f.taxLabel.trim() || "GST",
    },
  };
}

/** Server error keys (config paths) → form field names. */
function mapServerErrors(raw: Record<string, string> | undefined): FieldErrors {
  if (!raw) return {};
  const out: FieldErrors = {};
  for (const [k, msg] of Object.entries(raw)) {
    const key = k
      .replace(/^shipping\.(standard|express)\.pricePkr$/, "$1.price")
      .replace(/^shipping\.(standard|express)\.(title|description)$/, "$1.$2")
      .replace(/^freeShippingThresholdPkr$/, "freeShippingThreshold")
      .replace(/^giftWrap\.feePkr$/, "giftWrapFee")
      .replace(/^codFeePkr$/, "codFee")
      .replace(/^tax\.ratePercent$/, "taxRate")
      .replace(/^tax\.label$/, "taxLabel");
    if (!out[key]) out[key] = msg;
  }
  return out;
}

const TAX_MODES: { value: TaxMode; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "inclusive", label: "Included in prices" },
  { value: "exclusive", label: "Added at checkout" },
];

function taxSentence(mode: TaxMode, label: string, rate: string) {
  const name = label.trim() || "Tax";
  const pct = rate.trim() ? `${rate.trim()}%` : "the rate";
  if (mode === "inclusive")
    return `Your prices already include ${name}. Checkout shows how much of the total is ${name} at ${pct}.`;
  if (mode === "exclusive") return `${name} at ${pct} is added on top of the order at checkout.`;
  return "Prices are final. No tax line is shown at checkout.";
}

/* ------------------------------- Pieces ------------------------------- */

function Toggle({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
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

/** Rupee input with a fixed "Rs" prefix. */
function MoneyInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.9375rem] font-medium text-admin-muted"
      >
        Rs
      </span>
      <Input
        id={id}
        name={name}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="pl-10! font-sans tabular-nums "
      />
    </div>
  );
}

function Group({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4 border-b border-admin-line py-6 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-admin-ink">{title}</h3>
          {hint ? <p className="mt-0.5 text-sm text-admin-muted">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------- Section ------------------------------ */

export function CheckoutSettings({
  initial,
  onDirtyChange,
  readOnly = false,
}: {
  /** Stored config from GET /api/admin/settings (null while loading). */
  initial: CheckoutConfig | null;
  onDirtyChange?: (dirty: boolean) => void;
  /** Editors and viewers can see the charges; only the owner changes them. */
  readOnly?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [baseline, setBaseline] = useState<ChargesForm | null>(null);
  const [form, setForm] = useState<ChargesForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const v = useFormValidation(chargesSchema);

  useEffect(() => {
    if (!initial) return;
    const f = toForm(normalizeCheckoutConfig(initial));
    setForm(f);
    setBaseline(f);
  }, [initial]);

  const dirty = Boolean(form && baseline && JSON.stringify(form) !== JSON.stringify(baseline));
  useEffect(() => {
    onDirtyChange?.(dirty && !saving);
  }, [dirty, saving, onDirtyChange]);

  const example = useMemo(() => {
    if (!form) return null;
    const config = toConfig(form);
    const method: ShippingMethodId = config.shipping.standard.enabled ? "standard" : "express";
    return {
      method,
      config,
      totals: computeTotals(config, {
        subtotalPkr: EXAMPLE_SUBTOTAL,
        discountPkr: 0,
        shippingMethodId: method,
        paymentMethod: "cod",
      }),
    };
  }, [form]);

  if (!form || !example) {
    return (
      <AdminCard title="Shipping and charges">
        <div className="flex justify-center px-6 py-10">
          <BrandLoader size={56} label="Loading charges" />
        </div>
      </AdminCard>
    );
  }

  const err = v.errors;
  const disabled = saving;

  function update(next: ChargesForm) {
    setForm(next);
    v.revalidate(next);
  }
  function patch(p: Partial<ChargesForm>) {
    update({ ...form!, ...p });
  }
  function patchMethod(id: ShippingMethodId, p: Partial<MethodForm>) {
    update({ ...form!, [id]: { ...form![id], ...p } });
  }
  const blur = () => v.revalidate(form);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!form) return;
    if (!v.validate(form, formRef.current)) {
      toast.error("Check the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout: toConfig(form) }),
      });
      const raw = (await res.clone().json().catch(() => null)) as {
        details?: { fieldErrors?: Record<string, string> };
      } | null;
      const j = await readAdminJson<{ checkout: CheckoutConfig }>(res);
      if (!j.ok || !j.data) {
        const message = j.error || "Could not save the charges";
        const mapped = mapServerErrors(raw?.details?.fieldErrors);
        if (Object.keys(mapped).length) v.setErrors(mapped);
        setServerError(message);
        toast.error(message);
        return;
      }
      const next = toForm(normalizeCheckoutConfig(j.data.checkout));
      setForm(next);
      setBaseline(next);
      v.reset();
      toast.success("Shipping and charges saved");
    } catch {
      setServerError("Network error. Nothing was saved.");
      toast.error("Network error. The charges were not saved.");
    } finally {
      setSaving(false);
    }
  }

  const { totals, config, method } = example;
  const methodName = config.shipping[method].title || (method === "standard" ? "Standard" : "Express");

  return (
    <AdminCard title="Shipping and charges">
      {readOnly ? (
        <p className="border-b border-admin-line bg-admin-soft-2 px-5 py-3 text-sm text-admin-muted sm:px-6">
          Only the owner can change store charges.
        </p>
      ) : null}
      <form
        ref={formRef}
        onSubmit={save}
        noValidate
        className="grid gap-8 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_17rem]"
      >
        <fieldset disabled={readOnly} className="min-w-0 disabled:opacity-80">
          {/* 1. Shipping methods */}
          <Group title="Delivery" hint="At least one method must stay on.">
            <div data-field="shipping" className="space-y-3">
              {(["standard", "express"] as const).map((id) => {
                const m = form[id];
                return (
                  <div
                    key={id}
                    className={cn(
                      "rounded-md border border-admin-line p-4",
                      m.enabled ? "bg-admin-paper" : "bg-admin-soft-2",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor={`ship-${id}-on`}
                        className="cursor-pointer text-[0.9375rem] font-semibold text-admin-ink"
                      >
                        {id === "standard" ? "Standard delivery" : "Express delivery"}
                      </label>
                      <Toggle
                        id={`ship-${id}-on`}
                        checked={m.enabled}
                        disabled={disabled}
                        onChange={(on) => patchMethod(id, { enabled: on })}
                      />
                    </div>
                    {m.enabled ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_9rem]">
                        <div>
                          <AdminFieldLabel htmlFor={`ship-${id}-title`} required>
                            Name
                          </AdminFieldLabel>
                          <Input
                            id={`ship-${id}-title`}
                            name={`${id}.title`}
                            value={m.title}
                            maxLength={40}
                            disabled={disabled}
                            aria-invalid={err[`${id}.title`] ? true : undefined}
                            onChange={(e) => patchMethod(id, { title: e.target.value })}
                            onBlur={blur}
                          />
                          <AdminFieldError message={err[`${id}.title`]} />
                        </div>
                        <div>
                          <AdminFieldLabel htmlFor={`ship-${id}-desc`}>
                            Delivery time
                          </AdminFieldLabel>
                          <Input
                            id={`ship-${id}-desc`}
                            name={`${id}.description`}
                            value={m.description}
                            maxLength={80}
                            placeholder="3 to 5 business days"
                            disabled={disabled}
                            aria-invalid={err[`${id}.description`] ? true : undefined}
                            onChange={(e) => patchMethod(id, { description: e.target.value })}
                            onBlur={blur}
                          />
                          <AdminFieldError message={err[`${id}.description`]} />
                        </div>
                        <div>
                          <AdminFieldLabel htmlFor={`ship-${id}-price`} required>
                            Price
                          </AdminFieldLabel>
                          <MoneyInput
                            id={`ship-${id}-price`}
                            name={`${id}.price`}
                            value={m.price}
                            disabled={disabled}
                            error={err[`${id}.price`]}
                            onChange={(val) => patchMethod(id, { price: val })}
                            onBlur={blur}
                          />
                          <AdminFieldError message={err[`${id}.price`]} />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-admin-muted">
                        Hidden at checkout.
                      </p>
                    )}
                  </div>
                );
              })}
              <AdminFieldError message={err.shipping} />
            </div>
          </Group>

          {/* 2. Free shipping */}
          <Group
            title="Free standard delivery"
            hint="For orders at or above an amount, after discounts."
            action={
              <Toggle
                id="free-ship-on"
                checked={form.freeShippingOn}
                disabled={disabled || !form.standard.enabled}
                onChange={(on) => patch({ freeShippingOn: on })}
              />
            }
          >
            {form.freeShippingOn && form.standard.enabled ? (
              <div className="max-w-56">
                <AdminFieldLabel htmlFor="free-ship-amount" required>
                  Orders of at least
                </AdminFieldLabel>
                <MoneyInput
                  id="free-ship-amount"
                  name="freeShippingThreshold"
                  value={form.freeShippingThreshold}
                  disabled={disabled}
                  error={err.freeShippingThreshold}
                  onChange={(val) => patch({ freeShippingThreshold: val })}
                  onBlur={blur}
                />
                <AdminFieldError message={err.freeShippingThreshold} />
              </div>
            ) : !form.standard.enabled ? (
              <p className="text-sm text-admin-muted">Turn on standard delivery to offer this.</p>
            ) : null}
          </Group>

          {/* 3. Gift wrap */}
          <Group
            title="Gift wrap"
            hint="Shoppers can add it to any bottle at checkout."
            action={
              <Toggle
                id="gift-wrap-on"
                checked={form.giftWrapOn}
                disabled={disabled}
                onChange={(on) => patch({ giftWrapOn: on })}
              />
            }
          >
            {form.giftWrapOn ? (
              <div className="max-w-56">
                <AdminFieldLabel htmlFor="gift-wrap-fee" required>
                  Fee
                </AdminFieldLabel>
                <MoneyInput
                  id="gift-wrap-fee"
                  name="giftWrapFee"
                  value={form.giftWrapFee}
                  disabled={disabled}
                  error={err.giftWrapFee}
                  onChange={(val) => patch({ giftWrapFee: val })}
                  onBlur={blur}
                />
                <AdminFieldError message={err.giftWrapFee} />
              </div>
            ) : null}
          </Group>

          {/* 4. COD fee */}
          <Group title="Cash on delivery fee" hint="Added when the shopper pays on delivery. 0 means no fee.">
            <div className="max-w-56">
              <AdminFieldLabel htmlFor="cod-fee" required>
                Fee
              </AdminFieldLabel>
              <MoneyInput
                id="cod-fee"
                name="codFee"
                value={form.codFee}
                disabled={disabled}
                error={err.codFee}
                onChange={(val) => patch({ codFee: val })}
                onBlur={blur}
              />
              <AdminFieldError message={err.codFee} />
            </div>
          </Group>

          {/* 5. Tax */}
          <Group title="Tax">
            <div
              role="radiogroup"
              aria-label="Tax"
              className="inline-flex w-full flex-wrap gap-1 rounded-md border border-admin-line bg-admin-soft-2 p-1 sm:w-auto"
            >
              {TAX_MODES.map((t) => {
                const on = form.taxMode === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={disabled}
                    onClick={() => patch({ taxMode: t.value })}
                    className={cn(
                      "min-h-10 flex-1 cursor-pointer rounded px-4 text-sm font-semibold transition-colors sm:flex-none",
                      on
                        ? "bg-admin-ink text-admin-paper"
                        : "text-admin-muted hover:bg-admin-paper hover:text-admin-ink",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[0.9375rem] text-admin-ink">
              {taxSentence(form.taxMode, form.taxLabel, form.taxRate)}
            </p>
            {form.taxMode !== "none" ? (
              <div className="grid max-w-md gap-4 sm:grid-cols-2">
                <div>
                  <AdminFieldLabel htmlFor="tax-rate" required>
                    Rate
                  </AdminFieldLabel>
                  <div className="relative">
                    <Input
                      id="tax-rate"
                      name="taxRate"
                      inputMode="decimal"
                      autoComplete="off"
                      value={form.taxRate}
                      placeholder="18"
                      disabled={disabled}
                      aria-invalid={err.taxRate ? true : undefined}
                      onChange={(e) => patch({ taxRate: e.target.value })}
                      onBlur={blur}
                      className="pr-9! font-sans tabular-nums "
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[0.9375rem] font-medium text-admin-muted"
                    >
                      %
                    </span>
                  </div>
                  <AdminFieldError message={err.taxRate} />
                </div>
                <div>
                  <AdminFieldLabel htmlFor="tax-label" required>
                    Name on receipts
                  </AdminFieldLabel>
                  <Input
                    id="tax-label"
                    name="taxLabel"
                    value={form.taxLabel}
                    maxLength={20}
                    placeholder="GST"
                    disabled={disabled}
                    aria-invalid={err.taxLabel ? true : undefined}
                    onChange={(e) => patch({ taxLabel: e.target.value })}
                    onBlur={blur}
                  />
                  <AdminFieldError message={err.taxLabel} />
                </div>
              </div>
            ) : null}
          </Group>

          <div className="mt-6 space-y-4">
            {serverError ? <AdminFormError>{serverError}</AdminFormError> : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving || !dirty} className="sm:w-auto">
                {saving ? "Saving…" : "Save charges"}
              </Button>
            </div>
          </div>
        </fieldset>

        {/* 6. Live example, computed exactly like checkout */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-admin-line bg-admin-soft-2 p-5">
            <p className="text-sm font-semibold text-admin-ink">Example order</p>
            <p className="mt-0.5 text-[0.8125rem] text-admin-muted">
              {formatPkr(EXAMPLE_SUBTOTAL)} of perfume, {methodName.toLowerCase()} delivery, cash on delivery
            </p>
            <dl className="mt-4 space-y-2.5 text-[0.9375rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-admin-muted">Subtotal</dt>
                <dd className="font-sans tabular-nums text-admin-ink">{formatPkr(totals.subtotalPkr)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-admin-muted">Delivery</dt>
                <dd className="font-sans tabular-nums text-admin-ink">
                  {totals.shippingPkr === 0 ? "Free" : formatPkr(totals.shippingPkr)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-admin-muted">Cash on delivery fee</dt>
                <dd className="font-sans tabular-nums text-admin-ink">
                  {totals.codFeePkr ? formatPkr(totals.codFeePkr) : "None"}
                </dd>
              </div>
              {config.tax.mode === "exclusive" ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-admin-muted">
                    {config.tax.label} ({config.tax.ratePercent || 0}%)
                  </dt>
                  <dd className="font-sans tabular-nums text-admin-ink">{formatPkr(totals.taxPkr)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-admin-line pt-3 text-base font-semibold text-admin-ink">
                <dt>Total</dt>
                <dd className="font-sans tabular-nums ">{formatPkr(totals.totalPkr)}</dd>
              </div>
              {config.tax.mode === "inclusive" ? (
                <p className="text-[0.8125rem] text-admin-muted">
                  Includes {config.tax.label} of{" "}
                  <span className="font-sans tabular-nums ">{formatPkr(totals.taxIncludedPkr)}</span>
                </p>
              ) : null}
            </dl>
          </div>
        </aside>
      </form>
    </AdminCard>
  );
}

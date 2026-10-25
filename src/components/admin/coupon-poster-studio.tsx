"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "@animateicons/react/lucide";
import { z } from "zod";
import { AdminImageField } from "@/components/admin/image-field";
import { AdminColorPickerField } from "@/components/admin/color-picker-field";
import { AdminDatePickerField } from "@/components/admin/date-picker-field";
import { AdminFieldLabel } from "@/components/admin/form-section";
import { Button } from "@/components/admin/button";
import { Input, Textarea } from "@/components/admin/input";
import { Select } from "@/components/admin/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  AdminFieldError,
  AdminFormError,
  useFormValidation,
} from "@/components/admin/form-validation";
import { toast } from "@/components/admin/toast";
import { readAdminJson } from "@/components/admin/ui";
import {
  couponExpiryInputValue,
  downloadDataUrl,
  drawCouponPoster,
  exportCouponPosterPng,
  POSTER_COLOR_PRESETS,
  POSTER_FORMATS,
  type CouponPosterInput,
  type PosterFormat,
} from "@/lib/coupon-poster";
import { cn } from "@/lib/cn";

export type AdminCoupon = CouponPosterInput & {
  id: string;
  active: boolean;
  usedCount: number;
};

type Props = {
  coupon: AdminCoupon;
  open: boolean;
  onClose: () => void;
  onSaved: (coupon: AdminCoupon) => void;
};

/** Mirrors /api/admin/coupons PUT for the poster fields. */
const posterSchema = z.object({
  bgMode: z.enum(["color", "image"]),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a color"),
  imageUrl: z.string(),
  headline: z.string().trim().max(80, "Use 80 characters or fewer"),
  subcopy: z.string().trim().max(160, "Use 160 characters or fewer"),
  usageLimit: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0),
      "Enter a number above 0, or leave empty for no limit",
    ),
  expiresAt: z.string(),
});

type PosterForm = z.infer<typeof posterSchema>;

function formFromCoupon(c: AdminCoupon): PosterForm {
  return {
    bgMode: c.posterBgMode === "image" ? "image" : "color",
    bgColor: (c.posterBgColor || "#1c1917").toUpperCase(),
    imageUrl: c.posterImageUrl || "",
    headline: c.posterHeadline || "",
    subcopy: c.posterSubcopy || "",
    usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
    expiresAt: couponExpiryInputValue(c.expiresAt),
  };
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-md border border-admin-input-border bg-admin-soft-2 p-1"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-9 cursor-pointer rounded px-4 text-sm font-semibold transition-colors",
              on
                ? "bg-admin-ink text-admin-paper"
                : "text-admin-muted hover:text-admin-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function CouponPosterStudio({ coupon, open, onClose, onSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<PosterFormat>("story");
  const [form, setForm] = useState<PosterForm>(() => formFromCoupon(coupon));
  const [saved, setSaved] = useState<PosterForm>(() => formFromCoupon(coupon));
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const v = useFormValidation(posterSchema);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  // Reset when a different coupon opens
  useEffect(() => {
    if (!open) return;
    const next = formFromCoupon(coupon);
    setForm(next);
    setSaved(next);
    setServerError(null);
    setDownloading(false);
    v.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coupon.id]);

  function requestClose() {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  // Escape + scroll lock while studio is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty, saving]);

  function update(patch: Partial<PosterForm>) {
    const next = { ...form, ...patch };
    setForm(next);
    if (v.submitted) v.revalidate(next);
  }

  const validColor = /^#[0-9a-fA-F]{6}$/.test(form.bgColor)
    ? form.bgColor
    : saved.bgColor;

  const draft: CouponPosterInput = {
    code: coupon.code,
    label: coupon.label,
    type: coupon.type,
    value: coupon.value,
    minSubtotalPkr: coupon.minSubtotalPkr,
    usageLimit: /^\d+$/.test(form.usageLimit.trim())
      ? Number(form.usageLimit)
      : null,
    expiresAt: form.expiresAt || null,
    posterBgMode: form.bgMode,
    posterBgColor: validColor,
    posterImageUrl: form.imageUrl,
    posterHeadline: form.headline,
    posterSubcopy: form.subcopy,
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function paint() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setDrawing(true);
      try {
        await drawCouponPoster(canvas, { coupon: draft, format });
      } finally {
        if (!cancelled) setDrawing(false);
      }
    }
    const t = window.setTimeout(() => void paint(), 60);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft fields listed explicitly
  }, [
    open,
    format,
    form.bgMode,
    validColor,
    form.imageUrl,
    form.headline,
    form.subcopy,
    form.usageLimit,
    form.expiresAt,
    coupon.code,
    coupon.label,
    coupon.type,
    coupon.value,
    coupon.minSubtotalPkr,
  ]);

  if (!open) return null;

  async function save() {
    setServerError(null);
    if (!v.validate(form, formRef.current)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: coupon.id,
          usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
          expiresAt: form.expiresAt || null,
          posterBgMode: form.bgMode,
          posterBgColor: form.bgColor,
          posterImageUrl: form.imageUrl,
          posterHeadline: form.headline.trim(),
          posterSubcopy: form.subcopy.trim(),
        }),
      });
      const j = await readAdminJson<AdminCoupon>(res);
      if (!j.ok || !j.data) {
        const message = j.error || "Could not save the poster";
        setServerError(message);
        toast.error(message);
        return;
      }
      setSaved(form);
      onSaved(j.data);
      toast.success("Poster saved");
    } catch {
      setServerError("Network error. The poster was not saved.");
      toast.error("Network error. The poster was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function download() {
    setDownloading(true);
    try {
      const dataUrl = await exportCouponPosterPng({ coupon: draft, format });
      downloadDataUrl(
        dataUrl,
        `ns-perfume-coupon-${coupon.code.toLowerCase()}-${format}.png`,
      );
      toast.success("Poster downloaded");
    } catch {
      toast.error("Could not create the image. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  const dims = POSTER_FORMATS[format];

  return (
    <>
      <div className="fixed inset-0 z-90 flex items-end justify-center sm:items-center sm:p-6">
        <button
          type="button"
          aria-label="Close poster studio"
          className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-[1px]"
          onClick={requestClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="poster-studio-title"
          className="relative z-1 flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-xl border border-admin-line bg-admin-paper shadow-modal sm:max-h-[90dvh] sm:rounded-lg"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-admin-line py-3 pl-5 pr-3 sm:pl-6">
            <h2
              id="poster-studio-title"
              className="min-w-0 truncate text-lg font-semibold text-admin-ink sm:text-xl"
            >
              Poster for{" "}
              <span className="font-mono tracking-wide">{coupon.code}</span>
            </h2>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-admin-muted transition-colors hover:bg-admin-soft hover:text-admin-ink"
            >
              <XIcon size={20} color="currentColor" isAnimated={false} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:overflow-hidden">
            {/* Preview */}
            <div className="flex flex-col items-center gap-3 border-b border-admin-line bg-admin-soft-2 p-5 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
              <div
                className={cn(
                  "relative mx-auto w-full max-w-[17.5rem] overflow-hidden rounded-lg bg-admin-soft shadow-modal ring-1 ring-black/10 sm:max-w-80",
                  drawing && "opacity-80",
                )}
                style={{ aspectRatio: `${dims.width} / ${dims.height}` }}
              >
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full"
                  aria-label="Poster preview"
                />
              </div>
              <div className="w-full max-w-80">
                <Select
                  label="Size"
                  value={format}
                  onValueChange={(f) => setFormat(f as PosterFormat)}
                  options={Object.entries(POSTER_FORMATS).map(([id, f]) => ({
                    value: id,
                    label: f.label,
                  }))}
                />
              </div>
            </div>

            {/* Controls */}
            <div
              ref={formRef}
              className="space-y-6 p-5 sm:p-6 lg:min-h-0 lg:overflow-y-auto"
            >
              <div>
                <AdminFieldLabel>Background</AdminFieldLabel>
                <Segmented
                  label="Background"
                  value={form.bgMode}
                  onChange={(m) => update({ bgMode: m })}
                  options={[
                    { value: "color", label: "Color" },
                    { value: "image", label: "Photo" },
                  ]}
                />

                {form.bgMode === "color" ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2.5">
                      {POSTER_COLOR_PRESETS.map((p) => {
                        const on =
                          form.bgColor.toLowerCase() === p.value.toLowerCase();
                        return (
                          <button
                            key={p.value}
                            type="button"
                            title={p.label}
                            aria-label={p.label}
                            aria-pressed={on}
                            onClick={() => update({ bgColor: p.value.toUpperCase() })}
                            className={cn(
                              "h-10 w-10 cursor-pointer rounded-md border-2 transition-transform hover:scale-105",
                              on
                                ? "border-brass ring-2 ring-brass/30"
                                : "border-admin-line",
                            )}
                            style={{ backgroundColor: p.value }}
                          />
                        );
                      })}
                    </div>
                    <div data-field="bgColor" className="max-w-xs">
                      <AdminColorPickerField
                        label="Custom color"
                        value={form.bgColor}
                        onChange={(hex) => update({ bgColor: hex })}
                        error={v.errors.bgColor}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 max-w-xs">
                    <AdminImageField
                      label="Poster photo"
                      value={form.imageUrl}
                      onChange={(url) => update({ imageUrl: url })}
                      aspect="portrait"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div data-field="headline" className="sm:col-span-2">
                  <AdminFieldLabel htmlFor="poster-headline">Headline</AdminFieldLabel>
                  <Input
                    id="poster-headline"
                    name="headline"
                    value={form.headline}
                    onChange={(e) => update({ headline: e.target.value })}
                    onBlur={() => v.revalidate(form)}
                    placeholder="Uses the discount if empty"
                    maxLength={80}
                    aria-invalid={v.errors.headline ? true : undefined}
                  />
                  <AdminFieldError message={v.errors.headline} />
                </div>
                <div data-field="subcopy" className="sm:col-span-2">
                  <AdminFieldLabel htmlFor="poster-subcopy">Extra line</AdminFieldLabel>
                  <Textarea
                    id="poster-subcopy"
                    name="subcopy"
                    value={form.subcopy}
                    onChange={(e) => update({ subcopy: e.target.value })}
                    onBlur={() => v.revalidate(form)}
                    rows={2}
                    maxLength={160}
                    aria-invalid={v.errors.subcopy ? true : undefined}
                  />
                  <AdminFieldError message={v.errors.subcopy} />
                </div>
                <div data-field="usageLimit">
                  <AdminFieldLabel htmlFor="poster-limit">Total uses</AdminFieldLabel>
                  <Input
                    id="poster-limit"
                    name="usageLimit"
                    inputMode="numeric"
                    value={form.usageLimit}
                    onChange={(e) =>
                      update({ usageLimit: e.target.value.replace(/\D/g, "") })
                    }
                    onBlur={() => v.revalidate(form)}
                    placeholder="No limit"
                    className={cn("tabular-nums", form.usageLimit && "font-mono!")}
                    aria-invalid={v.errors.usageLimit ? true : undefined}
                  />
                  <AdminFieldError message={v.errors.usageLimit} />
                </div>
                <AdminDatePickerField
                  label="End date"
                  name="expiresAt"
                  value={form.expiresAt}
                  onChange={(d) => update({ expiresAt: d })}
                  placeholder="No end date"
                  clearable
                />
              </div>

              <AdminFormError>{serverError}</AdminFormError>
            </div>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-admin-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void download()}
              disabled={drawing || downloading}
              className="sm:w-auto"
            >
              {downloading ? "Preparing…" : "Download image"}
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={saving || !dirty}
              className="sm:w-auto"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </footer>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard poster changes?"
        description="Your unsaved poster changes will be lost."
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

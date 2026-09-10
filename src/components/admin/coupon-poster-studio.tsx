"use client";

import { useEffect, useRef, useState } from "react";
import { AdminImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
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

export function CouponPosterStudio({ coupon, open, onClose, onSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<PosterFormat>("story");
  const [bgMode, setBgMode] = useState<"color" | "image">(
    coupon.posterBgMode === "image" ? "image" : "color",
  );
  const [bgColor, setBgColor] = useState(coupon.posterBgColor || "#1c1917");
  const [imageUrl, setImageUrl] = useState(coupon.posterImageUrl || "");
  const [headline, setHeadline] = useState(coupon.posterHeadline || "");
  const [subcopy, setSubcopy] = useState(coupon.posterSubcopy || "");
  const [usageLimit, setUsageLimit] = useState(
    coupon.usageLimit != null ? String(coupon.usageLimit) : "",
  );
  const [expiresAt, setExpiresAt] = useState(
    coupon.expiresAt
      ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
      : "",
  );
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [downloading, setDownloading] = useState(false);

  // Reset when a different coupon opens
  useEffect(() => {
    if (!open) return;
    setBgMode(coupon.posterBgMode === "image" ? "image" : "color");
    setBgColor(coupon.posterBgColor || "#1c1917");
    setImageUrl(coupon.posterImageUrl || "");
    setHeadline(coupon.posterHeadline || "");
    setSubcopy(coupon.posterSubcopy || "");
    setUsageLimit(coupon.usageLimit != null ? String(coupon.usageLimit) : "");
    setExpiresAt(
      coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
        : "",
    );
    setError(null);
    setNote(null);
    setDownloading(false);
  }, [open, coupon]);

  // Escape + scroll lock while studio is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const draft: CouponPosterInput = {
    code: coupon.code,
    label: coupon.label,
    type: coupon.type,
    value: coupon.value,
    minSubtotalPkr: coupon.minSubtotalPkr,
    usageLimit: usageLimit.trim() ? Number(usageLimit) : null,
    expiresAt: expiresAt || null,
    posterBgMode: bgMode,
    posterBgColor: bgColor,
    posterImageUrl: imageUrl,
    posterHeadline: headline,
    posterSubcopy: subcopy,
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
    bgMode,
    bgColor,
    imageUrl,
    headline,
    subcopy,
    usageLimit,
    expiresAt,
    coupon.code,
    coupon.label,
    coupon.type,
    coupon.value,
    coupon.minSubtotalPkr,
  ]);

  if (!open) return null;

  async function save() {
    setSaving(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: coupon.id,
          usageLimit: usageLimit.trim() ? Number(usageLimit) : null,
          expiresAt: expiresAt || null,
          posterBgMode: bgMode,
          posterBgColor: bgColor,
          posterImageUrl: imageUrl,
          posterHeadline: headline,
          posterSubcopy: subcopy,
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || "Could not save poster settings");
        return;
      }
      onSaved(j.data as AdminCoupon);
      setNote("Poster settings saved.");
    } catch {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  async function download() {
    setDownloading(true);
    setError(null);
    try {
      const dataUrl = await exportCouponPosterPng({
        coupon: draft,
        format,
      });
      downloadDataUrl(
        dataUrl,
        `ns-perfume-coupon-${coupon.code.toLowerCase()}-${format}.png`,
      );
    } catch {
      setError("Could not export poster. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  const dims = POSTER_FORMATS[format];

  return (
    <div className="fixed inset-0 z-120 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close poster studio"
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="poster-studio-title"
        className="relative z-1 flex max-h-[min(92dvh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-xl border border-admin-line bg-admin-paper shadow-2xl sm:rounded-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-admin-line px-5 py-4">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-admin-muted">
              Marketing poster
            </p>
            <h2
              id="poster-studio-title"
              className="mt-1 font-display text-xl font-semibold text-admin-ink"
            >
              {coupon.code}
            </h2>
            <p className="mt-0.5 text-sm text-admin-muted">
              Live preview matches the downloaded PNG.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Preview */}
          <div className="flex min-h-0 flex-col items-center gap-3 overflow-y-auto border-b border-admin-line bg-admin-soft-2 p-5 lg:border-b-0 lg:border-r">
            <div
              className={cn(
                "relative mx-auto w-full max-w-[280px] overflow-hidden rounded-lg bg-admin-soft shadow-lg ring-1 ring-black/10 sm:max-w-[320px]",
                drawing && "opacity-80",
              )}
              style={{
                aspectRatio: `${dims.width} / ${dims.height}`,
              }}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
                aria-label="Coupon poster preview"
              />
            </div>
            <p className="text-center text-xs text-admin-faint">
              {dims.label}
              {drawing ? " · Updating…" : ""}
            </p>
            <div className="flex w-full max-w-[320px] flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void download()}
                disabled={drawing || downloading}
                className="flex-1"
              >
                {downloading ? "Preparing…" : "Download PNG"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void save()}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving…" : "Save settings"}
              </Button>
            </div>
            {error ? (
              <p className="text-center text-sm text-rosewood">{error}</p>
            ) : null}
            {note ? (
              <p className="text-center text-sm text-admin-muted">
                {note}
              </p>
            ) : null}
          </div>

          {/* Controls */}
          <div className="min-h-0 space-y-5 overflow-y-auto p-5">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-admin-muted">
                Format
              </p>
              <div className="mt-2">
                <Select
                  label="Export size"
                  value={format}
                  onValueChange={(v) => setFormat(v as PosterFormat)}
                  options={Object.entries(POSTER_FORMATS).map(([id, f]) => ({
                    value: id,
                    label: f.label,
                  }))}
                />
              </div>
            </div>

            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-admin-muted">
                Background
              </p>
              <div className="mt-2 inline-flex gap-1 rounded-md border border-admin-line p-0.5">
                <Button
                  type="button"
                  variant={bgMode === "color" ? "primary" : "secondary"}
                  className="min-h-0! px-3! py-1.5! text-xs uppercase tracking-wide"
                  onClick={() => setBgMode("color")}
                >
                  Solid color
                </Button>
                <Button
                  type="button"
                  variant={bgMode === "image" ? "primary" : "secondary"}
                  className="min-h-0! px-3! py-1.5! text-xs uppercase tracking-wide"
                  onClick={() => setBgMode("image")}
                >
                  Image
                </Button>
              </div>

              {bgMode === "color" ? (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {POSTER_COLOR_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        title={p.label}
                        onClick={() => setBgColor(p.value)}
                        className={cn(
                          "h-9 w-9 cursor-pointer rounded-md border-2 transition-transform hover:scale-105",
                          bgColor.toLowerCase() === p.value.toLowerCase()
                            ? "border-admin-ink ring-2 ring-admin-ink/20"
                            : "border-transparent ring-1 ring-black/10",
                        )}
                        style={{ backgroundColor: p.value }}
                      />
                    ))}
                  </div>
                  <div className="flex items-end gap-3">
                    <Input
                      label="Custom hex"
                      value={bgColor}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        if (/^#([0-9a-fA-F]{0,6})$/.test(v) || v === "") {
                          setBgColor(v.startsWith("#") ? v : `#${v}`);
                        }
                      }}
                      placeholder="#1c1917"
                    />
                    <input
                      type="color"
                      value={
                        /^#([0-9a-fA-F]{6})$/.test(bgColor)
                          ? bgColor
                          : "#1c1917"
                      }
                      onChange={(e) => setBgColor(e.target.value)}
                      className="mb-0.5 h-11 w-14 cursor-pointer rounded border border-admin-line bg-transparent p-1"
                      aria-label="Pick solid color"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <AdminImageField
                    label="Poster image"
                    hint="Upload or paste a URL. Full-bleed with a dark veil for type."
                    value={imageUrl}
                    onChange={setImageUrl}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Headline (optional)"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Auto from discount"
                maxLength={80}
              />
              <Input
                label="Usage limit"
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
              />
              <Input
                label="Expires on"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Subcopy (optional)"
                  value={subcopy}
                  onChange={(e) => setSubcopy(e.target.value)}
                  rows={2}
                  maxLength={160}
                  placeholder="Extra line on the poster"
                />
              </div>
            </div>

            <p className="rounded-md border border-admin-line bg-admin-soft-2 px-3 py-2.5 text-sm leading-relaxed text-admin-muted">
              Code, offer, minimum order, expiry, and limit appear on the poster.
              Leave usage limit empty for unlimited redemptions. Checkout blocks
              the code once uses reach the limit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

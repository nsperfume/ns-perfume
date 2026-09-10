"use client";

import { useEffect, useState } from "react";
import {
  AdminCard,
  AdminStatusBadge,
} from "@/components/admin/ui";
import {
  CouponPosterStudio,
  type AdminCoupon,
} from "@/components/admin/coupon-poster-studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";

function typeLabel(t: string) {
  if (t === "percent") return "Percent off";
  if (t === "fixed") return "Fixed PKR";
  return "Free shipping";
}

function usageLabel(c: AdminCoupon) {
  if (c.usageLimit != null && c.usageLimit > 0) {
    const left = Math.max(0, c.usageLimit - c.usedCount);
    return `${c.usedCount}/${c.usageLimit} used · ${left} left`;
  }
  return `${c.usedCount} used · unlimited`;
}

type Props = {
  canDelete: boolean;
};

export function CouponManager({ canDelete }: Props) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponForm, setCouponForm] = useState({
    code: "",
    label: "",
    type: "percent" as AdminCoupon["type"],
    value: 10,
    minSubtotalPkr: 0,
    usageLimit: "",
    expiresAt: "",
  });
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSaving, setCouponSaving] = useState(false);
  const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState(false);
  const [posterCoupon, setPosterCoupon] = useState<AdminCoupon | null>(null);

  function loadCoupons() {
    setLoading(true);
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setCoupons(j.data as AdminCoupon[]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponSaving(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponForm.code,
          label: couponForm.label,
          type: couponForm.type,
          value: couponForm.value,
          minSubtotalPkr: couponForm.minSubtotalPkr,
          usageLimit: couponForm.usageLimit.trim()
            ? Number(couponForm.usageLimit)
            : null,
          expiresAt: couponForm.expiresAt || null,
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        setCouponError(j.error || "Could not create coupon");
        return;
      }
      setCouponForm({
        code: "",
        label: "",
        type: "percent",
        value: 10,
        minSubtotalPkr: 0,
        usageLimit: "",
        expiresAt: "",
      });
      loadCoupons();
      // Open poster studio for the new code immediately (marketing flow).
      setPosterCoupon(j.data as AdminCoupon);
    } catch {
      setCouponError("Network error");
    } finally {
      setCouponSaving(false);
    }
  }

  async function toggleCoupon(c: AdminCoupon) {
    await fetch("/api/admin/coupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    loadCoupons();
  }

  async function confirmDeleteCoupon() {
    if (!deleteCouponId) return;
    setDeletingCoupon(true);
    try {
      await fetch(`/api/admin/coupons/${deleteCouponId}`, { method: "DELETE" });
      setDeleteCouponId(null);
      loadCoupons();
    } finally {
      setDeletingCoupon(false);
    }
  }

  return (
    <>
      <AdminCard title="Coupon codes">
        <form
          className="space-y-4 border-b border-admin-line p-5"
          onSubmit={createCoupon}
        >
          <p className="text-sm leading-relaxed text-admin-muted">
            Codes for checkout and ad campaigns. Set a usage limit for limited
            runs. After create, open the poster studio to design and download
            PNG creatives.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Code"
              required
              value={couponForm.code}
              onChange={(e) =>
                setCouponForm({
                  ...couponForm,
                  code: e.target.value.toUpperCase(),
                })
              }
              placeholder="SPRING15"
            />
            <Input
              label="Label"
              value={couponForm.label}
              onChange={(e) =>
                setCouponForm({ ...couponForm, label: e.target.value })
              }
              placeholder="Spring campaign"
            />
            <Select
              label="Type"
              value={couponForm.type}
              onValueChange={(v) =>
                setCouponForm({
                  ...couponForm,
                  type: v as AdminCoupon["type"],
                  value: v === "free_shipping" ? 0 : couponForm.value || 10,
                })
              }
              options={[
                { value: "percent", label: "Percent off" },
                { value: "fixed", label: "Fixed PKR off" },
                { value: "free_shipping", label: "Free standard shipping" },
              ]}
            />
            {couponForm.type !== "free_shipping" ? (
              <Input
                label={
                  couponForm.type === "percent" ? "Percent (1-100)" : "PKR off"
                }
                type="number"
                min={1}
                max={couponForm.type === "percent" ? 100 : 1000000}
                value={couponForm.value}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    value: Number(e.target.value),
                  })
                }
              />
            ) : null}
            <Input
              label="Min subtotal (PKR)"
              type="number"
              min={0}
              value={couponForm.minSubtotalPkr}
              onChange={(e) =>
                setCouponForm({
                  ...couponForm,
                  minSubtotalPkr: Number(e.target.value),
                })
              }
            />
            <Input
              label="Usage limit"
              type="number"
              min={1}
              value={couponForm.usageLimit}
              onChange={(e) =>
                setCouponForm({
                  ...couponForm,
                  usageLimit: e.target.value,
                })
              }
              placeholder="e.g. 10 (empty = unlimited)"
            />
            <Input
              label="Expires on"
              type="date"
              value={couponForm.expiresAt}
              onChange={(e) =>
                setCouponForm({
                  ...couponForm,
                  expiresAt: e.target.value,
                })
              }
            />
          </div>
          {couponError ? (
            <p className="text-sm font-medium text-rosewood">{couponError}</p>
          ) : null}
          <Button type="submit" disabled={couponSaving}>
            {couponSaving ? "Creating…" : "Add coupon"}
          </Button>
        </form>

        <ul className="divide-y divide-admin-line">
          {coupons.map((c) => {
            const exhausted =
              c.usageLimit != null &&
              c.usageLimit > 0 &&
              c.usedCount >= c.usageLimit;
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-medium text-admin-ink">
                      {c.code}
                    </p>
                    {exhausted ? (
                      <span className="rounded bg-rosewood/15 px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide text-rosewood">
                        Limit reached
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-admin-muted">
                    {c.label || typeLabel(c.type)}
                    {" · "}
                    {c.type === "percent"
                      ? `${c.value}%`
                      : c.type === "fixed"
                        ? `Rs ${c.value}`
                        : "Free standard ship"}
                    {c.minSubtotalPkr
                      ? ` · min Rs ${c.minSubtotalPkr}`
                      : ""}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-display text-xs tabular-nums",
                      exhausted
                        ? "text-rosewood"
                        : "text-admin-faint",
                    )}
                  >
                    {usageLabel(c)}
                    {c.expiresAt
                      ? ` · ends ${new Date(c.expiresAt).toLocaleDateString("en-PK")}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminStatusBadge
                    status={c.active ? "published" : "draft"}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10! min-h-10! w-auto! px-3!"
                    onClick={() => setPosterCoupon(c)}
                  >
                    Poster
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10! min-h-10! w-auto! px-3!"
                    onClick={() => toggleCoupon(c)}
                  >
                    {c.active ? "Disable" : "Enable"}
                  </Button>
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="danger"
                      className="h-10! min-h-10! w-auto! px-3!"
                      onClick={() => setDeleteCouponId(c.id)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
          {!loading && coupons.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-admin-muted">
              No coupons yet.
            </li>
          ) : null}
          {loading && coupons.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-admin-muted">
              Loading coupons…
            </li>
          ) : null}
        </ul>
      </AdminCard>

      <ConfirmDialog
        open={Boolean(deleteCouponId)}
        onOpenChange={(o) => {
          if (!o && !deletingCoupon) setDeleteCouponId(null);
        }}
        title="Delete this coupon?"
        description="Customers will no longer be able to redeem this code. Poster assets already downloaded stay on your device."
        confirmLabel="Delete coupon"
        loading={deletingCoupon}
        onConfirm={confirmDeleteCoupon}
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

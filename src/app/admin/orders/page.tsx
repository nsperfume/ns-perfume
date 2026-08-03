"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminModal,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

import { formatOrderNumber } from "@/lib/order-number";
import { formatSize } from "@/lib/format";

type OrderLine = {
  name?: string;
  sizeMl?: number;
  quantity?: number;
  unitPricePkr?: number;
  sku?: string;
  isGift?: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
  image?: string;
};

type Order = {
  _id: string;
  orderNumber: string;
  email: string;
  customerName?: string;
  phone?: string;
  status: string;
  totalPkr: number;
  subtotalPkr?: number;
  shippingPkr?: number;
  discountPkr?: number;
  paymentMethod?: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt?: string;
  lines?: OrderLine[];
  notes?: string;
  shippingAddress?: {
    address1?: string;
    city?: string;
    province?: string;
  };
};

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export default function AdminOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);

  const load = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setOrders(j.data);
      });
  }, []);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    load();
  }, [router, load]);

  const updateStatus = async (orderNumber: string, status: string) => {
    setSaving(orderNumber);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Update failed");
      } else {
        setMsg(`${formatOrderNumber(orderNumber)} updated to ${status}`);
        load();
        setDetail((d) =>
          d && d.orderNumber === orderNumber
            ? { ...d, status, trackingNumber: json.data?.trackingNumber || d.trackingNumber }
            : d,
        );
      }
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Orders"
        description="Fulfillment status updates the customer track-order page."
      />

      {msg ? (
        <p className="mb-4 border border-[var(--admin-line)] bg-[var(--admin-paper)] px-4 py-2.5 text-sm text-[var(--admin-ink)]">
          {msg}
        </p>
      ) : null}

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Order</AdminTh>
            <AdminTh>Customer</AdminTh>
            <AdminTh>Payment</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="text-right">Total</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const ref = formatOrderNumber(o.orderNumber);
            return (
              <tr key={o._id} className="hover:bg-[var(--admin-soft)]">
                <AdminTd>
                  <p className="font-semibold">{ref}</p>
                  <p className="text-[11px] text-[var(--admin-faint)]">
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </AdminTd>
                <AdminTd>
                  <p className="font-medium">{o.customerName || "—"}</p>
                  <p className="text-[11px] text-[var(--admin-muted)]">{o.email}</p>
                </AdminTd>
                <AdminTd>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                    {o.paymentMethod || "—"}
                  </span>
                </AdminTd>
                <AdminTd>
                  <AdminStatusBadge status={o.status} />
                </AdminTd>
                <AdminTd className="text-right font-medium tabular-nums">
                  {formatPkr(o.totalPkr)}
                </AdminTd>
                <AdminTd className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="!h-10 !min-h-10 !w-auto !px-4"
                      onClick={() => setDetail(o)}
                    >
                      Details
                    </Button>
                    <Button
                      href={`/track-order?orderNumber=${encodeURIComponent(o.orderNumber)}&email=${encodeURIComponent(o.email)}`}
                      variant="ghost"
                      className="!min-h-10"
                    >
                      Track
                    </Button>
                  </div>
                </AdminTd>
              </tr>
            );
          })}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-14 text-center text-[var(--admin-muted)]">
                No orders yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>

      <AdminModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={
          detail
            ? `Order ${formatOrderNumber(detail.orderNumber)}`
            : "Order"
        }
        wide
      >
        {detail ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <AdminStatusBadge status={detail.status} />
              <span className="text-sm text-[var(--admin-muted)]">
                {detail.paymentMethod?.toUpperCase() || "—"}
              </span>
              <span className="ml-auto text-lg font-semibold tabular-nums">
                {formatPkr(detail.totalPkr)}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Customer
                </p>
                <p className="mt-1 text-sm font-medium">{detail.customerName}</p>
                <p className="text-sm text-[var(--admin-muted)]">{detail.email}</p>
                {detail.phone ? (
                  <p className="text-sm text-[var(--admin-muted)]">{detail.phone}</p>
                ) : null}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Ship to
                </p>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  {[
                    detail.shippingAddress?.address1,
                    detail.shippingAddress?.city,
                    detail.shippingAddress?.province,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Line items
              </p>
              <ul className="divide-y divide-black/10 border border-[var(--admin-line)]">
                {(detail.lines || []).map((l, i) => (
                  <li
                    key={`${l.sku}-${i}`}
                    className="flex justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {l.name}
                        {l.isGift ? " (Gift)" : ""}
                      </p>
                      <p className="text-[11px] text-[var(--admin-muted)]">
                        Qty {l.quantity}
                        {l.sizeMl ? ` · ${formatSize(l.sizeMl)}` : ""}
                        {l.giftWrap ? " · Wrap" : ""}
                      </p>
                      {l.giftMessage ? (
                        <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
                          Note: {l.giftMessage}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 tabular-nums">
                      {formatPkr((l.unitPricePkr || 0) * (l.quantity || 1))}
                    </p>
                  </li>
                ))}
                {!detail.lines?.length ? (
                  <li className="px-3 py-4 text-sm text-[var(--admin-muted)]">
                    Line detail not loaded. Status changes still apply.
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Update status"
                value={detail.status}
                onValueChange={(v) => updateStatus(detail.orderNumber, v)}
                options={STATUSES}
                disabled={saving === detail.orderNumber}
              />
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Tracking
                </p>
                <p className="text-sm font-mono">
                  {detail.trackingNumber || "—"}
                </p>
                {detail.carrier ? (
                  <p className="text-xs text-[var(--admin-muted)]">{detail.carrier}</p>
                ) : null}
              </div>
            </div>

            {detail.notes ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                  Notes
                </p>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">{detail.notes}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-[var(--admin-line)] pt-4">
              <Button
                href={`/track-order?orderNumber=${encodeURIComponent(detail.orderNumber)}&email=${encodeURIComponent(detail.email)}`}
                variant="secondary"
              >
                Open track page
              </Button>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </AdminShell>
  );
}

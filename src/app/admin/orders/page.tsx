"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminPageHeader,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatOrderNumber } from "@/lib/order-number";
import {
  ORDER_STATUSES,
  formatOrderDate,
  mapAdminOrder,
  paymentLabel,
  paymentShort,
  type AdminOrder,
} from "@/lib/admin-order-ui";

const selectTrigger =
  "h-10! min-h-10! border-admin-input-border! bg-admin-soft-2! text-admin-ink! text-xs!";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setOrders((j.data || []).map(mapAdminOrder));
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
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === orderNumber
              ? {
                  ...o,
                  status,
                  trackingNumber:
                    json.data?.trackingNumber || o.trackingNumber,
                  carrier: json.data?.carrier || o.carrier,
                }
              : o,
          ),
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
        description="Fulfillment status updates the customer track-order page. Open an order for the full detail view."
      />

      {msg ? (
        <p className="mb-4 border border-admin-line bg-admin-paper px-4 py-2.5 text-sm text-admin-ink">
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
              <tr key={o._id} className="hover:bg-admin-soft">
                <AdminTd>
                  <p className="font-semibold">{ref}</p>
                  <p className="text-[11px] text-admin-faint">
                    {formatOrderDate(o.createdAt)}
                  </p>
                </AdminTd>
                <AdminTd>
                  <p className="font-medium">{o.customerName || "—"}</p>
                  <p className="text-[11px] text-admin-muted">
                    {o.email}
                  </p>
                </AdminTd>
                <AdminTd>
                  <p className="text-xs font-semibold uppercase tracking-wide text-admin-ink">
                    {paymentShort(o.paymentMethod)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-admin-faint">
                    {paymentLabel(o.paymentMethod)}
                  </p>
                  {o.paymentMethod === "bank" && o.status === "pending" ? (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-brass">
                      Await transfer
                    </p>
                  ) : null}
                  {o.paymentMethod === "card" && o.cardLast4 ? (
                    <p className="mt-1 font-mono text-[11px] text-admin-faint">
                      ···· {o.cardLast4}
                    </p>
                  ) : null}
                </AdminTd>
                <AdminTd className="min-w-[9.5rem]">
                  <Select
                    aria-label={`Status for ${ref}`}
                    value={o.status}
                    onValueChange={(v) => updateStatus(o.orderNumber, v)}
                    options={[...ORDER_STATUSES]}
                    disabled={saving === o.orderNumber}
                    triggerClassName={selectTrigger}
                  />
                </AdminTd>
                <AdminTd className="text-right font-medium tabular-nums">
                  {formatPkr(o.totalPkr)}
                </AdminTd>
                <AdminTd className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      href={`/admin/orders/${encodeURIComponent(o.orderNumber)}`}
                      variant="secondary"
                      className="h-10! min-h-10! w-auto! px-4!"
                    >
                      Details
                    </Button>
                    <Button
                      href={`/track-order?orderNumber=${encodeURIComponent(o.orderNumber)}&email=${encodeURIComponent(o.email)}`}
                      variant="ghost"
                      className="min-h-10!"
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
              <td
                colSpan={6}
                className="px-4 py-14 text-center text-admin-muted"
              >
                No orders yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </AdminShell>
  );
}

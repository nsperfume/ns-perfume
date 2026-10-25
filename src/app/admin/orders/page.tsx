"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminNotice,
  AdminPageHeader,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatOrderNumber } from "@/lib/order-number";
import {
  formatOrderDate,
  mapAdminOrder,
  orderStatusOptions,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "info" | "error" } | null>(
    null,
  );
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setOrders((j.data || []).map(mapAdminOrder));
        else setMsg({ text: j.error || "Could not load orders", tone: "error" });
      })
      .catch(() =>
        setMsg({ text: "Network error while loading orders", tone: "error" }),
      )
      .finally(() => setLoading(false));
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
      const json = await readAdminJson<{
        status?: string;
        trackingNumber?: string;
        carrier?: string;
      }>(res);
      if (!json.ok) {
        setMsg({ text: json.error || "Update failed", tone: "error" });
      } else {
        setMsg({
          text: `${formatOrderNumber(orderNumber)} updated to ${status}`,
          tone: "info",
        });
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === orderNumber
              ? {
                  ...o,
                  status: json.data?.status || status,
                  trackingNumber: json.data?.trackingNumber ?? o.trackingNumber,
                  carrier: json.data?.carrier ?? o.carrier,
                }
              : o,
          ),
        );
      }
    } catch {
      setMsg({ text: "Network error. The order was not updated.", tone: "error" });
    } finally {
      setSaving(null);
    }
  };

  function onStatusChange(o: AdminOrder, next: string) {
    if (next === o.status) return;
    if (next === "cancelled") {
      setCancelTarget(o);
      return;
    }
    void updateStatus(o.orderNumber, next);
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Orders"
        description="Fulfillment status updates the customer track-order page. Open an order for the full detail view."
      />

      {msg ? (
        <AdminNotice tone={msg.tone} onDismiss={() => setMsg(null)}>
          {msg.text}
        </AdminNotice>
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
                    onValueChange={(v) => onStatusChange(o, v)}
                    options={orderStatusOptions(o.status)}
                    disabled={
                      saving === o.orderNumber || o.status === "cancelled"
                    }
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
                {loading ? "Loading orders…" : "No orders yet."}
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(o) => {
          if (!o && !saving) setCancelTarget(null);
        }}
        title="Cancel this order?"
        description={
          cancelTarget
            ? `${formatOrderNumber(cancelTarget.orderNumber)} will be marked cancelled and the customer track page will say so.${
                cancelTarget.discountCode
                  ? ` One use of ${cancelTarget.discountCode} goes back to the coupon.`
                  : ""
              } Cancelled orders cannot be reopened.`
            : "Cancelled orders cannot be reopened."
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={Boolean(cancelTarget && saving === cancelTarget.orderNumber)}
        onConfirm={async () => {
          if (!cancelTarget) return;
          await updateStatus(cancelTarget.orderNumber, "cancelled");
          setCancelTarget(null);
        }}
      />
    </AdminShell>
  );
}

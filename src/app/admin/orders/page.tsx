"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DownloadIcon } from "@animateicons/react/lucide";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminPageHeader,
  AdminSearchInput,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr,
  readAdminJson,
  useRowLink,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Select } from "@/components/admin/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toast";
import { formatOrderNumber } from "@/lib/order-number";
import {
  ORDER_STATUSES,
  formatOrderDate,
  mapAdminOrder,
  orderStatusOptions,
  paymentLabel,
  type AdminOrder,
} from "@/lib/admin-order-ui";

const selectTrigger = "h-10! min-h-10! text-sm! px-3!";

function invoiceHref(orderNumber: string) {
  return `/api/orders/${encodeURIComponent(orderNumber)}/invoice`;
}

/** Library formatters return a dash for missing values; show nothing instead. */
function payment(method?: string) {
  const label = paymentLabel(method);
  return label === "—" ? "" : label;
}

function statusLabel(value: string) {
  return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const rowLink = useRowLink();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setOrders((j.data || []).map(mapAdminOrder));
        else setLoadError(j.error || "Could not load orders");
      })
      .catch(() => setLoadError("Could not load orders. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  // Dashboard links such as /admin/orders?status=pending open pre-filtered
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status && ORDER_STATUSES.some((s) => s.value === status)) setFilter(status);
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
        toast.error(json.error || "Could not update the order");
      } else {
        toast.success(
          `${formatOrderNumber(orderNumber)} marked ${statusLabel(status).toLowerCase()}`,
        );
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
      toast.error("Network error. The order was not updated.");
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

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const chips = useMemo(
    () => [
      { value: "all", label: "All", count: counts.all },
      ...ORDER_STATUSES.filter((s) => counts[s.value] || s.value === filter).map((s) => ({
        value: s.value,
        label: s.label,
        count: counts[s.value] || 0,
      })),
    ],
    [counts, filter],
  );

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!term) return true;
      return [o.orderNumber, formatOrderNumber(o.orderNumber), o.customerName, o.email, o.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [orders, filter, q]);

  const filtered = filter !== "all" || q.trim() !== "";
  const empty = !loading && visible.length === 0;

  const emptyState = loadError ? (
    <AdminEmptyState
      title="Orders could not load"
      description={loadError}
      action={
        <Button variant="secondary" onClick={load}>
          Try again
        </Button>
      }
    />
  ) : filtered ? (
    <AdminEmptyState
      title="No orders match"
      action={
        <Button
          variant="secondary"
          onClick={() => {
            setQ("");
            setFilter("all");
          }}
        >
          Clear filters
        </Button>
      }
    />
  ) : (
    <AdminEmptyState
      title="No orders yet"
      description="New orders from the store will show up here."
      action={
        <Button href="/admin/products" variant="secondary">
          Review products
        </Button>
      }
    />
  );

  return (
    <AdminShell user={user}>
      <AdminPageHeader title="Orders" />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminFilterChips
          label="Order status"
          value={filter}
          onChange={setFilter}
          options={chips}
        />
        <AdminSearchInput
          value={q}
          onChange={setQ}
          placeholder="Search order, name, email or phone"
          label="Search orders"
          className="w-full lg:max-w-sm"
        />
      </div>

      {/* Phones: one card per order (status and actions without sideways scrolling) */}
      <div className="md:hidden">
        {loading && !orders.length ? (
          <p className="rounded-lg border border-admin-line bg-admin-paper px-4 py-12 text-center text-admin-muted">
            Loading orders…
          </p>
        ) : empty ? (
          <div className="rounded-lg border border-admin-line bg-admin-paper">
            {emptyState}
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Orders">
            {visible.map((o) => {
              const ref = formatOrderNumber(o.orderNumber);
              const detailHref = `/admin/orders/${encodeURIComponent(o.orderNumber)}`;
              return (
                <li
                  key={o._id}
                  className="rounded-lg border border-admin-line bg-admin-paper p-4 shadow-admin"
                >
                  <Link href={detailHref} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[0.9375rem] font-medium text-admin-ink">
                          {ref}
                        </p>
                        <p className="mt-0.5 text-[0.8125rem] text-admin-muted">
                          {formatOrderDate(o.createdAt)}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-[0.9375rem] font-medium tabular-nums text-admin-ink">
                        {formatPkr(o.totalPkr)}
                      </p>
                    </div>
                    <div className="mt-3 min-w-0">
                      <p className="font-medium text-admin-ink">
                        {o.customerName || o.email}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-admin-muted">
                        <span>{payment(o.paymentMethod)}</span>
                        {o.paymentMethod === "bank" && o.status === "pending" ? (
                          <span className="font-semibold text-admin-accent">
                            Awaiting transfer
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                  <div className="mt-3 flex items-center gap-2 border-t border-admin-line pt-3">
                    <Select
                      aria-label={`Status for ${ref}`}
                      value={o.status}
                      onValueChange={(v) => onStatusChange(o, v)}
                      options={orderStatusOptions(o.status)}
                      disabled={
                        saving === o.orderNumber || o.status === "cancelled"
                      }
                      className="min-w-0 flex-1"
                      triggerClassName={selectTrigger}
                    />
                    <a
                      href={invoiceHref(o.orderNumber)}
                      download
                      aria-label={`Download invoice for ${ref}`}
                      title="Download invoice"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-admin-line text-admin-muted transition-colors hover:border-admin-ink hover:text-admin-ink"
                    >
                      <DownloadIcon size={18} color="currentColor" isAnimated={false} />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AdminTable className="hidden md:block">
        <thead>
          <tr>
            <AdminTh>Order</AdminTh>
            <AdminTh>Date</AdminTh>
            <AdminTh>Customer</AdminTh>
            <AdminTh>Payment</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh numeric>Total</AdminTh>
            <AdminTh className="w-14">
              <span className="sr-only">Invoice</span>
            </AdminTh>
          </tr>
        </thead>
        <tbody>
          {visible.map((o) => {
            const ref = formatOrderNumber(o.orderNumber);
            const detailHref = `/admin/orders/${encodeURIComponent(o.orderNumber)}`;
            const row = rowLink(detailHref);
            return (
              <tr key={o._id} onClick={row.onClick} className={row.className}>
                <AdminTd className="whitespace-nowrap">
                  <Link
                    href={detailHref}
                    className="font-mono text-[0.875rem] font-medium text-admin-ink hover:underline"
                  >
                    {ref}
                  </Link>
                </AdminTd>
                <AdminTd className="whitespace-nowrap text-admin-muted">
                  {formatOrderDate(o.createdAt)}
                </AdminTd>
                <AdminTd className="max-w-[18rem]">
                  <p className="truncate font-medium">
                    {o.customerName || o.email}
                  </p>
                  {o.customerName ? (
                    <p
                      className="truncate text-[0.8125rem] text-admin-muted"
                      title={o.email}
                    >
                      {o.email}
                    </p>
                  ) : null}
                </AdminTd>
                <AdminTd className="whitespace-nowrap">
                  <p>{payment(o.paymentMethod)}</p>
                  {o.paymentMethod === "bank" && o.status === "pending" ? (
                    <p className="mt-0.5 text-[0.8125rem] font-semibold text-admin-accent">
                      Awaiting transfer
                    </p>
                  ) : null}
                  {o.paymentMethod === "card" && o.cardLast4 ? (
                    <p className="mt-0.5 font-mono text-[0.8125rem] text-admin-muted">
                      •••• {o.cardLast4}
                    </p>
                  ) : null}
                </AdminTd>
                <AdminTd className="w-44 min-w-[10rem]">
                  <div data-row-ignore>
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
                  </div>
                </AdminTd>
                <AdminTd numeric className="font-medium">
                  {formatPkr(o.totalPkr)}
                </AdminTd>
                <AdminTd className="text-right">
                  <a
                    href={invoiceHref(o.orderNumber)}
                    download
                    aria-label={`Download invoice for ${ref}`}
                    title="Download invoice"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md text-admin-muted transition-colors hover:bg-admin-soft hover:text-admin-ink"
                  >
                    <DownloadIcon size={18} color="currentColor" isAnimated={false} />
                  </a>
                </AdminTd>
              </tr>
            );
          })}
          {loading && !orders.length ? (
            <tr>
              <td colSpan={7} className="px-4 py-14 text-center text-admin-muted">
                Loading orders…
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={7}>{emptyState}</td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>

      {!loading && visible.length > 0 ? (
        <p className="mt-3 text-sm text-admin-muted">
          {visible.length} of {orders.length} orders
        </p>
      ) : null}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(o) => {
          if (!o && !saving) setCancelTarget(null);
        }}
        title="Cancel this order?"
        description={
          cancelTarget
            ? `${formatOrderNumber(cancelTarget.orderNumber)} will be marked cancelled and the customer will see this on the tracking page.${
                cancelTarget.discountCode
                  ? ` One use of ${cancelTarget.discountCode} goes back to the coupon.`
                  : ""
              } This cannot be undone.`
            : "This cannot be undone."
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

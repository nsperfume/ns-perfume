"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminIconAction,
  AdminPageHeader,
  AdminPagination,
  AdminRowActions,
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
import {
  OrderStatusDialog,
  type OrderStatusChange,
} from "@/components/admin/order-status-dialog";
import { toast } from "@/components/admin/toast";
import { formatOrderNumber } from "@/lib/order-number";
import { cn } from "@/lib/cn";
import {
  ORDER_STATUSES,
  formatOrderDate,
  mapAdminOrder,
  orderStatusLabel,
  orderStatusOptions,
  paymentLabel,
  type AdminOrder,
} from "@/lib/admin-order-ui";

const PAGE_SIZE = 25;

type OrdersPage = {
  rows: unknown[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: Record<string, number>;
};

const selectTrigger = "h-10! min-h-10! text-sm! px-3!";

function invoiceHref(orderNumber: string) {
  return `/api/orders/${encodeURIComponent(orderNumber)}/invoice`;
}

/** Library formatters return a dash for missing values; show nothing instead. */
function payment(method?: string) {
  const label = paymentLabel(method);
  return label === "—" ? "" : label;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const rowLink = useRowLink();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [statusChange, setStatusChange] = useState<{
    order: AdminOrder;
    next: string;
  } | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<Omit<OrdersPage, "rows">>({
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    counts: { all: 0 },
  });
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (filter !== "all") params.set("status", filter);
    if (search) params.set("q", search);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => readAdminJson<OrdersPage>(r))
      .then((j) => {
        if (id !== requestId.current) return;
        if (j.ok && j.data) {
          const { rows, ...meta } = j.data;
          setOrders((rows || []).map(mapAdminOrder));
          setResult(meta);
          if (meta.page !== page) setPage(meta.page);
          setLoaded(true);
        } else setLoadError(j.error || "Could not load orders");
      })
      .catch(() => {
        if (id === requestId.current)
          setLoadError("Could not load orders. Check your connection.");
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [page, filter, search]);

  // Dashboard links such as /admin/orders?status=pending open pre-filtered;
  // page and search come back from the address after viewing an order.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status && ORDER_STATUSES.some((s) => s.value === status)) setFilter(status);
    const term = params.get("q")?.trim() || "";
    if (term) {
      setQ(term);
      setSearch(term);
    }
    const p = Number.parseInt(params.get("page") || "", 10);
    if (p > 1) setPage(p);
    setReady(true);
  }, []);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
  }, [router]);

  // Search runs on the server, a moment after typing stops.
  useEffect(() => {
    const term = q.trim();
    if (term === search) return;
    const t = setTimeout(() => {
      setSearch(term);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q, search]);

  useEffect(() => {
    if (!ready) return;
    load();
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search) params.set("q", search);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );
  }, [ready, load, filter, search, page]);

  function changeFilter(next: string) {
    setFilter(next);
    setPage(1);
  }

  function changePage(next: number) {
    setPage(next);
    document.querySelector(".admin-main-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateStatus(order: AdminOrder, change: OrderStatusChange) {
    const { orderNumber } = order;
    setSaving(orderNumber);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(change),
        },
      );
      const json = await readAdminJson<{
        status?: string;
        trackingNumber?: string;
        trackingUrl?: string;
        carrier?: string;
      }>(res);
      if (!json.ok) {
        toast.error(json.error || "Could not update the order");
        return;
      }
      toast.success(
        `${formatOrderNumber(orderNumber)} marked ${orderStatusLabel(change.status).toLowerCase()}`,
        change.status === "pending"
          ? undefined
          : { description: "The customer will get an email about it." },
      );
      setStatusChange(null);
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === orderNumber
            ? {
                ...o,
                status: json.data?.status || change.status,
                trackingNumber: json.data?.trackingNumber ?? o.trackingNumber,
                trackingUrl: json.data?.trackingUrl ?? o.trackingUrl,
                carrier: json.data?.carrier ?? o.carrier,
              }
            : o,
        ),
      );
      // Refresh the counts (and the list when a status filter is on).
      load();
    } catch {
      toast.error("Network error. The order was not updated.");
    } finally {
      setSaving(null);
    }
  }

  function onStatusChange(o: AdminOrder, next: string) {
    if (next === o.status) return;
    setStatusChange({ order: o, next });
  }

  const counts = result.counts;

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

  const visible = orders;

  const filtered = filter !== "all" || search !== "";
  const empty = loaded && !loading && visible.length === 0;
  const firstLoad = !loaded && !loadError;

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
            setSearch("");
            setFilter("all");
            setPage(1);
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
          onChange={changeFilter}
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
        {firstLoad ? (
          <BrandLoaderBlock className="min-h-[40vh]" label="Loading orders" />
        ) : empty || (loadError && !visible.length) ? (
          <div className="rounded-lg border border-admin-line bg-admin-paper">
            {emptyState}
          </div>
        ) : (
          <ul
            className={cn("space-y-3 transition-opacity", loading && "opacity-60")}
            aria-label="Orders"
            aria-busy={loading || undefined}
          >
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
                        <p className="font-sans tabular-nums text-[0.9375rem] font-medium text-admin-ink">
                          {ref}
                        </p>
                        <p className="mt-0.5 text-[0.8125rem] text-admin-muted">
                          {formatOrderDate(o.createdAt)}
                        </p>
                      </div>
                      <p className="shrink-0 font-sans tabular-nums text-[0.9375rem] font-medium text-admin-ink">
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
                    <AdminRowActions className="shrink-0">
                      <AdminIconAction
                        icon="view"
                        label="View order"
                        ariaLabel={`View order ${ref}`}
                        href={detailHref}
                      />
                      <AdminIconAction
                        icon="download"
                        label="Download invoice"
                        ariaLabel={`Download invoice for ${ref}`}
                        href={invoiceHref(o.orderNumber)}
                        download
                      />
                    </AdminRowActions>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AdminTable
        className={cn("hidden transition-opacity md:block", loading && loaded && "opacity-60")}
      >
        <thead>
          <tr>
            <AdminTh>Order</AdminTh>
            <AdminTh>Date</AdminTh>
            <AdminTh>Customer</AdminTh>
            <AdminTh>Payment</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh numeric>Total</AdminTh>
            <AdminTh className="w-28 text-right">Actions</AdminTh>
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
                    className="font-sans tabular-nums text-[0.875rem] font-medium text-admin-ink hover:underline"
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
                    <p className="mt-0.5 font-sans tabular-nums text-[0.8125rem] text-admin-muted">
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
                <AdminTd className="py-2">
                  <AdminRowActions>
                    <AdminIconAction
                      icon="view"
                      label="View order"
                      ariaLabel={`View order ${ref}`}
                      href={detailHref}
                    />
                    <AdminIconAction
                      icon="download"
                      label="Download invoice"
                      ariaLabel={`Download invoice for ${ref}`}
                      href={invoiceHref(o.orderNumber)}
                      download
                    />
                  </AdminRowActions>
                </AdminTd>
              </tr>
            );
          })}
          {firstLoad ? (
            <tr>
              <td colSpan={7}><BrandLoaderBlock className="min-h-[40vh]" label="Loading orders" /></td>
            </tr>
          ) : empty || (loadError && !visible.length) ? (
            <tr>
              <td colSpan={7}>{emptyState}</td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>

      {loadError && visible.length ? (
        <p role="alert" className="mt-3 text-sm font-medium text-admin-danger">
          {loadError}{" "}
          <button
            type="button"
            onClick={load}
            className="cursor-pointer font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      ) : null}

      {loaded && visible.length > 0 ? (
        <AdminPagination
          page={result.page}
          pageCount={result.pageCount}
          pageSize={result.pageSize}
          total={result.total}
          noun={result.total === 1 ? "order" : "orders"}
          onPageChange={changePage}
          disabled={loading}
        />
      ) : null}

      <OrderStatusDialog
        order={statusChange?.order ?? null}
        nextStatus={statusChange?.next ?? null}
        saving={Boolean(statusChange && saving === statusChange.order.orderNumber)}
        onClose={() => setStatusChange(null)}
        onConfirm={(change) =>
          statusChange ? updateStatus(statusChange.order, change) : undefined
        }
      />
    </AdminShell>
  );
}

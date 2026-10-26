"use client";

import Link from "next/link";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminIcon,
  AdminPageHeader,
  AdminStatusBadge,
  formatPkr,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { formatOrderNumber } from "@/lib/order-number";
import { cn } from "@/lib/cn";

type Dash = {
  products: number;
  draftProducts: number;
  orders: number;
  collections: number;
  pendingReviews: number;
  customers: number;
  registeredAccounts: number;
  newContacts: number;
  revenuePkr: number | null;
  prevRevenuePkr: number | null;
  revenueChange: number | null;
  orderCountPeriod: number;
  prevOrderCount: number;
  ordersByStatus: Record<string, number>;
  revenueSeries: {
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }[];
  recentOrders: {
    orderNumber: string;
    customerName?: string;
    email: string;
    status: string;
    totalPkr?: number;
    paymentMethod?: string;
    createdAt?: string;
  }[];
  recentProducts: {
    handle: string;
    name: string;
    status: string;
    price?: number;
    image: string;
    inStock: boolean;
  }[];
  periodDays: number;
  canViewRevenue?: boolean;
};

const QUICK_ACTIONS = [
  {
    href: "/admin/settings#coupons",
    title: "Create a coupon",
    desc: "Percent off, amount off or free shipping.",
  },
  {
    href: "/admin/settings#announcement",
    title: "Edit the announcement bar",
    desc: "The message at the top of the store.",
  },
  {
    href: "/admin/journal",
    title: "Write a journal post",
    desc: "Share news, launches and scent guides.",
  },
  {
    href: "/admin/products/new",
    title: "Add product",
    desc: "Put a new fragrance on the store.",
  },
] as const;

/** "25 Oct" from a YYYY-MM-DD day key (the short date style used across the admin). */
function shortDay(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Round the axis top to 1 / 2 / 2.5 / 5 × 10ⁿ so gridlines land on clean values. */
function niceCeil(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * p;
}

function compactPkr(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

const TICKS = [1, 0.75, 0.5, 0.25, 0];

/**
 * HTML bar chart (not a scaled SVG) so it fills the card at any width and the
 * axis labels stay a true 12px. Hover a bar for the exact day total.
 */
function RevenueChart({ series }: { series: Dash["revenueSeries"] }) {
  const hasData = series.some((d) => d.revenue > 0);
  const top = niceCeil(Math.max(0, ...series.map((d) => d.revenue)));

  return (
    <div className="px-4 pb-5 pt-5 sm:px-6">
      {!hasData ? (
        <p className="mb-4 text-[0.9375rem] text-admin-muted">
          No sales in the last 14 days yet.
        </p>
      ) : null}
      <div className="flex gap-3" role="img" aria-label="Revenue per day, last 14 days">
        <div className="relative h-56 w-12 shrink-0 2xl:h-64" aria-hidden>
          {TICKS.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 font-sans tabular-nums text-xs text-admin-muted"
              style={{ top: `${(1 - t) * 100}%` }}
            >
              {t === 0 ? "0" : compactPkr(top * t)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-56 2xl:h-64">
            {TICKS.map((t) => (
              <div
                key={t}
                aria-hidden
                className={cn(
                  "absolute inset-x-0 border-t",
                  t === 0 ? "border-admin-faint/60" : "border-dashed border-admin-line",
                )}
                style={{ top: `${(1 - t) * 100}%` }}
              />
            ))}
            <ol className="absolute inset-0 flex items-end gap-1 sm:gap-2">
              {series.map((d) => {
                const pct = d.revenue > 0 ? Math.max(1.5, (d.revenue / top) * 100) : 0;
                return (
                  <li
                    key={d.date}
                    className="group relative flex h-full min-w-0 flex-1 items-end justify-center"
                  >
                    <div
                      className="relative w-full max-w-11 rounded-t-[3px] bg-admin-ink transition-colors group-hover:bg-brass"
                      style={{ height: `${pct}%` }}
                    >
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-admin-ink px-2.5 py-1.5 text-xs font-medium text-admin-paper group-hover:block">
                        {shortDay(d.date)}
                        <span className="ml-2 font-sans tabular-nums ">
                          {formatPkr(d.revenue)}
                        </span>
                        <span className="ml-2 opacity-70">
                          {d.orders} order{d.orders === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>
                    <span className="sr-only">
                      {shortDay(d.date)}: {formatPkr(d.revenue)}, {d.orders} order
                      {d.orders === 1 ? "" : "s"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          <ol className="mt-2 flex gap-1 sm:gap-2" aria-hidden>
            {series.map((d, i) => (
              <li
                key={d.date}
                className={cn(
                  "min-w-0 flex-1 whitespace-nowrap text-center font-sans tabular-nums text-xs text-admin-muted",
                  // Phones fit every third date, laptops every other one, wide screens
                  // all. Counted from the end so today always has its label.
                  (series.length - 1 - i) % 3 !== 0 ? "max-sm:invisible" : "",
                  (series.length - 1 - i) % 2 === 1 ? "sm:max-2xl:invisible" : "",
                )}
              >
                {shortDay(d.date)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function StatusBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  const total = entries.reduce((sum, [, n]) => sum + n, 0);
  if (!entries.length) {
    return (
      <p className="px-6 py-10 text-center text-[0.9375rem] text-admin-muted">
        No orders yet.
      </p>
    );
  }
  return (
    <ul className="space-y-5 px-5 py-5 sm:px-6">
      {entries.map(([status, count]) => (
        <li key={status}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <AdminStatusBadge status={status} />
            <span className="font-sans tabular-nums text-sm text-admin-ink">
              {count}
              <span className="ml-2 text-admin-muted">
                {Math.round((count / Math.max(1, total)) * 100)}%
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-admin-soft">
            <div
              className="h-full rounded-full bg-admin-ink transition-[width]"
              style={{ width: `${Math.round((count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Dashboard UI; the route is src/app/admin/page.tsx (which sets the tab title). */
export function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setData(j.data);
        else setError(j.error || "Could not load dashboard");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [router]);

  const showRevenue = Boolean(data?.canViewRevenue);

  const kpis = useMemo(() => {
    if (!data) return [];
    const items: { label: string; value: string; meta: string; href: string }[] =
      [];
    const change = data.revenueChange;
    if (showRevenue && data.revenuePkr != null) {
      items.push({
        label: "Sales, 14 days",
        value: formatPkr(data.revenuePkr),
        meta:
          !data.prevRevenuePkr || change == null
            ? "No sales in the 14 days before"
            : change === 0
              ? "Same as the 14 days before"
              : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% on the 14 days before`,
        href: "/admin/orders",
      });
    }
    items.push({
      label: "Orders, 14 days",
      value: String(data.orderCountPeriod),
      meta: `${data.orders} in total`,
      href: "/admin/orders",
    });
    if (showRevenue && data.revenuePkr != null) {
      items.push({
        label: "Average order",
        value: data.orderCountPeriod
          ? formatPkr(data.revenuePkr / data.orderCountPeriod)
          : formatPkr(0),
        meta: "Last 14 days",
        href: "/admin/orders",
      });
    }
    items.push(
      {
        label: "Customers",
        value: String(data.customers ?? 0),
        meta: `${data.registeredAccounts ?? 0} with an account`,
        href: "/admin/customers",
      },
      {
        label: "Live products",
        value: String(data.products),
        meta: data.draftProducts
          ? `${data.draftProducts} in draft`
          : "None in draft",
        href: "/admin/products",
      },
    );
    return items;
  }, [data, showRevenue]);

  const attention = useMemo(() => {
    if (!data) return [];
    const pending = data.ordersByStatus?.pending ?? 0;
    const confirmed = data.ordersByStatus?.confirmed ?? 0;
    return [
      {
        count: pending,
        label: pending === 1 ? "order to confirm" : "orders to confirm",
        href: "/admin/orders?status=pending",
      },
      {
        count: confirmed,
        label: confirmed === 1 ? "order to ship" : "orders to ship",
        href: "/admin/orders?status=confirmed",
      },
      {
        count: data.pendingReviews ?? 0,
        label: data.pendingReviews === 1 ? "review to approve" : "reviews to approve",
        href: "/admin/reviews",
      },
      {
        count: data.newContacts ?? 0,
        label: data.newContacts === 1 ? "new message" : "new messages",
        href: "/admin/contacts?status=new",
      },
    ].filter((a) => a.count > 0);
  }, [data]);

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title={user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
        action={<Button href="/admin/products/new">Add product</Button>}
      />

      {loading ? (
        <BrandLoaderBlock className="min-h-[40vh]" label="Loading dashboard" />
      ) : error ? (
        <p className="rounded-lg border border-admin-line bg-admin-paper px-4 py-3 text-base text-admin-ink">
          {error}
        </p>
      ) : data ? (
        <>
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
              kpis.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4",
            )}
          >
            {kpis.map((k) => (
              <Link
                key={k.label}
                href={k.href}
                className="group rounded-lg border border-admin-line bg-admin-paper px-5 py-5 transition-colors hover:border-admin-faint"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-admin-muted">
                  {k.label}
                </p>
                <p className="mt-2.5 break-words text-[1.75rem] font-semibold leading-tight tracking-[-0.015em] font-sans tabular-nums text-admin-ink 2xl:text-[2rem]">
                  {k.value}
                </p>
                <p className="mt-1.5 text-sm text-admin-muted">{k.meta}</p>
              </Link>
            ))}
          </div>

          <div
            className={cn(
              "mt-6 grid gap-4 lg:gap-6",
              showRevenue
                ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
                : "",
            )}
          >
            {showRevenue ? (
              <AdminCard
                title="Sales, last 14 days"
                action={
                  <span className="font-sans tabular-nums text-sm font-medium text-admin-ink">
                    {formatPkr(data.revenuePkr || 0)}
                  </span>
                }
              >
                <RevenueChart series={data.revenueSeries || []} />
              </AdminCard>
            ) : null}
            <div className="grid gap-4 lg:gap-6">
              <AdminCard title="Needs attention">
                {attention.length ? (
                  <ul className="divide-y divide-admin-line">
                    {attention.map((a) => (
                      <li key={a.href}>
                        <Link
                          href={a.href}
                          className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-admin-soft-2 sm:px-6"
                        >
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-(--admin-tone-amber-bg) px-2 font-sans tabular-nums text-sm font-medium text-(--admin-tone-amber-text)">
                            {a.count}
                          </span>
                          <span className="flex-1 text-[0.9375rem] font-medium text-admin-ink">
                            {a.label}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-admin-accent">
                            <AdminIcon name="view" size={16} />
                            Review
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 py-6 text-[0.9375rem] text-admin-muted sm:px-6">
                    All caught up. Nothing needs your attention.
                  </p>
                )}
              </AdminCard>
              <AdminCard title="Orders by status">
                <StatusBars data={data.ordersByStatus || {}} />
              </AdminCard>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:gap-6 xl:grid-cols-2">
            <AdminCard
              title="Recent orders"
              action={
                <Link
                  href="/admin/orders"
                  className="text-sm font-semibold text-admin-accent hover:underline"
                >
                  View all
                </Link>
              }
            >
              <ul className="divide-y divide-admin-line">
                {data.recentOrders.map((o) => (
                  <li key={o.orderNumber}>
                    <Link
                      href={`/admin/orders/${encodeURIComponent(o.orderNumber)}`}
                      className="group flex min-h-16 items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-admin-soft-2 sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="font-sans tabular-nums text-[0.9375rem] font-medium text-admin-ink">
                          {formatOrderNumber(o.orderNumber)}
                        </p>
                        <p className="mt-0.5 truncate text-[0.8125rem] text-admin-muted">
                          {o.customerName || o.email}
                          {o.createdAt
                            ? ` · ${new Date(o.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        {showRevenue && typeof o.totalPkr === "number" ? (
                          <span className="hidden font-sans tabular-nums text-sm font-medium text-admin-ink sm:inline">
                            {formatPkr(o.totalPkr)}
                          </span>
                        ) : null}
                        <AdminStatusBadge status={o.status} />
                        <span
                          className="hidden h-9 w-9 items-center justify-center rounded-md text-admin-faint transition-colors group-hover:text-admin-ink sm:inline-flex"
                          aria-hidden
                        >
                          <AdminIcon name="view" size={17} />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
                {data.recentOrders.length === 0 ? (
                  <li className="px-6 py-10 text-center text-[0.9375rem] text-admin-muted">
                    No orders yet.
                  </li>
                ) : null}
              </ul>
            </AdminCard>

            <AdminCard
              title="Latest products"
              action={
                <Link
                  href="/admin/products"
                  className="text-sm font-semibold text-admin-accent hover:underline"
                >
                  View all
                </Link>
              }
            >
              <ul className="divide-y divide-admin-line">
                {data.recentProducts.map((p) => (
                  <li key={p.handle}>
                    <Link
                      href={`/admin/products/${p.handle}`}
                      className="group flex min-h-16 items-center gap-3.5 px-5 py-3 transition-colors hover:bg-admin-soft-2 sm:px-6"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.9375rem] font-semibold text-admin-ink">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-[0.8125rem] text-admin-muted">
                          {p.inStock ? "In stock" : "Out of stock"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        {showRevenue && typeof p.price === "number" ? (
                          <span className="hidden font-sans tabular-nums text-sm font-medium text-admin-ink sm:inline">
                            {formatPkr(p.price)}
                          </span>
                        ) : null}
                        <AdminStatusBadge status={p.status} />
                        <span
                          className="hidden h-9 w-9 items-center justify-center rounded-md text-admin-faint transition-colors group-hover:text-admin-ink sm:inline-flex"
                          aria-hidden
                        >
                          <AdminIcon name="edit" size={17} />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
                {data.recentProducts.length === 0 ? (
                  <li className="px-6 py-10 text-center text-[0.9375rem] text-admin-muted">
                    No products yet.
                  </li>
                ) : null}
              </ul>
            </AdminCard>
          </div>

          {/* Shortcuts below the numbers so the dashboard opens on data */}
          <section className="mt-8" aria-labelledby="quick-actions-title">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="quick-actions-title"
                  className="text-base font-semibold text-admin-ink sm:text-[1.0625rem]"
                >
                  Shortcuts
                </h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {QUICK_ACTIONS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col rounded-lg border border-admin-line bg-admin-paper px-5 py-4 transition-colors hover:border-admin-faint"
                >
                  <p className="text-[0.9375rem] font-semibold text-admin-ink group-hover:text-admin-accent">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-admin-muted">{item.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}

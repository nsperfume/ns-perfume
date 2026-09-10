"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminPageHeader,
  AdminStatusBadge,
  formatPkr,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { EmblaCarousel } from "@/components/ui/embla-carousel";
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

function RevenueChart({ series }: { series: Dash["revenueSeries"] }) {
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const hasData = series.some((d) => d.revenue > 0);
  const W = 640;
  const H = 200;
  const pad = { t: 16, r: 8, b: 32, l: 8 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;
  const slot = chartW / Math.max(1, series.length);
  const gap = Math.min(6, slot * 0.28);
  const barW = Math.max(6, slot - gap);

  return (
    <div className="px-3 py-4 sm:px-5">
      {!hasData ? (
        <p className="py-10 text-center text-base text-admin-muted">
          No revenue in this window yet. New paid orders will fill the chart.
        </p>
      ) : null}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full sm:h-48"
        role="img"
        aria-label="Revenue last 14 days"
      >
        <line
          x1={pad.l}
          x2={W - pad.r}
          y1={pad.t + chartH}
          y2={pad.t + chartH}
          stroke="var(--admin-line)"
          strokeWidth="1"
        />
        {series.map((d, i) => {
          const h =
            d.revenue > 0 ? Math.max(6, (d.revenue / max) * chartH) : 3;
          const x = pad.l + i * slot + (slot - barW) / 2;
          const y = pad.t + chartH - h;
          return (
            <g key={d.date}>
              <title>
                {d.date}: {formatPkr(d.revenue)} · {d.orders} order
                {d.orders === 1 ? "" : "s"}
              </title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={2}
                fill={d.revenue > 0 ? "var(--admin-ink)" : "var(--admin-line)"}
              />
              {(i % 2 === 0 || series.length <= 8) && (
                <text
                  x={x + barW / 2}
                  y={H - 10}
                  textAnchor="middle"
                  fill="var(--admin-muted)"
                  fontSize="11"
                  fontFamily="system-ui, sans-serif"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatusBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  if (!entries.length) {
    return (
      <p className="px-5 py-10 text-center text-base text-admin-muted">
        No orders yet.
      </p>
    );
  }
  return (
    <ul className="space-y-4 px-5 py-5">
      {entries.map(([status, count]) => (
        <li key={status}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium capitalize text-admin-ink">
              {status}
            </span>
            <span className="tabular-nums text-admin-muted">
              {count}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm bg-admin-soft">
            <div
              className="h-full rounded-sm bg-admin-ink transition-[width]"
              style={{ width: `${Math.round((count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminHomePage() {
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
    const items: { label: string; value: string; meta: string }[] = [];
    if (showRevenue && data.revenuePkr != null) {
      items.push({
        label: "Revenue (14d)",
        value: formatPkr(data.revenuePkr),
        meta:
          data.revenueChange === 0
            ? "vs prior 14d"
            : `${(data.revenueChange ?? 0) > 0 ? "+" : ""}${data.revenueChange}% vs prior`,
      });
    }
    items.push(
      {
        label: "Orders (14d)",
        value: String(data.orderCountPeriod),
        meta: `${data.orders} all-time`,
      },
      {
        label: "Customers",
        value: String(data.customers ?? 0),
        meta: `${data.registeredAccounts ?? 0} registered · ${(data.newContacts ?? 0) > 0 ? `${data.newContacts} new messages` : "guests + contacts"}`,
      },
      {
        label: "Products live",
        value: String(data.products),
        meta: data.draftProducts
          ? `${data.draftProducts} draft`
          : "Published",
      },
      {
        label: "Pending reviews",
        value: String(data.pendingReviews),
        meta: `${data.collections} collections`,
      },
    );
    return items;
  }, [data, showRevenue]);

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Dashboard"
        description={
          showRevenue
            ? "Revenue, fulfillment health, and catalog at a glance."
            : "Orders, catalog health, and reviews at a glance."
        }
        action={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              href="/admin/orders"
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              Orders
            </Button>
            <Button
              href="/admin/customers"
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              Customers
            </Button>
            <Button href="/admin/products/new" className="flex-1 sm:flex-none">
              Add product
            </Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-base text-admin-muted">Loading dashboard…</p>
      ) : error ? (
        <p className="rounded-lg border border-admin-line bg-admin-paper px-4 py-3 text-base text-admin-ink">
          {error}
        </p>
      ) : data ? (
        <>
          {/* Quick actions — horizontal carousel to save vertical space */}
          <section className="mb-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-base font-medium text-admin-ink">
                  Quick actions
                </h2>
                <p className="mt-0.5 text-sm text-admin-muted">
                  Jump into everyday admin work. Swipe or use the arrows.
                </p>
              </div>
            </div>
            <EmblaCarousel
              gap="sm"
              align="start"
              loop={false}
              showDots
              showArrows
              className="[&>div:last-child]:mt-3"
              slideClassName="min-w-0 flex-[0_0_82%] sm:flex-[0_0_48%] md:flex-[0_0_38%] lg:flex-[0_0_30%]"
            >
              {(
                [
                  {
                    href: "/admin/settings#coupons",
                    title: "Add coupon",
                    desc: "Create discount codes for checkout: percent off, fixed PKR off, or free standard shipping. Enable or pause anytime.",
                  },
                  {
                    href: "/admin/settings#appearance",
                    title: "Change appearance",
                    desc: "Switch the admin console between light and dark. This only affects the back office, not the public site.",
                  },
                  {
                    href: "/admin/settings#announcement",
                    title: "Edit announcement bar",
                    desc: "Update or hide the storefront top message for shipping notes, promos, or seasonal lines.",
                  },
                  {
                    href: "/admin/products/new",
                    title: "Add a product",
                    desc: "Create a new bottle: name, photos, scent notes, sizes, and PKR prices. Draft it first if you are not ready to publish.",
                  },
                  {
                    href: "/admin/collections",
                    title: "Manage collections",
                    desc: "Build shop groups customers browse by occasion or audience. Set the banner image and publish when the list is ready.",
                  },
                  {
                    href: "/admin/orders",
                    title: "Review orders",
                    desc: "Open recent orders, update fulfillment status, and check customer and line details.",
                  },
                  {
                    href: "/admin/reviews",
                    title: "Moderate reviews",
                    desc: "Publish helpful product reviews on the PDP or hide ones that should not show.",
                  },
                  {
                    href: "/admin/settings#profile",
                    title: "Account and profile",
                    desc: "See who is signed in, your role, and sign out securely from the console.",
                  },
                ] as const
              ).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex h-full min-h-[9.5rem] flex-col rounded-lg border border-admin-line bg-admin-paper px-4 py-3.5 shadow-admin transition-colors hover:border-admin-ink"
                >
                  <p className="font-display text-[15px] font-medium text-admin-ink group-hover:text-brass">
                    {item.title}
                  </p>
                  <p className="mt-1.5 flex-1 text-sm leading-snug text-admin-muted">
                    {item.desc}
                  </p>
                  <p className="mt-3 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-admin-faint group-hover:text-brass">
                    Go →
                  </p>
                </Link>
              ))}
            </EmblaCarousel>
          </section>

          <div
            className={cn(
              "grid gap-3 sm:grid-cols-2",
              showRevenue ? "xl:grid-cols-4" : "xl:grid-cols-3",
            )}
          >
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-lg border border-admin-line bg-admin-paper px-5 py-5 shadow-admin"
              >
                <p className="font-display text-xs font-medium uppercase tracking-[0.12em] text-admin-muted sm:text-[13px]">
                  {k.label}
                </p>
                <p className="mt-2 font-display text-2xl font-medium tabular-nums tracking-tight text-admin-ink sm:text-3xl">
                  {k.value}
                </p>
                <p className="mt-1.5 text-sm text-admin-muted">
                  {k.meta}
                </p>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "mt-6 grid gap-4",
              showRevenue
                ? "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]"
                : "",
            )}
          >
            {showRevenue ? (
              <AdminCard
                title="Revenue · last 14 days"
                action={
                  <span className="text-sm font-medium tabular-nums text-admin-muted">
                    {formatPkr(data.revenuePkr || 0)}
                  </span>
                }
              >
                <RevenueChart series={data.revenueSeries || []} />
              </AdminCard>
            ) : null}
            <AdminCard title="Orders by status">
              <StatusBars data={data.ordersByStatus || {}} />
            </AdminCard>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <AdminCard
              title="Recent orders"
              action={
                <Link
                  href="/admin/orders"
                  className="font-display text-xs font-medium uppercase tracking-widest text-brass hover:underline"
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
                      className="flex items-start justify-between gap-3 px-4 py-4 transition-colors hover:bg-admin-soft sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-base font-medium text-admin-ink">
                          {formatOrderNumber(o.orderNumber)}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-admin-muted">
                          {o.customerName || o.email || "—"}
                          {o.createdAt
                            ? ` · ${new Date(o.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <AdminStatusBadge status={o.status} />
                        {showRevenue && typeof o.totalPkr === "number" ? (
                          <span className="text-sm font-medium tabular-nums text-admin-ink">
                            {formatPkr(o.totalPkr)}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
                {data.recentOrders.length === 0 ? (
                  <li className="px-5 py-10 text-center text-base text-admin-muted">
                    No orders yet.
                  </li>
                ) : null}
              </ul>
            </AdminCard>

            <AdminCard
              title="Products"
              action={
                <Link
                  href="/admin/products"
                  className="font-display text-xs font-medium uppercase tracking-widest text-brass hover:underline"
                >
                  Manage
                </Link>
              }
            >
              <ul className="divide-y divide-admin-line">
                {data.recentProducts.map((p) => (
                  <li key={p.handle}>
                    <Link
                      href={`/admin/products/${p.handle}`}
                      className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-admin-soft sm:px-5"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft">
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
                        <p className="truncate font-display text-base font-medium text-admin-ink">
                          {p.name}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-admin-muted">
                          {p.handle}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <AdminStatusBadge status={p.status} />
                        {showRevenue && typeof p.price === "number" ? (
                          <span className="text-sm font-medium tabular-nums text-admin-ink">
                            {formatPkr(p.price)}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
                {data.recentProducts.length === 0 ? (
                  <li className="px-5 py-10 text-center text-base text-admin-muted">
                    No products yet.
                  </li>
                ) : null}
              </ul>
            </AdminCard>
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}

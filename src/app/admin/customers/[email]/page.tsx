"use client";

import { useEffect, useState } from "react";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminContactActions,
  AdminEmptyState,
  AdminIcon,
  AdminIconAction,
  AdminRowActions,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr,
  useRowLink,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { formatOrderNumber } from "@/lib/order-number";

type Detail = {
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  lifetimeSpendPkr: number;
  lastOrderAt: string | null;
  firstOrderAt: string | null;
  account: "registered" | "guest";
  messageCount: number;
  cities: string[];
  orders: {
    orderNumber: string;
    status: string;
    totalPkr: number;
    paymentMethod?: string;
    createdAt?: string;
    lines: {
      productHandle?: string;
      name?: string;
      sizeMl?: number;
      quantity?: number;
      unitPricePkr?: number;
    }[];
  }[];
  products: {
    productHandle: string;
    name: string;
    orderCount: number;
    totalQuantity: number;
  }[];
  messages: {
    id: string;
    topic: string;
    status: string;
    message: string;
    name: string;
    createdAt?: string;
  }[];
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PAYMENT: Record<string, string> = {
  cod: "Cash on delivery",
  bank: "Bank transfer",
  card: "Card",
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-admin-muted">{label}</dt>
      <dd className="text-right font-medium text-admin-ink">{children}</dd>
    </div>
  );
}

export default function AdminCustomerDetailPage() {
  const router = useRouter();
  const rowLink = useRowLink();
  const params = useParams<{ email: string }>();
  const emailParam = decodeURIComponent(params.email || "");
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
  }, [router]);

  useEffect(() => {
    if (!emailParam) return;
    setLoading(true);
    fetch(`/api/admin/customers/${encodeURIComponent(emailParam)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setData(j.data);
        else setError(j.error || "Customer not found");
      })
      .catch(() => setError("Could not load this customer. Check your connection."))
      .finally(() => setLoading(false));
  }, [emailParam]);

  const avgOrder =
    data && data.orderCount ? data.lifetimeSpendPkr / data.orderCount : 0;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title={data?.name || emailParam || "Customer"}
        description={
          data
            ? `Customer since ${formatDate(data.firstOrderAt) || "their first visit"}`
            : undefined
        }
        backHref="/admin/customers"
        backLabel="Customers"
      />

      {loading ? (
        <BrandLoaderBlock className="min-h-[40vh]" label="Loading customer" />
      ) : error ? (
        <AdminCard>
          <AdminEmptyState
            title="Customer not available"
            description={error}
            action={
              <Button href="/admin/customers" variant="secondary">
                Back to customers
              </Button>
            }
          />
        </AdminCard>
      ) : data ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <div className="order-2 min-w-0 space-y-6 xl:order-1">
            <AdminCard
              title="Orders"
              action={
                <span className="text-sm text-admin-muted">
                  {data.orderCount} {data.orderCount === 1 ? "order" : "orders"}
                </span>
              }
            >
              {data.orders.length ? (
                <AdminTable flush>
                  <thead>
                    <tr>
                      <AdminTh>Order</AdminTh>
                      <AdminTh>Date</AdminTh>
                      <AdminTh>Status</AdminTh>
                      <AdminTh>Payment</AdminTh>
                      <AdminTh numeric>Total</AdminTh>
                      <AdminTh className="w-16 text-right">
                        <span className="sr-only">Actions</span>
                      </AdminTh>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((o) => {
                      const href = `/admin/orders/${encodeURIComponent(o.orderNumber)}`;
                      const row = rowLink(href);
                      return (
                        <tr key={o.orderNumber} onClick={row.onClick} className={row.className}>
                          <AdminTd className="whitespace-nowrap">
                            <Link
                              href={href}
                              className="font-sans tabular-nums text-[0.875rem] font-medium text-admin-ink hover:underline"
                            >
                              {formatOrderNumber(o.orderNumber)}
                            </Link>
                          </AdminTd>
                          <AdminTd className="whitespace-nowrap text-admin-muted">
                            {formatDate(o.createdAt)}
                          </AdminTd>
                          <AdminTd>
                            <AdminStatusBadge status={o.status} />
                          </AdminTd>
                          <AdminTd className="whitespace-nowrap text-admin-muted">
                            {PAYMENT[o.paymentMethod || ""] || ""}
                          </AdminTd>
                          <AdminTd numeric className="font-medium">
                            {formatPkr(o.totalPkr)}
                          </AdminTd>
                          <AdminTd className="py-2">
                            <AdminRowActions>
                              <AdminIconAction
                                icon="view"
                                label="View order"
                                ariaLabel={`View order ${formatOrderNumber(o.orderNumber)}`}
                                href={href}
                              />
                            </AdminRowActions>
                          </AdminTd>
                        </tr>
                      );
                    })}
                  </tbody>
                </AdminTable>
              ) : (
                <AdminEmptyState title="No orders yet" />
              )}
            </AdminCard>

            <AdminCard title="Products bought">
              {data.products.length ? (
                <ul className="divide-y divide-admin-line">
                  {data.products.map((p) => (
                    <li key={p.productHandle}>
                      <Link
                        href={`/admin/products/${encodeURIComponent(p.productHandle)}`}
                        className="flex min-h-14 items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-admin-soft-2 sm:px-6"
                      >
                        <span className="min-w-0 truncate text-[0.9375rem] font-semibold text-admin-ink">
                          {p.name}
                        </span>
                        <span className="flex shrink-0 items-center gap-3 text-sm text-admin-muted">
                          <span>
                            <span className="font-sans tabular-nums text-admin-ink">
                              {p.totalQuantity}
                            </span>{" "}
                            bought in{" "}
                            <span className="font-sans tabular-nums text-admin-ink">
                              {p.orderCount}
                            </span>{" "}
                            {p.orderCount === 1 ? "order" : "orders"}
                          </span>
                          <AdminIcon name="edit" size={17} className="text-admin-faint" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <AdminEmptyState title="Nothing bought yet" />
              )}
            </AdminCard>

            <AdminCard
              title="Messages"
              action={
                data.messages.length ? (
                  <Link
                    href={`/admin/contacts?email=${encodeURIComponent(data.email)}`}
                    className="text-sm font-semibold text-admin-accent hover:underline"
                  >
                    Open in inbox
                  </Link>
                ) : undefined
              }
            >
              {data.messages.length === 0 ? (
                <AdminEmptyState title="No messages from this customer" />
              ) : (
                <ul className="divide-y divide-admin-line">
                  {data.messages.map((m) => (
                    <li key={m.id} className="px-5 py-4 sm:px-6">
                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <AdminStatusBadge status={m.status} />
                        <span className="text-sm font-semibold text-admin-ink">
                          {m.topic}
                        </span>
                        <span className="text-[0.8125rem] text-admin-muted">
                          {formatDate(m.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-admin-ink">
                        {m.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <aside className="order-1 space-y-6 xl:order-2 xl:sticky xl:top-4">
            <AdminCard
              title="Contact"
              action={
                <AdminStatusBadge
                  status={data.account === "registered" ? "registered" : "guest"}
                  label={data.account === "registered" ? "Has account" : "Guest"}
                />
              }
            >
              <div className="space-y-1.5 px-5 py-5 text-[0.9375rem] sm:px-6">
                <p className="break-all font-medium text-admin-ink">{data.email}</p>
                {data.phone ? (
                  <p className="font-sans tabular-nums text-[0.875rem] text-admin-ink">
                    {data.phone}
                  </p>
                ) : null}
                {data.cities.length ? (
                  <p className="pt-1 text-admin-muted">{data.cities.join(", ")}</p>
                ) : null}
                <AdminContactActions
                  className="pt-3"
                  phone={data.phone}
                  email={data.email}
                  whatsappText={`Hello ${data.name?.split(" ")[0] || ""}, this is NS Perfume.`.replace("Hello ,", "Hello,")}
                />
              </div>
            </AdminCard>

            <AdminCard title="Summary">
              <dl className="divide-y divide-admin-line px-5 py-2 text-[0.9375rem] sm:px-6">
                <Fact label="Total spent">
                  <span className="font-sans tabular-nums ">
                    {formatPkr(data.lifetimeSpendPkr)}
                  </span>
                </Fact>
                <Fact label="Orders">
                  <span className="font-sans tabular-nums ">{data.orderCount}</span>
                </Fact>
                {data.orderCount ? (
                  <Fact label="Average order">
                    <span className="font-sans tabular-nums ">{formatPkr(avgOrder)}</span>
                  </Fact>
                ) : null}
                {data.lastOrderAt ? (
                  <Fact label="Last order">{formatDate(data.lastOrderAt)}</Fact>
                ) : null}
              </dl>
            </AdminCard>
          </aside>
        </div>
      ) : null}
    </AdminShell>
  );
}

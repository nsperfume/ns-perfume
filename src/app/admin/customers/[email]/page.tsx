"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatOrderNumber } from "@/lib/order-number";
import { formatSize } from "@/lib/format";

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
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCustomerDetailPage() {
  const router = useRouter();
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
        else setError(j.error || "Not found");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [emailParam]);

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title={data?.name || emailParam || "Customer"}
        description={data?.email || emailParam}
        backHref="/admin/customers"
        backLabel="Customers"
        action={
          data ? (
            <Button
              href={`/admin/contacts?email=${encodeURIComponent(data.email)}`}
              variant="secondary"
              className="w-auto!"
            >
              View messages
            </Button>
          ) : null
        }
      />

      {loading ? (
        <p className="text-base text-admin-muted">Loading profile…</p>
      ) : error ? (
        <p className="rounded-lg border border-admin-line bg-admin-paper px-4 py-3 text-base">
          {error}
        </p>
      ) : data ? (
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCard className="p-4">
              <p className="text-[12px] font-medium uppercase tracking-wide text-admin-muted">
                Orders
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {data.orderCount}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-[12px] font-medium uppercase tracking-wide text-admin-muted">
                Lifetime spend
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatPkr(data.lifetimeSpendPkr)}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-[12px] font-medium uppercase tracking-wide text-admin-muted">
                Account
              </p>
              <p className="mt-1 text-lg font-semibold capitalize">
                {data.account}
              </p>
              {data.phone ? (
                <p className="mt-1 text-sm tabular-nums text-admin-muted">
                  {data.phone}
                </p>
              ) : null}
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-[12px] font-medium uppercase tracking-wide text-admin-muted">
                Activity
              </p>
              <p className="mt-1 text-sm text-admin-ink">
                First {formatDate(data.firstOrderAt)}
              </p>
              <p className="text-sm text-admin-muted">
                Last {formatDate(data.lastOrderAt)}
              </p>
              {data.cities.length ? (
                <p className="mt-2 text-[12px] text-admin-faint">
                  {data.cities.join(" · ")}
                </p>
              ) : null}
            </AdminCard>
          </div>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-admin-ink">
              Orders
            </h2>
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Order</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Payment</AdminTh>
                  <AdminTh className="text-right">Total</AdminTh>
                  <AdminTh className="text-right">Track</AdminTh>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.orderNumber} className="hover:bg-admin-soft">
                    <AdminTd>
                      <p className="font-semibold">
                        {formatOrderNumber(o.orderNumber)}
                      </p>
                      <p className="text-[11px] text-admin-faint">
                        {formatDate(o.createdAt)}
                      </p>
                    </AdminTd>
                    <AdminTd>
                      <AdminStatusBadge status={o.status} />
                    </AdminTd>
                    <AdminTd className="text-xs font-semibold uppercase tracking-wide text-admin-muted">
                      {o.paymentMethod || "—"}
                    </AdminTd>
                    <AdminTd className="text-right font-medium tabular-nums">
                      {formatPkr(o.totalPkr)}
                    </AdminTd>
                    <AdminTd className="text-right">
                      <Button
                        href={`/track-order?orderNumber=${encodeURIComponent(o.orderNumber)}&email=${encodeURIComponent(data.email)}`}
                        variant="ghost"
                        className="min-h-10!"
                      >
                        Track
                      </Button>
                    </AdminTd>
                  </tr>
                ))}
                {data.orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-admin-muted"
                    >
                      No orders yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-admin-ink">
              Products bought
            </h2>
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Product</AdminTh>
                  <AdminTh className="text-right">In orders</AdminTh>
                  <AdminTh className="text-right">Total qty</AdminTh>
                  <AdminTh className="text-right">Open</AdminTh>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.productHandle} className="hover:bg-admin-soft">
                    <AdminTd>
                      <p className="font-medium">{p.name}</p>
                      <p className="font-mono text-[11px] text-admin-faint">
                        {p.productHandle}
                      </p>
                    </AdminTd>
                    <AdminTd className="text-right tabular-nums">
                      {p.orderCount}
                    </AdminTd>
                    <AdminTd className="text-right tabular-nums font-medium">
                      {p.totalQuantity}
                    </AdminTd>
                    <AdminTd className="text-right">
                      <Button
                        href={`/admin/products/${encodeURIComponent(p.productHandle)}`}
                        variant="secondary"
                        className="h-10! min-h-10! w-auto! px-4!"
                      >
                        Edit
                      </Button>
                    </AdminTd>
                  </tr>
                ))}
                {data.products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-admin-muted"
                    >
                      No product purchases yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </AdminTable>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-admin-ink">
              Contact messages
            </h2>
            {data.messages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-admin-line px-4 py-8 text-center text-admin-muted">
                No contact form messages from this email.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.messages.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-admin-line bg-admin-paper p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <AdminStatusBadge status={m.status} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-admin-muted">
                        {m.topic}
                      </span>
                      <span className="text-[12px] text-admin-faint">
                        {formatDate(m.createdAt)}
                      </span>
                      <Link
                        href="/admin/contacts"
                        className="ml-auto text-[12px] font-medium text-brass hover:underline"
                      >
                        Open inbox
                      </Link>
                    </div>
                    <p className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-admin-ink">
                      {m.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Show line detail for latest order sizes when useful */}
          {data.orders[0]?.lines?.length ? (
            <p className="text-[12px] text-admin-faint">
              Latest order lines:{" "}
              {data.orders[0].lines
                .map(
                  (l) =>
                    `${l.name || l.productHandle}${l.sizeMl ? ` ${formatSize(l.sizeMl)}` : ""} ×${l.quantity || 1}`,
                )
                .join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}

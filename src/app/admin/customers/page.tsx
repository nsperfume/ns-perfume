"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminIconAction,
  AdminPageHeader,
  AdminRowActions,
  AdminSearchInput,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr,
  useRowLink,
  whatsappHref,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Select } from "@/components/admin/select";
import Link from "next/link";

type Row = {
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  lifetimeSpendPkr: number;
  lastOrderAt: string | null;
  account: "registered" | "guest";
  messageCount: number;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** View first, then the ways to reach the customer. */
function CustomerActions({ row }: { row: Row }) {
  const who = row.name || row.email;
  const wa = whatsappHref(row.phone);
  return (
    <AdminRowActions>
      <AdminIconAction
        icon="view"
        label="View customer"
        ariaLabel={`View ${who}`}
        href={`/admin/customers/${encodeURIComponent(row.email)}`}
      />
      {wa ? (
        <AdminIconAction
          icon="whatsapp"
          label="WhatsApp"
          ariaLabel={`WhatsApp ${who}`}
          href={wa}
          external
        />
      ) : null}
      <AdminIconAction
        icon="email"
        label="Email"
        ariaLabel={`Email ${who}`}
        href={`mailto:${row.email}`}
      />
    </AdminRowActions>
  );
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("lastOrder");
  const [account, setAccount] = useState("all");
  const rowLink = useRowLink();
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (sort) params.set("sort", sort);
    fetch(`/api/admin/customers?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setRows(j.data);
      })
      .finally(() => setLoading(false));
  }, [q, sort]);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
  }, [router]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const counts = {
    all: rows.length,
    registered: rows.filter((r) => r.account === "registered").length,
    guest: rows.filter((r) => r.account === "guest").length,
  };
  const visible =
    account === "all" ? rows : rows.filter((r) => r.account === account);

  const empty = !loading && visible.length === 0;
  const emptyState = q.trim() || account !== "all" ? (
    <AdminEmptyState
      title="No customers match"
      action={
        <Button
          variant="secondary"
          onClick={() => {
            setQ("");
            setAccount("all");
          }}
        >
          Clear filters
        </Button>
      }
    />
  ) : (
    <AdminEmptyState
      title="No customers yet"
      description="People appear here after they order, sign up or send a message."
    />
  );

  return (
    <AdminShell user={user}>
      <AdminPageHeader title="Customers" />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <AdminFilterChips
          label="Account type"
          value={account}
          onChange={setAccount}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "registered", label: "With account", count: counts.registered },
            { value: "guest", label: "Guests", count: counts.guest },
          ]}
        />
        <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:justify-end">
          <AdminSearchInput
            value={q}
            onChange={setQ}
            placeholder="Search name, email or phone"
            label="Search customers"
            className="w-full lg:max-w-sm"
          />
          <Select
            aria-label="Sort customers"
            value={sort}
            onValueChange={setSort}
            options={[
              { value: "lastOrder", label: "Latest order first" },
              { value: "spend", label: "Highest spend first" },
              { value: "orders", label: "Most orders first" },
            ]}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      {/* Phones: cards */}
      <div className="md:hidden">
        {loading ? (
          <BrandLoaderBlock className="min-h-[40vh]" label="Loading customers" />
        ) : empty ? (
          <div className="rounded-lg border border-admin-line bg-admin-paper">{emptyState}</div>
        ) : (
          <ul className="space-y-3">
            {visible.map((r) => (
              <li
                key={r.email}
                className="rounded-lg border border-admin-line bg-admin-paper p-4 shadow-admin"
              >
                <Link
                  href={`/admin/customers/${encodeURIComponent(r.email)}`}
                  className="block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-admin-ink">
                        {r.name || r.email}
                      </p>
                      <p className="truncate text-[0.8125rem] text-admin-muted">
                        {r.email}
                      </p>
                    </div>
                    <p className="shrink-0 font-sans tabular-nums text-[0.9375rem] font-medium text-admin-ink">
                      {formatPkr(r.lifetimeSpendPkr)}
                    </p>
                  </div>
                  <p className="mt-2 text-[0.8125rem] text-admin-muted">
                    {r.orderCount} {r.orderCount === 1 ? "order" : "orders"}
                    {r.lastOrderAt ? ` · last ${formatDate(r.lastOrderAt)}` : ""}
                  </p>
                </Link>
                <div className="mt-3 border-t border-admin-line pt-2">
                  <CustomerActions row={r} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminTable className="hidden md:block">
        <thead>
          <tr>
            <AdminTh>Customer</AdminTh>
            <AdminTh>Account</AdminTh>
            <AdminTh numeric>Orders</AdminTh>
            <AdminTh numeric>Total spent</AdminTh>
            <AdminTh>Last order</AdminTh>
            <AdminTh numeric>Messages</AdminTh>
            <AdminTh className="w-36 text-right">Actions</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7}><BrandLoaderBlock className="min-h-[40vh]" label="Loading customers" /></td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={7}>{emptyState}</td>
            </tr>
          ) : (
            visible.map((r) => {
              const href = `/admin/customers/${encodeURIComponent(r.email)}`;
              const row = rowLink(href);
              return (
                <tr key={r.email} onClick={row.onClick} className={row.className}>
                  <AdminTd className="max-w-[20rem]">
                    <Link
                      href={href}
                      className="block truncate font-semibold text-admin-ink hover:underline"
                    >
                      {r.name || r.email}
                    </Link>
                    <p className="truncate text-[0.8125rem] text-admin-muted" title={r.email}>
                      {r.name ? r.email : r.phone}
                    </p>
                  </AdminTd>
                  <AdminTd>
                    <AdminStatusBadge
                      status={r.account}
                      label={r.account === "registered" ? "Has account" : "Guest"}
                    />
                  </AdminTd>
                  <AdminTd numeric>{r.orderCount}</AdminTd>
                  <AdminTd numeric className="font-medium">
                    {formatPkr(r.lifetimeSpendPkr)}
                  </AdminTd>
                  <AdminTd className="whitespace-nowrap text-admin-muted">
                    {formatDate(r.lastOrderAt) || "No orders"}
                  </AdminTd>
                  <AdminTd numeric>{r.messageCount}</AdminTd>
                  <AdminTd className="py-2">
                    <CustomerActions row={r} />
                  </AdminTd>
                </tr>
              );
            })
          )}
        </tbody>
      </AdminTable>
    </AdminShell>
  );
}

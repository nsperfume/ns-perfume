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
import { adminFieldClass } from "@/components/admin/form-section";
import { cn } from "@/lib/cn";

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
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("lastOrder");
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

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Customers"
        description="People who ordered, registered, or contacted you. Identity is email."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1.5 block text-[13px] font-semibold text-admin-ink">
            Search
          </label>
          <input
            className={adminFieldClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, or phone"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            label="Sort"
            value={sort}
            onValueChange={setSort}
            options={[
              { value: "lastOrder", label: "Last order" },
              { value: "spend", label: "Lifetime spend" },
              { value: "orders", label: "Order count" },
            ]}
            triggerClassName="border-admin-input-border! bg-admin-soft-2! text-admin-ink!"
          />
        </div>
      </div>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Customer</AdminTh>
            <AdminTh>Account</AdminTh>
            <AdminTh className="text-right">Orders</AdminTh>
            <AdminTh className="text-right">Spend</AdminTh>
            <AdminTh>Last order</AdminTh>
            <AdminTh className="text-right">Messages</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-14 text-center text-admin-muted"
              >
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-14 text-center text-admin-muted"
              >
                No customers yet. Orders, accounts, and contact messages will
                appear here.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.email} className="hover:bg-admin-soft">
                <AdminTd>
                  <p className="font-medium">{r.name || "—"}</p>
                  <p className="text-[11px] text-admin-muted">
                    {r.email}
                  </p>
                  {r.phone ? (
                    <p className="text-[11px] tabular-nums text-admin-faint">
                      {r.phone}
                    </p>
                  ) : null}
                </AdminTd>
                <AdminTd>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-sm border px-2.5 py-1 font-display text-[11px] font-medium uppercase tracking-widest",
                      r.account === "registered"
                        ? "border-admin-ink bg-admin-ink text-admin-paper"
                        : "border-admin-line bg-admin-soft text-admin-muted",
                    )}
                  >
                    {r.account}
                  </span>
                </AdminTd>
                <AdminTd className="text-right font-medium tabular-nums">
                  {r.orderCount}
                </AdminTd>
                <AdminTd className="text-right font-medium tabular-nums">
                  {formatPkr(r.lifetimeSpendPkr)}
                </AdminTd>
                <AdminTd className="text-[13px] text-admin-muted">
                  {formatDate(r.lastOrderAt)}
                </AdminTd>
                <AdminTd className="text-right tabular-nums">
                  {r.messageCount}
                </AdminTd>
                <AdminTd className="text-right">
                  <Button
                    href={`/admin/customers/${encodeURIComponent(r.email)}`}
                    variant="secondary"
                    className="h-10! min-h-10! w-auto! px-4!"
                  >
                    Profile
                  </Button>
                </AdminTd>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && rows.length > 0 ? (
        <p className="mt-3 text-sm text-admin-muted">
          {rows.length} {rows.length === 1 ? "person" : "people"}
          {q.trim() ? " matching search" : ""}
          {" · "}
          {rows.filter((r) => r.account === "registered").length} registered
          accounts
          {" · "}
          {rows.filter((r) => r.account === "guest").length} guests / contacts
        </p>
      ) : null}
    </AdminShell>
  );
}

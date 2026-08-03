"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StoreProduct } from "@/lib/mappers";

type AdminUser = {
  email?: string;
  name?: string;
  role?: string;
  isSuperAdmin?: boolean;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    load();
  }, [router]);

  function load() {
    fetch("/api/products?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setProducts(j.data);
      });
  }

  const filtered = products.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.handle.includes(q.toLowerCase()),
  );

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Products"
        description={`${products.length} products · prices in PKR`}
        action={<Button href="/admin/products/new">Add product</Button>}
      />

      <div className="mb-5 max-w-md">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name or handle"
          aria-label="Filter products"
        />
      </div>

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>Product</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Stock</AdminTh>
            <AdminTh className="text-right">From</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr
              key={p.handle}
              className="hover:bg-[var(--admin-soft)]"
            >
              <AdminTd>
                <p className="font-semibold text-[var(--admin-ink)]">
                  {p.name}
                </p>
                <p className="font-mono text-xs text-[var(--admin-muted)]">
                  {p.handle}
                </p>
              </AdminTd>
              <AdminTd>
                <AdminStatusBadge status={p.status || "active"} />
              </AdminTd>
              <AdminTd className="text-[var(--admin-muted)]">
                {p.inStock ? "In stock" : "Out of stock"}
              </AdminTd>
              <AdminTd className="text-right font-medium tabular-nums text-[var(--admin-ink)]">
                {formatPkr(p.prices[0]?.price ?? 0)}
              </AdminTd>
              <AdminTd className="text-right">
                <Button
                  href={`/admin/products/${p.handle}`}
                  variant="secondary"
                  className="!h-10 !min-h-10 !w-auto !px-4"
                >
                  Edit
                </Button>
              </AdminTd>
            </tr>
          ))}
          {filtered.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-14 text-center text-[var(--admin-muted)]"
              >
                No products match.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </AdminShell>
  );
}

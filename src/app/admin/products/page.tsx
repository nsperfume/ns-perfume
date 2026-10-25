"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminNotice,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  formatPkr,
  useRowLink,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import type { StoreProduct } from "@/lib/mappers";
import { cn } from "@/lib/cn";

type AdminUser = {
  email?: string;
  name?: string;
  role?: string;
  isSuperAdmin?: boolean;
};

type Filter = "all" | "active" | "draft" | "archived" | "out";

function productStatus(p: StoreProduct) {
  return p.status || "active";
}

function sizesLine(p: StoreProduct) {
  const ml = [...p.prices].map((s) => s.ml).sort((a, b) => a - b);
  if (!ml.length) return "No sizes";
  return `${ml.length} ${ml.length === 1 ? "size" : "sizes"}: ${ml.join(", ")} ml`;
}

function lowestPrice(p: StoreProduct) {
  if (!p.prices.length) return 0;
  return Math.min(...p.prices.map((s) => s.price || 0));
}

function Thumb({ src }: { src?: string }) {
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

function StockLabel({ inStock }: { inStock: boolean }) {
  return (
    <span
      className={cn(
        "text-[0.9375rem]",
        inStock ? "text-admin-ink" : "font-semibold text-admin-danger",
      )}
    >
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const rowLink = useRowLink();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoading(true);
    setLoadError(null);
    fetch("/api/products?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setProducts(j.data);
        else setLoadError(j.error || "Could not load products");
      })
      .catch(() => setLoadError("Network error while loading products"))
      .finally(() => setLoading(false));
  }

  const counts = useMemo(() => {
    const c = { all: products.length, active: 0, draft: 0, archived: 0, out: 0 };
    for (const p of products) {
      const s = productStatus(p);
      if (s === "active") c.active++;
      else if (s === "draft") c.draft++;
      else if (s === "archived") c.archived++;
      if (!p.inStock) c.out++;
    }
    return c;
  }, [products]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "out" && p.inStock) return false;
      if (
        filter !== "all" &&
        filter !== "out" &&
        productStatus(p) !== filter
      )
        return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.descriptor?.toLowerCase().includes(needle) ||
        p.handle.includes(needle)
      );
    });
  }, [products, q, filter]);

  const chips = [
    { value: "all", label: "All", count: counts.all },
    { value: "active", label: "Published", count: counts.active },
    { value: "draft", label: "Draft", count: counts.draft },
    ...(counts.archived
      ? [{ value: "archived", label: "Archived", count: counts.archived }]
      : []),
    { value: "out", label: "Out of stock", count: counts.out },
  ];

  const hasFilters = Boolean(q.trim()) || filter !== "all";
  const editHref = (p: StoreProduct) =>
    `/admin/products/${encodeURIComponent(p.handle)}`;

  const empty =
    !loading && filtered.length === 0 ? (
      products.length === 0 ? (
        <AdminEmptyState
          title="No products yet"
          description="Add your first bottle to start selling."
          action={
            <Button href="/admin/products/new" className="w-auto!">
              Add product
            </Button>
          }
        />
      ) : (
        <AdminEmptyState
          title="No products match"
          action={
            <Button
              variant="secondary"
              className="w-auto!"
              onClick={() => {
                setQ("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      )
    ) : null;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Products"
        action={
          <Button href="/admin/products/new" className="w-full sm:w-auto!">
            Add product
          </Button>
        }
      />

      {loadError ? (
        <AdminNotice tone="error" onDismiss={() => setLoadError(null)}>
          {loadError}
        </AdminNotice>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminFilterChips
          label="Filter products"
          value={filter}
          onChange={(next) => setFilter(next as Filter)}
          options={chips}
        />
        <AdminSearchInput
          value={q}
          onChange={setQ}
          placeholder="Search products"
          label="Search products"
          className="w-full lg:max-w-sm"
        />
      </div>

      {/* Phones: compact cards */}
      <div className="md:hidden">
        {loading ? (
          <p className="rounded-lg border border-admin-line bg-admin-paper px-4 py-12 text-center text-admin-muted">
            Loading products…
          </p>
        ) : empty ? (
          <div className="rounded-lg border border-admin-line bg-admin-paper">
            {empty}
          </div>
        ) : (
          <ul className="divide-y divide-admin-line overflow-hidden rounded-lg border border-admin-line bg-admin-paper shadow-admin">
            {filtered.map((p) => (
              <li key={p.handle}>
                <Link
                  href={editHref(p)}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-admin-soft-2"
                >
                  <Thumb src={p.imagePrimary || p.gallery?.[0]} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-admin-ink">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] text-admin-muted">
                      {p.inStock ? sizesLine(p) : "Out of stock"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <AdminStatusBadge status={productStatus(p)} />
                    <span className="font-mono text-sm tabular-nums text-admin-ink">
                      {formatPkr(lowestPrice(p))}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminTable className="hidden md:block">
        <thead>
          <tr>
            <AdminTh>Product</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Inventory</AdminTh>
            <AdminTh numeric>Price from</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="px-4 py-14 text-center text-admin-muted">
                Loading products…
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={4}>{empty}</td>
            </tr>
          ) : (
            filtered.map((p) => {
              const row = rowLink(editHref(p));
              return (
                <tr key={p.handle} onClick={row.onClick} className={row.className}>
                  <AdminTd>
                    <div className="flex items-center gap-3.5">
                      <Thumb src={p.imagePrimary || p.gallery?.[0]} />
                      <div className="min-w-0">
                        <Link
                          href={editHref(p)}
                          className="font-semibold text-admin-ink hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-[0.8125rem] text-admin-muted">
                          {sizesLine(p)}
                        </p>
                      </div>
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <AdminStatusBadge status={productStatus(p)} />
                  </AdminTd>
                  <AdminTd>
                    <StockLabel inStock={p.inStock} />
                  </AdminTd>
                  <AdminTd numeric>{formatPkr(lowestPrice(p))}</AdminTd>
                </tr>
              );
            })
          )}
        </tbody>
      </AdminTable>

      {!loading && filtered.length > 0 ? (
        <p className="mt-3 text-sm text-admin-muted">
          Showing {filtered.length} of {products.length}{" "}
          {products.length === 1 ? "product" : "products"}
        </p>
      ) : null}
    </AdminShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import type { StoreProduct } from "@/lib/mappers";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-[#6d7175]">
            {products.length} products · prices in PKR
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white"
        >
          Add product
        </Link>
      </div>
      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter products"
          className="w-full max-w-md rounded-lg border border-[#c9cccf] bg-white px-3 py-2 text-sm"
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e1e3e5] bg-[#f6f6f7] text-[#6d7175]">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Inventory</th>
              <th className="px-4 py-3 font-medium">PKR from</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.handle}
                className="border-b border-[#e1e3e5] last:border-0 hover:bg-[#fafafa]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${p.handle}`}
                    className="font-medium text-[#005bd3] hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-[#6d7175]">{p.handle}</p>
                </td>
                <td className="px-4 py-3 capitalize">{p.status || "active"}</td>
                <td className="px-4 py-3">
                  {p.inStock ? "In stock" : "Out of stock"}
                </td>
                <td className="px-4 py-3 font-mono">
                  Rs {(p.prices[0]?.price ?? 0).toLocaleString("en-PK")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#6d7175]">
                  No products. Seed the catalog from Admin Home.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

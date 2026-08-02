"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import type { StoreProduct } from "@/lib/mappers";

export default function AdminProductEditPage() {
  const { handle } = useParams<{ handle: string }>();
  const router = useRouter();
  const isNew = handle === "new";
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    if (!isNew) {
      fetch(`/api/products/${handle}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.ok) setProduct(j.data);
          setLoading(false);
        });
    }
  }, [handle, isNew, router]);

  return (
    <AdminShell user={user}>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {isNew ? "Add product" : `Edit ${product?.name || handle}`}
      </h1>
      {loading ? (
        <p className="text-sm text-[#6d7175]">Loading…</p>
      ) : (
        <ProductForm
          initial={product}
          isNew={isNew}
          onSaved={() => router.push("/admin/products")}
        />
      )}
    </AdminShell>
  );
}

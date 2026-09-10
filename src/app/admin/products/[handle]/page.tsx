"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/ui";
import type { StoreProduct } from "@/lib/mappers";

export default function AdminProductEditPage() {
  const { handle } = useParams<{ handle: string }>();
  const router = useRouter();
  const isNew = handle === "new";
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
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
      <AdminPageHeader
        title={isNew ? "Add product" : `Edit ${product?.name || handle}`}
        description="Status draft hides the bottle on the storefront. Publish when ready."
        backHref="/admin/products"
        backLabel="Back to products"
      />
      {loading ? (
        <p className="text-base text-admin-muted">Loading…</p>
      ) : (
        <ProductForm
          initial={product}
          isNew={isNew}
          canDelete={Boolean(
            user?.isSuperAdmin || user?.role === "super_admin",
          )}
          onSaved={() => router.push("/admin/products")}
        />
      )}
    </AdminShell>
  );
}

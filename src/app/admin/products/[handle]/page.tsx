"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
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
  const [loadError, setLoadError] = useState<{
    message: string;
    notFound: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    if (!isNew) {
      setLoading(true);
      setLoadError(null);
      fetch(`/api/products/${encodeURIComponent(handle)}`)
        .then(async (r) => {
          const j = await r.json().catch(() => null);
          if (j?.ok && j.data) setProduct(j.data);
          else
            setLoadError({
              message: j?.error || "Product not found",
              notFound: r.status === 404,
            });
        })
        .catch(() =>
          setLoadError({
            message: "Network error while loading this product.",
            notFound: false,
          }),
        )
        .finally(() => setLoading(false));
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
      ) : !isNew && (loadError || !product) ? (
        <AdminCard>
          <div className="px-5 py-10 text-center">
            <p className="font-display text-lg font-medium text-admin-ink">
              {loadError?.notFound !== false
                ? "Product not found"
                : "Could not load product"}
            </p>
            <p className="mt-2 text-base text-admin-muted">
              {loadError?.notFound !== false
                ? `No product with the handle “${handle}”. It may have been deleted or renamed.`
                : loadError.message}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button href="/admin/products" className="w-auto!">
                Back to products
              </Button>
              {loadError && !loadError.notFound ? (
                <Button
                  variant="secondary"
                  className="w-auto!"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              ) : null}
            </div>
          </div>
        </AdminCard>
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

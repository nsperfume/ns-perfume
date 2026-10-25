"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLinkIcon } from "@animateicons/react/lucide";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
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
            message: "Check your connection and try again.",
            notFound: false,
          }),
        )
        .finally(() => setLoading(false));
    }
  }, [handle, isNew, router]);

  const live = product?.status === "active" || product?.status === undefined;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title={isNew ? "Add product" : product?.name || "Product"}
        backHref="/admin/products"
        backLabel="Products"
        action={
          !isNew && product && live ? (
            <a
              href={`/products/${encodeURIComponent(product.handle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-admin-ink bg-admin-paper px-5 text-sm font-semibold text-admin-ink transition-colors hover:border-brass"
            >
              View in store
              <ExternalLinkIcon size={16} color="currentColor" isAnimated={false} />
            </a>
          ) : undefined
        }
      />
      {loading ? (
        <p className="text-[0.9375rem] text-admin-muted">Loading product…</p>
      ) : !isNew && (loadError || !product) ? (
        <AdminCard>
          <AdminEmptyState
            title={
              loadError?.notFound !== false
                ? "Product not found"
                : "Could not load this product"
            }
            description={
              loadError?.notFound !== false
                ? "It may have been deleted."
                : loadError.message
            }
            action={
              loadError && !loadError.notFound ? (
                <Button
                  variant="secondary"
                  className="w-auto!"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              ) : (
                <Button href="/admin/products" className="w-auto!">
                  Back to products
                </Button>
              )
            }
          />
        </AdminCard>
      ) : (
        <ProductForm
          initial={product}
          isNew={isNew}
          canDelete={Boolean(
            user?.isSuperAdmin || user?.role === "super_admin",
          )}
          onSaved={(saved, meta) => {
            if (meta.created || meta.deleted) {
              router.push("/admin/products");
              return;
            }
            if (saved) setProduct(saved);
          }}
        />
      )}
    </AdminShell>
  );
}

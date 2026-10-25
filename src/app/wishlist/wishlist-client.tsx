"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useWishlist, type WishlistItem } from "@/context/wishlist";
import { useCart } from "@/context/cart";
import { useUi } from "@/context/ui";
import { Price } from "@/components/commerce/price";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import type { StoreProduct } from "@/lib/mappers";

type ResolvedItem =
  /** Catalog still loading */
  | { state: "loading"; pricePkr: number; sizeLabel: string | null }
  /** Saved size still exists and the bottle is in stock: can go straight to the bag */
  | {
      state: "ready";
      product: StoreProduct;
      size: StoreProduct["prices"][number];
      pricePkr: number;
      sizeLabel: string;
    }
  /** No saved size, or the size is gone: pick one on the product page */
  | { state: "choose"; pricePkr: number; sizeLabel: string | null }
  | { state: "out-of-stock"; pricePkr: number; sizeLabel: string | null }
  | { state: "unavailable"; pricePkr: number; sizeLabel: null };

/**
 * Match a saved item to the live catalog. Only a SKU that still exists on an
 * in-stock product moves straight to the bag, at today's price.
 */
function resolveItem(
  item: WishlistItem,
  catalog: Map<string, StoreProduct> | null,
  catalogFailed: boolean,
): ResolvedItem {
  const savedSize = item.sizeMl ? `${item.sizeMl} ml` : null;
  // Without the live catalog we cannot confirm the SKU, so send them to the product page.
  if (catalogFailed) {
    return { state: "choose", pricePkr: item.pricePkr, sizeLabel: savedSize };
  }
  if (!catalog) {
    return { state: "loading", pricePkr: item.pricePkr, sizeLabel: savedSize };
  }
  const product = catalog.get(item.productHandle);
  if (!product || !product.prices.length) {
    return { state: "unavailable", pricePkr: item.pricePkr, sizeLabel: null };
  }
  const size = item.sku
    ? product.prices.find((p) => p.sku === item.sku)
    : undefined;
  if (size && product.inStock) {
    return {
      state: "ready",
      product,
      size,
      pricePkr: size.price,
      sizeLabel: `${size.ml} ml`,
    };
  }
  const smallest = product.prices.reduce((a, b) => (b.price < a.price ? b : a));
  const sizeLabel =
    product.prices.length > 1
      ? `From ${`${smallest.ml} ml`}`
      : `${smallest.ml} ml`;
  return {
    state: product.inStock ? "choose" : "out-of-stock",
    pricePkr: smallest.price,
    sizeLabel,
  };
}

export function WishlistClient() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useUi();
  const gridRef = useRef<HTMLUListElement>(null);
  const [catalog, setCatalog] = useState<StoreProduct[] | null>(null);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (!gridRef.current || !items.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    gsap.fromTo(
      gridRef.current.querySelectorAll("[data-card]"),
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.42, stagger: 0.07, ease: "power3.out" },
    );
  }, [items.length]);

  useEffect(() => {
    if (!hasItems || catalog || catalogFailed) return;
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setCatalog(j.data as StoreProduct[]);
        else setCatalogFailed(true);
      })
      .catch(() => {
        if (!cancelled) setCatalogFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hasItems, catalog, catalogFailed]);

  const byHandle = useMemo(
    () => (catalog ? new Map(catalog.map((p) => [p.handle, p])) : null),
    [catalog],
  );

  return (
    <>
      <PageHero
        title={pageCopy.wishlist.title}
        description={pageCopy.wishlist.description}
        image={siteImages.wishlist}
        alt="NS Perfume bottles set aside on a quiet shelf for the wishlist"
        objectPosition="center 48%"
      />

      <section className="border-b border-hairline bg-canvas section-y">
        <div className="container-ns">
          {items.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-start gap-6">
              <p className="text-eyebrow text-taupe">
                Empty wishlist
              </p>
              <p className="text-body-lg text-ink/80">
                {pageCopy.wishlistEmpty}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="/products">Browse the line</Button>
                <Button href="/collections/bestsellers" variant="secondary">
                  Bestsellers
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-10 flex flex-col gap-3 border-b border-hairline pb-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-eyebrow text-taupe">
                    Saved bottles
                  </p>
                  <h2 className="mt-2 text-display-md text-ink">
                    {items.length} selection{items.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="inline-flex min-h-11 shrink-0 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
                >
                  Continue shopping
                </Link>
              </div>

              <ul
                ref={gridRef}
                className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {items.map((item) => {
                  const live = resolveItem(item, byHandle, catalogFailed);
                  const productHref = `/products/${item.productHandle}`;
                  return (
                    <li key={item.productHandle} data-card className="flex flex-col">
                      <Link
                        href={productHref}
                        className="group relative mb-4 block aspect-[4/5] overflow-hidden bg-muted outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass/60"
                      >
                        <Image
                          src={item.image}
                          alt={`NS Perfume ${item.name} bottle`}
                          fill
                          loading="lazy"
                          quality={80}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                        />
                      </Link>

                      <div className="flex flex-1 flex-col">
                        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0">
                            <Link
                              href={productHref}
                              className="text-display-sm text-ink transition-colors hover:text-brass-ink"
                            >
                              {item.name}
                            </Link>
                            {live.sizeLabel ? (
                              <p className="mt-1.5 font-mono text-xs text-taupe">
                                {live.sizeLabel}
                              </p>
                            ) : null}
                          </div>
                          {live.state !== "unavailable" ? (
                            <Price
                              amountPkr={live.pricePkr}
                              className="shrink-0 text-base sm:pt-0.5"
                            />
                          ) : null}
                        </div>

                        <div className="mt-auto flex flex-col gap-2.5">
                          {live.state === "ready" ? (
                            <Button
                              type="button"
                              className="w-full sm:w-full"
                              onClick={() => {
                                addItem({
                                  productHandle: live.product.handle,
                                  name: live.product.name,
                                  sizeMl: live.size.ml,
                                  price: live.size.price,
                                  sku: live.size.sku,
                                  image: live.product.imagePrimary || item.image,
                                });
                                showToast(`${item.name} added to your bag`, "cart");
                              }}
                            >
                              Move to bag
                            </Button>
                          ) : live.state === "loading" ? (
                            <Button type="button" className="w-full sm:w-full" disabled>
                              {item.sku ? "Move to bag" : "Choose a size"}
                            </Button>
                          ) : live.state === "choose" ? (
                            <Button href={productHref} className="w-full sm:w-full">
                              Choose a size
                            </Button>
                          ) : (
                            <p className="text-body-sm text-taupe">
                              {live.state === "out-of-stock"
                                ? "Out of stock for now."
                                : "This bottle is no longer available."}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-4">
                            {live.state !== "unavailable" ? (
                              <Button
                                href={productHref}
                                variant="ghost"
                                className="min-h-10 px-0"
                              >
                                View product
                              </Button>
                            ) : (
                              <span />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                removeItem(item.productHandle);
                                showToast(
                                  `${item.name} removed from wishlist`,
                                  "wishlist",
                                );
                              }}
                              className="inline-flex min-h-11 cursor-pointer items-center text-caption text-taupe underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}

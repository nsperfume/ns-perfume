"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useWishlist } from "@/context/wishlist";
import { useCart } from "@/context/cart";
import { useUi } from "@/context/ui";
import { Price } from "@/components/commerce/price";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";

export function WishlistClient() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();
  const { showToast } = useUi();
  const gridRef = useRef<HTMLUListElement>(null);

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
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                Empty wishlist
              </p>
              <p className="font-serif text-body-lg text-ink/80">
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
                  <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                    Saved bottles
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-medium text-ink">
                    {items.length} selection{items.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="shrink-0 font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                >
                  Continue shopping
                </Link>
              </div>

              <ul
                ref={gridRef}
                className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {items.map((item) => (
                  <li key={item.productHandle} data-card className="flex flex-col">
                    <Link
                      href={`/products/${item.productHandle}`}
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
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productHandle}`}
                            className="font-display text-[1.1rem] font-medium leading-snug text-ink transition-colors hover:text-brass sm:text-[1.15rem]"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-taupe">
                            From 50ml
                          </p>
                        </div>
                        <Price
                          amountPkr={item.pricePkr}
                          className="shrink-0 pt-0.5 text-[1rem] font-medium tabular-nums"
                        />
                      </div>

                      <div className="mt-auto flex flex-col gap-2.5">
                        <Button
                          type="button"
                          className="w-full sm:w-full"
                          onClick={() => {
                            addItem({
                              productHandle: item.productHandle,
                              name: item.name,
                              sizeMl: 50,
                              price: item.pricePkr,
                              sku: `WL-${item.productHandle}-50`,
                              image: item.image,
                            });
                            showToast(`${item.name} added to your bag`, "cart");
                          }}
                        >
                          Move to bag
                        </Button>
                        <div className="flex items-center justify-between gap-4">
                          <Button
                            href={`/products/${item.productHandle}`}
                            variant="ghost"
                            className="min-h-10 px-0"
                          >
                            View product
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              removeItem(item.productHandle);
                              showToast(
                                `${item.name} removed from wishlist`,
                                "wishlist",
                              );
                            }}
                            className="cursor-pointer font-display text-[11px] uppercase tracking-[0.12em] text-taupe transition-colors hover:text-ink"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </>
  );
}

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

      <section className="bg-canvas section-y">
        <div className="container-ns">
          {items.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-start gap-6 border border-hairline bg-paper px-8 py-12 sm:px-12">
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                Empty Wishlist
              </p>
              <p className="font-serif text-body-lg text-ink/80">
                {pageCopy.wishlistEmpty}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="/products">Browse The Line</Button>
                <Button href="/collections/bestsellers" variant="secondary">
                  Bestsellers
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-10 flex flex-col gap-3 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                    Saved Bottles
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-medium text-ink">
                    {items.length} Selection{items.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <p className="max-w-md font-serif text-[1.05rem] text-taupe">
                  Compare notes when you are ready. Nothing is held until it
                  moves into your bag.
                </p>
              </div>

              <ul
                ref={gridRef}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {items.map((item) => (
                  <li
                    key={item.productHandle}
                    data-card
                    className="group flex flex-col border border-hairline bg-paper"
                  >
                    <Link
                      href={`/products/${item.productHandle}`}
                      className="relative aspect-[4/5] overflow-hidden bg-muted"
                    >
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        loading="lazy"
                        quality={75}
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div>
                        <Link
                          href={`/products/${item.productHandle}`}
                          className="font-display text-xl font-medium text-ink transition-colors hover:text-brass"
                        >
                          {item.name}
                        </Link>
                        <div className="mt-2">
                          <Price amountPkr={item.pricePkr} className="text-lg" />
                        </div>
                      </div>
                      <div className="mt-auto flex flex-col gap-2">
                        <Button
                          type="button"
                          className="w-full"
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
                          Move To Bag
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            href={`/products/${item.productHandle}`}
                            variant="secondary"
                            className="min-h-11 flex-1"
                          >
                            View
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
                            className="min-h-11 flex-1 cursor-pointer border border-hairline font-display text-[11px] uppercase tracking-[0.12em] text-taupe transition-colors hover:border-ink hover:text-ink"
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

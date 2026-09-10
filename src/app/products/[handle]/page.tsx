import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/gallery";
import { ProductPurchasePanel } from "@/components/product/purchase-panel";
import { ProductCharacterWear } from "@/components/product/character-wear";
import { ProductTrustProcess } from "@/components/product/trust-process";
import { ProductReviewsSection } from "@/components/product/reviews-section";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { ProductCard } from "@/components/commerce/product-card";
import { ScentPyramid } from "@/components/commerce/scent-pyramid";
import { PerformanceMeter } from "@/components/commerce/performance-meter";
import { JsonLd } from "@/components/seo/json-ld";
import {
  StoreBreadcrumb,
  StoreSectionHeader,
} from "@/components/layout/store-section";
import { siteImages } from "@/data/images";
import {
  getProductReviews,
  getStoreProduct,
  getStoreProducts,
} from "@/lib/store-data";
import type { StoreProduct } from "@/lib/mappers";
import { richTextToPlain } from "@/lib/rich-text";

type Props = { params: Promise<{ handle: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getStoreProduct(handle);
  if (!product) return { title: "Product" };
  const fromAdmin = richTextToPlain(product.description || "").trim();
  const metaDescription = (
    fromAdmin ||
    `${product.descriptor}. ${product.concentration} with real note layers and sillage ratings from NS Perfume.`
  ).slice(0, 155);
  return {
    title: `${product.name} ${product.concentration} perfume`,
    description: metaDescription,
    alternates: { canonical: `/products/${product.handle}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getStoreProduct(handle);
  if (!product) notFound();

  const all = await getStoreProducts();
  const related = product.relatedHandles
    .map((h) => all.find((p) => p.handle === h))
    .filter((p): p is StoreProduct => Boolean(p))
    .slice(0, 4);
  const fallbackRelated =
    related.length > 0
      ? related
      : all.filter((p) => p.handle !== product.handle).slice(0, 4);
  const productReviews = await getProductReviews(product.handle);
  const price = product.prices[0]?.price ?? 0;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      richTextToPlain(product.description || "").trim() || product.descriptor,
    sku: product.prices[0]?.sku,
    brand: { "@type": "Brand", name: "NS Perfume" },
    image: product.gallery?.[0] || product.imagePrimary,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: String(price),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: "/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `/products/${product.handle}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[productLd, breadcrumbLd]} />

      {/* Hero: gallery + buy */}
      <section className="border-b border-hairline bg-canvas">
        <div className="container-ns pb-10 pt-6 md:pb-14 md:pt-8 lg:pb-16">
          <StoreBreadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/products" },
              {
                label: product.family,
                href: `/collections/${product.family}`,
              },
              { label: product.name },
            ]}
          />

          <div className="mt-6 grid items-start gap-8 md:gap-12 lg:mt-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] lg:items-stretch lg:gap-14 xl:gap-16">
            <ProductGallery images={product.gallery} name={product.name} />
            <div className="min-h-0 lg:h-full">
              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="border-b border-hairline bg-paper">
        <div className="container-ns py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16">
            <div>
              <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                Composition
              </p>
              <h2 className="text-display-md text-balance">
                Notes on {product.name}
              </h2>
              <p className="mt-3 max-w-md font-serif text-[1.05rem] leading-relaxed text-taupe">
                How this bottle opens, develops, and finishes. Match it to heat,
                fabric layers, and how close you sit to other people.
              </p>
            </div>
            <ScentPyramid
              variant="inline"
              topNotes={product.topNotes}
              heartNotes={product.heartNotes}
              baseNotes={product.baseNotes}
            />
          </div>
        </div>
      </section>

      {/* Atmosphere band */}
      <section className="relative isolate overflow-hidden border-b border-hairline">
        <div className="relative min-h-[16rem] w-full sm:min-h-0 sm:aspect-video">
          <Image
            src={siteImages.productAtmosphere}
            alt="Perfume atmosphere for wearing NS Perfume"
            fill
            quality={85}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-linear-to-r from-ink/80 via-ink/55 to-ink/25"
            aria-hidden
          />
          <div className="absolute inset-0 z-10 flex items-end">
            <div className="container-ns w-full py-7 sm:py-10 md:py-14 lg:py-16">
              <div className="max-w-xl">
                <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-paper/70">
                  Wear it in
                </p>
                <h2 className="mt-2 font-display text-[1.35rem] font-medium leading-snug text-balance text-paper sm:mt-3 sm:text-[2rem] sm:leading-tight md:text-[2.35rem]">
                  {product.name} for rooms that hold a conversation
                </h2>
                <p className="mt-2 line-clamp-3 max-w-md font-serif text-[0.98rem] leading-relaxed text-paper/85 sm:mt-4 sm:line-clamp-none sm:text-[1.1rem]">
                  {product.descriptor}. Built for Pakistani heat, layered
                  fabric, and evenings that run long.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Character and wear */}
      <section className="border-b border-hairline bg-canvas section-y">
        <div className="container-ns">
          <StoreSectionHeader
            eyebrow="Details"
            title="Character and wear"
            description="The story behind the formula, and how to wear it day to evening."
          />
          <ProductCharacterWear product={product} />
        </div>
      </section>

      {/* Specs */}
      <section className="border-b border-hairline bg-muted/30">
        <div className="container-ns py-12 md:py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12 xl:gap-16">
            <PerformanceMeter
              sillage={product.sillage}
              longevity={product.longevity}
            />
            <dl className="grid gap-6 sm:grid-cols-2">
              <div className="border-t border-hairline pt-4">
                <dt className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Concentration
                </dt>
                <dd className="mt-2 font-display text-xl font-medium text-ink">
                  {product.concentration}
                </dd>
                <dd className="mt-1 font-serif text-[1rem] text-taupe">
                  {product.prices.map((p) => `${p.ml}ml`).join(" · ")}
                </dd>
              </div>
              <div className="border-t border-hairline pt-4">
                <dt className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Origin
                </dt>
                <dd className="mt-2 font-display text-xl font-medium text-ink">
                  {product.countryOfOrigin}
                </dd>
                <dd className="mt-1 font-serif text-[1rem] capitalize text-taupe">
                  {product.family} · {product.gender}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Order flow (once) */}
      <section className="border-b border-hairline bg-canvas section-y">
        <div className="container-ns">
          <StoreSectionHeader
            eyebrow="After checkout"
            title="How your order moves"
            description="Four steps from bag to door. Payment options are chosen at checkout."
          />
          <ProductTrustProcess />
        </div>
      </section>

      {/* Ingredients */}
      <section className="border-b border-hairline bg-paper section-y">
        <div className="container-ns grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <StoreSectionHeader
              eyebrow="Formula"
              title="Ingredients and sourcing"
              className="mb-0"
            />
            <p className="mt-4 max-w-md font-serif text-[1.1rem] leading-relaxed text-taupe">
              Country of origin: {product.countryOfOrigin}.
              {product.containsAlcohol
                ? " Core materials used in this formula are listed for transparency, not as full IFRA paperwork."
                : " This bottle is alcohol-free. Core materials are listed for transparency, not as full IFRA paperwork."}
            </p>
            {!product.containsAlcohol ? (
              <p className="mt-3 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
                Alcohol-free formula
              </p>
            ) : null}
          </div>
          {product.ingredients.length ? (
            <ul className="columns-1 gap-x-10 sm:columns-2">
              {product.ingredients.map((ing) => (
                <li
                  key={ing}
                  className="mb-3 break-inside-avoid border-b border-hairline pb-3 font-serif text-[1.05rem] text-ink/85"
                >
                  {ing}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-serif text-[1.05rem] text-taupe">
              {product.containsAlcohol
                ? "Ingredient details for this bottle are available on the packing insert."
                : "Alcohol-free formula. Full material notes are available on the packing insert."}
            </p>
          )}
        </div>
      </section>

      <div className="container-ns">
        <ProductReviewsSection
          productHandle={product.handle}
          productName={product.name}
          rating={product.rating}
          reviewCount={product.reviewCount}
          reviews={productReviews}
        />
      </div>

      {fallbackRelated.length ? (
        <section className="border-t border-hairline bg-muted/30 section-y">
          <div className="container-ns">
            <StoreSectionHeader
              eyebrow="Next bottles"
              title="You may also like"
              action={
                <Link
                  href="/products"
                  className="font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                >
                  Shop all
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {fallbackRelated.map((p) => (
                <ProductCard key={p.handle} product={p} showMeter />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <RecentlyViewed currentHandle={product.handle} catalog={all} />
    </>
  );
}

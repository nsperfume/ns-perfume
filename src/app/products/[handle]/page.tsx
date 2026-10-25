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
import { siteConfig } from "@/data/site";
import {
  getProductReviews,
  getStoreProduct,
  getStoreProducts,
} from "@/lib/store-data";
import type { StoreProduct } from "@/lib/mappers";
import { richTextToPlain } from "@/lib/rich-text";

type Props = { params: Promise<{ handle: string }> };

/** Cached for speed; admin edits refresh it at once via revalidateStorefront(). */
export const revalidate = 300;

/** Prerender every product at build; new products render on first visit. */
export async function generateStaticParams() {
  const products = await getStoreProducts();
  return products.map((p) => ({ handle: p.handle }));
}

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

  // Structured data needs absolute URLs; uploaded images may already be absolute.
  const absoluteUrl = (path: string) =>
    /^https?:\/\//i.test(path)
      ? path
      : `${siteConfig.url}${path.startsWith("/") ? "" : "/"}${path}`;
  const productUrl = absoluteUrl(`/products/${product.handle}`);
  const sizePrices = product.prices.map((p) => p.price).filter((p) => p > 0);
  const lowPrice = sizePrices.length ? Math.min(...sizePrices) : 0;
  const highPrice = sizePrices.length ? Math.max(...sizePrices) : 0;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      richTextToPlain(product.description || "").trim() || product.descriptor,
    sku: product.prices[0]?.sku,
    brand: { "@type": "Brand", name: siteConfig.name },
    image: absoluteUrl(product.gallery?.[0] || product.imagePrimary),
    url: productUrl,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PKR",
      lowPrice: String(lowPrice),
      highPrice: String(highPrice),
      offerCount: product.prices.length,
      url: productUrl,
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
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: absoluteUrl("/products"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[productLd, breadcrumbLd]} />

      {/* Hero: gallery + buy */}
      <section className="border-b border-hairline bg-canvas">
        <div className="container-ns pb-12 pt-6 md:pb-16 md:pt-8 lg:pb-20">
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

          <div className="mt-2 grid items-start gap-8 md:gap-12 lg:mt-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:gap-14 xl:gap-20">
            <ProductGallery images={product.gallery} name={product.name} />
            <div className="min-w-0 lg:pt-2">
              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="border-b border-hairline bg-paper">
        <div className="container-ns section-y">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-20">
            <div>
              <p className="mb-3 text-eyebrow text-taupe">
                Composition
              </p>
              <h2 className="text-display-md text-balance">
                Notes on {product.name}
              </h2>
              <p className="mt-4 max-w-md text-body-lg text-taupe">
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
            <div className="container-ns w-full py-8 sm:py-12 md:py-16 lg:py-20">
              <div className="max-w-[40rem]">
                <p className="text-eyebrow text-paper/80">
                  Wear it in
                </p>
                <h2 className="mt-3 text-display-md text-balance text-paper sm:mt-4 lg:text-display-lg">
                  {product.name} for rooms that hold a conversation
                </h2>
                <p className="mt-3 line-clamp-3 max-w-[34rem] text-body text-paper/90 sm:mt-5 sm:line-clamp-none sm:text-body-lg">
                  Built for Pakistani heat, layered fabric, and evenings that
                  run long.
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
            title="Character and wear"
            description="The story behind the formula, and how to wear it day to evening."
          />
          <ProductCharacterWear product={product} />
        </div>
      </section>

      {/* Specs */}
      <section className="border-b border-hairline bg-muted/30">
        <div className="container-ns section-y">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16 xl:gap-20">
            <PerformanceMeter
              sillage={product.sillage}
              longevity={product.longevity}
            />
            <dl className="grid gap-8 sm:grid-cols-2">
              <div className="border-t border-hairline pt-5">
                <dt className="text-eyebrow text-taupe">
                  Concentration
                </dt>
                <dd className="mt-2 text-display-sm text-ink">
                  {product.concentration}
                </dd>
                <dd className="mt-1 font-mono text-sm text-taupe">
                  {product.prices.map((p) => `${p.ml} ml`).join(" · ")}
                </dd>
              </div>
              <div className="border-t border-hairline pt-5">
                <dt className="text-eyebrow text-taupe">
                  Origin
                </dt>
                <dd className="mt-2 text-display-sm text-ink">
                  {product.countryOfOrigin}
                </dd>
                <dd className="mt-1 text-body capitalize text-taupe">
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
        <div className="container-ns grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div>
            <StoreSectionHeader
              eyebrow="Formula"
              title="Ingredients and sourcing"
              className="mb-0"
            />
            <p className="mt-4 max-w-md text-body-lg text-taupe">
              Country of origin: {product.countryOfOrigin}.
              {product.containsAlcohol
                ? " Core materials used in this formula are listed for transparency, not as full IFRA paperwork."
                : " This bottle is alcohol-free. Core materials are listed for transparency, not as full IFRA paperwork."}
            </p>
            {!product.containsAlcohol ? (
              <p className="mt-3 text-eyebrow text-ink">
                Alcohol-free formula
              </p>
            ) : null}
          </div>
          {product.ingredients.length ? (
            <ul className="columns-1 gap-x-10 sm:columns-2 lg:pt-2">
              {product.ingredients.map((ing) => (
                <li
                  key={ing}
                  className="mb-3 break-inside-avoid border-b border-hairline pb-3 text-body text-ink/85"
                >
                  {ing}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-taupe">
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
                  className="inline-flex min-h-11 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:text-brass-ink hover:decoration-brass"
                >
                  Shop all
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 2xl:gap-x-6">
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

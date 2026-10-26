import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/gallery";
import { ProductPurchasePanel } from "@/components/product/purchase-panel";
import { ProductCharacterWear } from "@/components/product/character-wear";
import { ProductDetailsAccordion } from "@/components/product/details-accordion";
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
import { TrustedHtml as RichHtml } from "@/components/ui/trusted-html";

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
  // Curated picks first, then fill to four from the rest of the line.
  const fallbackRelated = [
    ...related,
    ...all.filter(
      (p) =>
        p.handle !== product.handle &&
        !related.some((r) => r.handle === p.handle),
    ),
  ].slice(0, 4);
  const descriptionHtml = richTextToPlain(product.description || "").trim()
    ? product.description
    : "";
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

  // One trail for the visible breadcrumb and the BreadcrumbList markup.
  const familyLabel = product.family
    ? product.family.charAt(0).toUpperCase() + product.family.slice(1)
    : "";
  const trail: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Shop all", href: "/products" },
    ...(familyLabel ? [{ label: familyLabel, href: `/collections/${product.family}` }] : []),
    { label: product.name },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.label,
      item: t.href ? absoluteUrl(t.href) : productUrl,
    })),
  };

  return (
    <>
      <JsonLd data={[productLd, breadcrumbLd]} />

      {/* Gallery + buy box (sticky on desktop while the gallery scrolls) */}
      <section className="border-b border-hairline bg-canvas">
        <div className="container-ns pb-12 pt-6 md:pb-16 md:pt-8">
          <StoreBreadcrumb items={trail} />

          <div className="mt-2 grid items-start gap-8 md:gap-12 lg:mt-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:gap-14 xl:gap-20">
            <ProductGallery images={product.gallery} name={product.name} />
            <div className="scrollbar-panel min-w-0 lg:sticky lg:top-[calc(var(--spacing-chrome-height)+1.5rem)] lg:-mr-3 lg:max-h-[calc(100dvh-var(--spacing-chrome-height)-2.5rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pr-3">
              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </div>
      </section>

      {/* The scent: notes and performance in one place */}
      <section
        id="notes"
        className="scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] border-b border-hairline bg-paper py-14 lg:py-20"
      >
        <div className="container-ns">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
            <div>
              <p className="mb-3 text-eyebrow text-taupe">The scent</p>
              <h2 className="text-display-md text-balance text-ink">
                How {product.name} wears
              </h2>
              <ScentPyramid
                variant="inline"
                className="mt-6"
                topNotes={product.topNotes}
                heartNotes={product.heartNotes}
                baseNotes={product.baseNotes}
              />
            </div>
            <div>
              <PerformanceMeter
                sillage={product.sillage}
                longevity={product.longevity}
              />
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-hairline pt-5">
                <div>
                  <dt className="text-eyebrow text-taupe">Concentration</dt>
                  <dd className="mt-1 text-body font-semibold text-ink">
                    {product.concentration}
                  </dd>
                </div>
                <div>
                  <dt className="text-eyebrow text-taupe">Sizes</dt>
                  <dd className="mt-1 flex flex-wrap gap-x-2 font-sans tabular-nums text-sm text-ink">
                    {product.prices.map((p, i) => (
                      <span key={p.ml} className="whitespace-nowrap">
                        {i > 0 ? "· " : ""}
                        {p.ml} ml
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-eyebrow text-taupe">Origin</dt>
                  <dd className="mt-1 text-body font-semibold text-ink">
                    {product.countryOfOrigin}
                  </dd>
                </div>
                <div>
                  <dt className="text-eyebrow text-taupe">Family</dt>
                  <dd className="mt-1 text-body font-semibold capitalize text-ink">
                    {product.family} · {product.gender}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof, right after the scent details */}
      <ProductReviewsSection
        productHandle={product.handle}
        productName={product.name}
        rating={product.rating}
        reviewCount={product.reviewCount}
        reviews={productReviews}
      />

      {/* Story and wear: atmosphere image beside the story on desktop */}
      <section className="border-b border-hairline bg-canvas lg:grid lg:grid-cols-2">
        <div className="relative isolate h-[18rem] w-full overflow-hidden sm:h-[22rem] lg:h-auto lg:min-h-[28rem]">
          <Image
            src={siteImages.productAtmosphere}
            alt="Perfume atmosphere for wearing NS Perfume"
            fill
            quality={85}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/40 to-ink/10"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 z-10 px-[var(--gutter)] pb-8 sm:pb-10 lg:pb-14 lg:pl-[max(var(--gutter),calc((100vw-var(--container-max))/2))] lg:pr-12">
            <p className="text-eyebrow text-paper/80">Wear it in</p>
            <h2 className="mt-3 max-w-[30rem] text-display-md text-balance text-paper">
              {product.name} for rooms that hold a conversation
            </h2>
            <p className="mt-3 max-w-[30rem] text-body text-paper/90">
              Built for Pakistani heat, layered fabric, and evenings that run
              long.
            </p>
          </div>
        </div>
        <div className="px-[var(--gutter)] py-12 sm:py-14 lg:py-16 lg:pl-12 lg:pr-[max(var(--gutter),calc((100vw-var(--container-max))/2))] xl:pl-16">
          {descriptionHtml ? (
            <RichHtml
              html={descriptionHtml}
              className="mb-10 max-w-[40rem] text-body-lg text-ink/85 [&_li]:my-1 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
            />
          ) : null}
          <ProductCharacterWear product={product} />
        </div>
      </section>

      <ProductDetailsAccordion product={product} />

      {fallbackRelated.length ? (
        <section className="bg-muted/30 py-14 lg:py-20">
          <div className="container-ns">
            <StoreSectionHeader
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
            <ul className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-x-5 md:gap-y-10 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4 2xl:gap-x-6">
              {fallbackRelated.map((p) => (
                <li
                  key={p.handle}
                  className="w-[62%] shrink-0 snap-start sm:w-[40%] md:w-auto"
                >
                  <ProductCard product={p} showMeter />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <RecentlyViewed currentHandle={product.handle} catalog={all} />
    </>
  );
}

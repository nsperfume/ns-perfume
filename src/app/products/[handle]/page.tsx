import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/gallery";
import { ProductPurchasePanel } from "@/components/product/purchase-panel";
import { StoryTabs } from "@/components/product/story-tabs";
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
  BASE_OPEN_GRAPH,
  absoluteUrl,
  breadcrumbJsonLd,
  fitDescription,
  productDescription,
  productTitle,
  titleText,
} from "@/lib/seo";
import {
  getCollections,
  getProductReviews,
  getStoreProduct,
  getStoreProducts,
} from "@/lib/store-data";
import { cardProduct, type StoreProduct } from "@/lib/mappers";
import { getSiteSettings } from "@/lib/site-settings";
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

const genderLabel = (gender: string) =>
  gender === "him" ? "For him" : gender === "her" ? "For her" : "Unisex";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getStoreProduct(handle);
  if (!product) return { title: "Product" };
  const title = product.seoTitle ? { absolute: product.seoTitle } : productTitle(product);
  const description = product.seoDescription
    ? fitDescription(product.seoDescription)
    : productDescription(product);
  const url = `/products/${product.handle}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // WhatsApp and Instagram previews show the bottle, not the site banner.
    openGraph: {
      ...BASE_OPEN_GRAPH,
      title: titleText(title),
      description,
      url,
      images: product.imagePrimary ? [{ url: product.imagePrimary, alt: `${product.name} bottle` }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getStoreProduct(handle);
  if (!product) notFound();

  const [all, { checkout }, collections] = await Promise.all([
    getStoreProducts(),
    getSiteSettings(),
    getCollections(),
  ]);
  const related = product.relatedHandles
    .map((h) => all.find((p) => p.handle === h))
    .filter((p): p is StoreProduct => Boolean(p))
    .slice(0, 4);
  // Curated picks first, then the closest matches: same wearer, then family, then concentration.
  const similarity = (p: StoreProduct) =>
    (p.gender === product.gender ? 4 : p.gender === "unisex" || product.gender === "unisex" ? 2 : 0) +
    (p.family === product.family ? 3 : 0) +
    (p.concentration === product.concentration ? 1 : 0) +
    (p.inStock ? 1 : 0);
  const fallbackRelated = [
    ...related,
    ...all
      .filter(
        (p) =>
          p.handle !== product.handle &&
          !related.some((r) => r.handle === p.handle),
      )
      .sort((a, b) => similarity(b) - similarity(a)),
  ]
    .slice(0, 4)
    .map(cardProduct);
  const productReviews = await getProductReviews(product.handle);

  const productUrl = absoluteUrl(`/products/${product.handle}`);

  // Shopping-ready markup: one Offer per size in PKR with delivery and return terms.
  const standard = checkout.shipping.standard;
  const transit = standard.description.match(/(\d+)\D+(\d+)/);
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: standard.pricePkr, currency: "PKR" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "DAY" },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: transit ? Number(transit[1]) : 3,
        maxValue: transit ? Number(transit[2]) : 5,
        unitCode: "DAY",
      },
    },
  };
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "PK",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 30,
    returnMethod: "https://schema.org/ReturnByMail",
  };
  const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      richTextToPlain(product.description || "").trim() || product.descriptor,
    sku: product.prices[0]?.sku,
    brand: { "@type": "Brand", name: siteConfig.name },
    category: "Fragrances",
    audience: {
      "@type": "PeopleAudience",
      suggestedGender: product.gender === "him" ? "male" : product.gender === "her" ? "female" : "unisex",
    },
    image: product.gallery.slice(0, 4).map((src) => absoluteUrl(src)),
    url: productUrl,
    offers: product.prices
      .filter((p) => p.price > 0)
      .map((p) => ({
        "@type": "Offer",
        sku: p.sku,
        name: `${product.name} ${p.ml} ml`,
        price: String(p.price),
        priceCurrency: "PKR",
        priceValidUntil,
        itemCondition: "https://schema.org/NewCondition",
        availability: product.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: productUrl,
        shippingDetails,
        hasMerchantReturnPolicy: returnPolicy,
      })),
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
  const familyCollection = collections.find((c) => c.handle === product.family);
  const trail: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Shop all", href: "/products" },
    ...(familyCollection
      ? [{ label: String(familyCollection.title), href: `/collections/${product.family}` }]
      : []),
    { label: product.name },
  ];
  const breadcrumbLd = breadcrumbJsonLd(
    trail.map((t) => ({ label: t.label, href: t.href ?? `/products/${product.handle}` })),
  );

  // Only what this product has text for; one panel shows at a time.
  const storyPanels = [
    { id: "about", label: "About", html: product.description },
    { id: "story", label: "The story", html: product.story },
    { id: "wear", label: "How to wear", html: product.howToWear },
  ]
    .filter((panel) => richTextToPlain(panel.html || "").trim())
    .map((panel) => ({
      id: panel.id,
      label: panel.label,
      content: (
        <RichHtml
          html={panel.html}
          className="max-w-[44rem] text-pretty text-body-lg text-ink/85 [&_li]:my-1 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
        />
      ),
    }));

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
              {product.topNotes.length + product.heartNotes.length + product.baseNotes.length > 0 ? (
                <ScentPyramid
                  variant="inline"
                  className="mt-6"
                  topNotes={product.topNotes}
                  heartNotes={product.heartNotes}
                  baseNotes={product.baseNotes}
                />
              ) : null}
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
                {product.countryOfOrigin ? (
                  <div>
                    <dt className="text-eyebrow text-taupe">Origin</dt>
                    <dd className="mt-1 text-body font-semibold text-ink">
                      {product.countryOfOrigin}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-eyebrow text-taupe">Family</dt>
                  <dd className="mt-1 text-body font-semibold text-ink">
                    <span className="capitalize">{product.family}</span> · {genderLabel(product.gender)}
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

      {/* Story and wear: the image keeps one fixed size however long the copy is */}
      {storyPanels.length ? (
        <section className="border-b border-hairline bg-canvas py-14 lg:py-20">
          <div className="container-ns grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-16 xl:gap-20">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted lg:sticky lg:top-[calc(var(--spacing-chrome-height)+1.5rem)] lg:aspect-auto lg:h-[min(34rem,calc(100dvh-var(--spacing-chrome-height)-3rem))]">
              <Image
                src={siteImages.productAtmosphere}
                alt="Citrus, dried rose petals and wood in brass bowls, the raw materials of perfume notes"
                fill
                loading="lazy"
                quality={85}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-[38%_center]"
              />
            </div>
            <div className="min-w-0">
              <p className="mb-3 text-eyebrow text-taupe">Get to know it</p>
              <h2 className="text-display-md text-balance text-ink">About {product.name}</h2>
              <div className="mt-6">
                <StoryTabs label={`About ${product.name}`} panels={storyPanels} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

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

      <RecentlyViewed currentHandle={product.handle} catalog={all.map(cardProduct)} />
    </>
  );
}

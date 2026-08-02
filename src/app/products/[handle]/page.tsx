import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/gallery";
import { ProductPurchasePanel } from "@/components/product/purchase-panel";
import { ProductTabs } from "@/components/product/tabs";
import { ProductTrustProcess } from "@/components/product/trust-process";
import { ProductReviewsSection } from "@/components/product/reviews-section";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { ProductCard } from "@/components/commerce/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getProductReviews,
  getStoreProduct,
  getStoreProducts,
} from "@/lib/store-data";
import type { StoreProduct } from "@/lib/mappers";

type Props = { params: Promise<{ handle: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getStoreProduct(handle);
  if (!product) return { title: "Product" };
  return {
    title: `${product.name} ${product.concentration} perfume`,
    description: `${product.descriptor}. ${product.concentration} with real note layers and sillage ratings from NS Perfume.`,
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
    .filter((p): p is StoreProduct => Boolean(p));
  const productReviews = await getProductReviews(product.handle);
  const price = product.prices[0]?.price ?? 0;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.descriptor,
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
        name: product.family,
        item: `/collections/${product.family}`,
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
      <div className="container-ns py-8 md:py-12">
        <nav className="mb-8 text-caption text-taupe" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brass">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/collections/${product.family}`}
            className="capitalize hover:text-brass"
          >
            {product.family}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          <ProductGallery images={product.gallery} name={product.name} />
          <ProductPurchasePanel product={product} />
        </div>

        <section className="border-t border-hairline section-y">
          <ProductTabs product={product} />
        </section>

        <section className="border-t border-hairline section-y">
          <h2 className="text-display-md mb-6">Ordering & Delivery</h2>
          <ProductTrustProcess />
        </section>

        <section className="border-t border-hairline section-y">
          <h2 className="text-display-md mb-4">Ingredients & Sourcing</h2>
          <p className="mb-4 measure text-body text-taupe">
            Country of origin: {product.countryOfOrigin}. Core materials used in
            this formula:
          </p>
          <ul className="measure list-disc space-y-2 pl-4 text-body text-taupe">
            {product.ingredients.map((ing) => (
              <li key={ing}>{ing}</li>
            ))}
          </ul>
        </section>

        <ProductReviewsSection
          rating={product.rating}
          reviewCount={product.reviewCount}
          reviews={productReviews}
        />

        {related.length ? (
          <section className="border-t border-hairline section-y">
            <h2 className="text-display-md mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.handle} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <RecentlyViewed currentHandle={product.handle} catalog={all} />
    </>
  );
}

import type { Metadata } from "next";
import { ProductsCatalog } from "@/components/commerce/products-catalog";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { getStoreProducts } from "@/lib/store-data";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, breadcrumbJsonLd, pageOpenGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Buy perfumes online in Pakistan",
  description: pageCopy.products.metaDescription,
  alternates: { canonical: "/products" },
  openGraph: pageOpenGraph("/products"),
};

/** Cached for speed; admin edits refresh it at once via revalidateStorefront(). */
export const revalidate = 300;

export default async function ProductsIndexPage() {
  const products = await getStoreProducts();
  const catalogLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageCopy.products.title,
    url: absoluteUrl("/products"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/products/${p.handle}`),
        name: p.name,
      })),
    },
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { label: "Home", href: "/" },
            { label: pageCopy.products.title, href: "/products" },
          ]),
          catalogLd,
        ]}
      />
      <PageHero
        title={pageCopy.products.title}
        description={pageCopy.products.description}
        image={siteImages.shopHero}
        alt="Row of NS Perfume bottles in soft window light for shopping all fragrances"
        objectPosition="center 42%"
      />
      <section className="bg-canvas section-y">
        <ProductsCatalog products={products} />
      </section>
    </>
  );
}

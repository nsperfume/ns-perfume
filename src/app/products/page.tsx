import type { Metadata } from "next";
import { ProductsCatalog } from "@/components/commerce/products-catalog";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { getStoreProducts } from "@/lib/store-data";

export const metadata: Metadata = {
  title: "All perfumes",
  description: pageCopy.products.metaDescription,
  alternates: { canonical: "/products" },
};

/** Cached for speed; admin edits refresh it at once via revalidateStorefront(). */
export const revalidate = 300;

export default async function ProductsIndexPage() {
  const products = await getStoreProducts();

  return (
    <>
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

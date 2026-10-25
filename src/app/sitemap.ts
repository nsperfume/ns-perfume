import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import {
  getCollections,
  getJournalPosts,
  getStoreProducts,
} from "@/lib/store-data";

/** Rebuilt hourly so new products, collections and journal posts get listed. */
export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/products",
  "/collections",
  "/find-your-scent",
  "/journal",
  "/about",
  "/contact",
  "/faq",
  "/shipping-returns",
  "/track-order",
  "/policies/privacy",
  "/policies/terms",
  "/policies/refund",
  "/policies/shipping",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [products, collections, posts] = await Promise.all([
    getStoreProducts(),
    getCollections(),
    getJournalPosts(),
  ]);

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.5,
    })),
    ...collections.map((c) => ({
      url: `${base}/collections/${c.handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: `${base}/journal/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

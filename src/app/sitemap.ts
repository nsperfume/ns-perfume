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
  "/policies/privacy",
  "/policies/terms",
  "/policies/refund",
  "/policies/shipping",
];

const absolute = (base: string, src: string) =>
  /^https?:\/\//i.test(src) ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;

const iso = (v: unknown) => {
  const d = v ? new Date(v as string) : null;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
};

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
      lastModified: iso((c as { updatedAt?: unknown }).updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.handle}`,
      lastModified: iso(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.gallery.slice(0, 4).map((src) => absolute(base, src)),
    })),
    ...posts.map((post) => ({
      url: `${base}/journal/${post.slug}`,
      lastModified: iso(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

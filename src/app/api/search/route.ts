import { jsonOk } from "@/lib/api";
import { getCollections, getStoreProducts } from "@/lib/store-data";
import { toSearchProduct } from "@/lib/search";
import type { StoreProduct } from "@/lib/mappers";

/**
 * Lightweight catalog for storefront search (header sheet, /search, scent guide).
 * Only card and matching fields, cached and rebuilt at most every 5 minutes.
 * Admin edits clear it at once through revalidateStorefront().
 *
 * Errors are not caught on purpose: when a rebuild fails, Next keeps serving the
 * last good copy instead of caching an error.
 */
export const dynamic = "force-static";
export const revalidate = 300;

type CollectionRule = {
  handle?: unknown;
  productHandles?: unknown;
  filterTags?: unknown;
};

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.length > 0) : [];

/** Same membership rules as productsInCollectionQuery, applied in memory. */
function memberOf(p: StoreProduct, collection: CollectionRule): boolean {
  const handle = typeof collection.handle === "string" ? collection.handle : "";
  if (!handle) return false;
  if (p.collectionHandles.includes(handle)) return true;
  if (strings(collection.productHandles).includes(p.handle)) return true;
  return strings(collection.filterTags).some(
    (tag) =>
      p.tags.includes(tag) ||
      (tag.startsWith("badge:") &&
        p.badges.includes(tag.slice(6) as StoreProduct["badges"][number])),
  );
}

export async function GET() {
  const [products, collections] = await Promise.all([getStoreProducts(), getCollections()]);
  const rules = collections as CollectionRule[];
  const data = products.map((p) => {
    const handles = new Set(p.collectionHandles);
    for (const c of rules) {
      if (typeof c.handle === "string" && memberOf(p, c)) handles.add(c.handle);
    }
    return toSearchProduct(p, [...handles]);
  });
  return jsonOk(data);
}

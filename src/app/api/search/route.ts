import { jsonOk } from "@/lib/api";
import { getCollections, getStoreProducts } from "@/lib/store-data";
import { toSearchProduct } from "@/lib/search";
import { isInCollection } from "@/lib/collection-query";

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

export async function GET() {
  const [products, collections] = await Promise.all([getStoreProducts(), getCollections()]);
  const rules = collections as CollectionRule[];
  const data = products.map((p) => {
    const handles = new Set(p.collectionHandles);
    for (const c of rules) {
      if (typeof c.handle === "string" && isInCollection(p, c)) handles.add(c.handle);
    }
    return toSearchProduct(p, [...handles]);
  });
  return jsonOk(data);
}

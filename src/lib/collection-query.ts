/**
 * Mongo query: active products that belong to a collection.
 * A product is a member when any of these hold:
 * - its handle is in collection.productHandles (hand-picked)
 * - the collection handle is in product.collectionHandles (ticked on the product)
 * - it matches one of collection.filterTags (tags, or `badge:` → badges)
 * A collection with no rules and no members returns no products. It never
 * falls back to the whole catalog.
 */
export function productsInCollectionQuery(collection: {
  handle: string;
  productHandles?: string[] | null;
  filterTags?: string[] | null;
}): Record<string, unknown> {
  const or: Record<string, unknown>[] = [];

  if (collection.handle) {
    or.push({ collectionHandles: collection.handle });
  }

  const handles = (collection.productHandles || []).filter(Boolean);
  if (handles.length) {
    or.push({ handle: { $in: handles } });
  }

  const tags = (collection.filterTags || []).filter(Boolean);
  if (tags.length) {
    or.push({ tags: { $in: tags } });
    const badges = tags
      .filter((t) => t.startsWith("badge:"))
      .map((t) => t.replace("badge:", ""));
    if (badges.length) {
      or.push({ badges: { $in: badges } });
    }
  }

  // Matches nothing rather than everything when there is no rule at all.
  if (!or.length) return { _id: { $in: [] } };

  return { status: "active", $or: or };
}

type CollectionRules = {
  handle?: unknown;
  productHandles?: unknown;
  filterTags?: unknown;
};

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.length > 0) : [];

/** Same membership rules as productsInCollectionQuery, applied in memory. */
export function isInCollection(
  p: { handle: string; tags: string[]; badges: readonly string[]; collectionHandles?: string[] },
  collection: CollectionRules,
): boolean {
  const handle = typeof collection.handle === "string" ? collection.handle : "";
  if (!handle) return false;
  if ((p.collectionHandles || []).includes(handle)) return true;
  if (strings(collection.productHandles).includes(p.handle)) return true;
  return strings(collection.filterTags).some(
    (tag) => p.tags.includes(tag) || (tag.startsWith("badge:") && p.badges.includes(tag.slice(6))),
  );
}

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

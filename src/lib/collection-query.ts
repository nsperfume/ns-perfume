/**
 * Mongo query: active products that belong to a collection via
 * explicit product.collectionHandles, collection.productHandles, or filterTags.
 */
export function productsInCollectionQuery(collection: {
  handle: string;
  productHandles?: string[] | null;
  filterTags?: string[] | null;
}): Record<string, unknown> {
  const or: Record<string, unknown>[] = [
    { collectionHandles: collection.handle },
  ];

  if (collection.productHandles?.length) {
    or.push({ handle: { $in: collection.productHandles } });
  }

  if (collection.filterTags?.length) {
    or.push({ tags: { $in: collection.filterTags } });
    const badges = collection.filterTags
      .filter((t) => t.startsWith("badge:"))
      .map((t) => t.replace("badge:", ""));
    if (badges.length) {
      or.push({ badges: { $in: badges } });
    }
  }

  // No membership rules at all → catalog-wide (legacy empty collections).
  if (
    !collection.productHandles?.length &&
    !collection.filterTags?.length
  ) {
    return { status: "active" };
  }

  return { status: "active", $or: or };
}

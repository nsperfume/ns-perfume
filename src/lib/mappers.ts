/** Map DB product to storefront shape (prices still PKR in sizes). */
export type StoreProduct = {
  id: string;
  handle: string;
  name: string;
  descriptor: string;
  concentration: "EDP" | "EDT" | "PARFUM";
  family: string;
  gender: "her" | "him" | "unisex";
  prices: { ml: number; price: number; sku: string; compareAt?: number }[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  sillage: number;
  longevity: number;
  ingredients: string[];
  countryOfOrigin: string;
  story: string;
  howToWear: string;
  tags: string[];
  /** Collection handles this product is explicitly filed under. */
  collectionHandles: string[];
  badges: ("bestseller" | "new" | "limited" | "sale")[];
  imagePrimary: string;
  imageSecondary: string;
  gallery: string[];
  relatedHandles: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  status?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProduct(doc: any): StoreProduct {
  const sizes = doc.sizes || [];
  return {
    id: String(doc._id),
    handle: doc.handle,
    name: doc.name,
    descriptor: doc.descriptor || "",
    concentration: doc.concentration,
    family: doc.family,
    gender: doc.gender,
    prices: sizes.map(
      (s: { ml: number; pricePkr: number; sku: string; compareAtPkr?: number }) => ({
        ml: s.ml,
        price: s.pricePkr,
        sku: s.sku,
        compareAt: s.compareAtPkr,
      }),
    ),
    topNotes: doc.topNotes || [],
    heartNotes: doc.heartNotes || [],
    baseNotes: doc.baseNotes || [],
    sillage: doc.sillage ?? 3,
    longevity: doc.longevity ?? 3,
    ingredients: doc.ingredients || [],
    countryOfOrigin: doc.countryOfOrigin || "Pakistan",
    story: doc.story || "",
    howToWear: doc.howToWear || "",
    tags: doc.tags || [],
    collectionHandles: Array.isArray(doc.collectionHandles)
      ? doc.collectionHandles
      : [],
    badges: doc.badges || [],
    imagePrimary: doc.imagePrimary || "/products/placeholder-lifestyle.svg",
    imageSecondary: doc.imageSecondary || doc.imagePrimary || "/products/placeholder-lifestyle.svg",
    gallery:
      doc.gallery?.length > 0
        ? doc.gallery
        : [doc.imagePrimary || "/products/placeholder-lifestyle.svg"],
    relatedHandles: doc.relatedHandles || [],
    rating: doc.rating ?? 0,
    reviewCount: doc.reviewCount ?? 0,
    inStock: doc.inStock !== false,
    status: doc.status,
  };
}

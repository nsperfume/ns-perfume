import { richTextToPlain, sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";

/** Map DB product to storefront shape (prices still PKR in sizes). */
export type StoreProduct = {
  id: string;
  handle: string;
  name: string;
  descriptor: string;
  /** PDP product description (HTML or plain). */
  description: string;
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
  /** False when the formula has no alcohol carrier (oils, attars). */
  containsAlcohol: boolean;
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
    description: doc.description || "",
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
    containsAlcohol: doc.containsAlcohol !== false,
    countryOfOrigin: doc.countryOfOrigin || "Pakistan",
    story: doc.story || "",
    howToWear: doc.howToWear || "",
    tags: doc.tags || [],
    collectionHandles: Array.isArray(doc.collectionHandles)
      ? doc.collectionHandles
      : [],
    badges: doc.badges || [],
    imagePrimary:
      (Array.isArray(doc.gallery) && doc.gallery[0]) ||
      doc.imagePrimary ||
      "/products/placeholder-lifestyle.svg",
    imageSecondary:
      (Array.isArray(doc.gallery) && doc.gallery[1]) ||
      (Array.isArray(doc.gallery) && doc.gallery[0]) ||
      doc.imageSecondary ||
      doc.imagePrimary ||
      "/products/placeholder-lifestyle.svg",
    gallery: (() => {
      if (Array.isArray(doc.gallery) && doc.gallery.length > 0) {
        return doc.gallery.filter(Boolean);
      }
      return [
        doc.imagePrimary || "/products/placeholder-lifestyle.svg",
        doc.imageSecondary,
      ].filter(Boolean) as string[];
    })(),
    relatedHandles: doc.relatedHandles || [],
    rating: doc.rating ?? 0,
    reviewCount: doc.reviewCount ?? 0,
    inStock: doc.inStock !== false,
    status: doc.status,
  };
}

export type StoreJournalPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Sanitized HTML body for storefront render */
  bodyHtml: string;
  /** Legacy plain paragraphs (derived) */
  body: string[];
  date: string;
  readTime: string;
  category: string;
  relatedProductHandle: string;
  relatedCollectionHandle: string;
  imageUrl: string;
  imageTone: string;
  status: "published" | "draft";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapJournal(doc: any): StoreJournalPost {
  const bodyHtml = sanitizeRichHtml(toRichHtml(doc.body));
  const plain = richTextToPlain(bodyHtml);
  const body = plain
    ? plain
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return {
    id: String(doc._id ?? doc.id ?? doc.slug),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt || "",
    bodyHtml,
    body,
    date: doc.date || "",
    readTime: doc.readTime || "5 min",
    category: doc.category || "Guides",
    relatedProductHandle: doc.relatedProductHandle || "",
    relatedCollectionHandle: doc.relatedCollectionHandle || "",
    imageUrl: doc.imageUrl || "",
    imageTone: doc.imageTone || "#E8DFC8",
    status: doc.status === "draft" ? "draft" : "published",
  };
}

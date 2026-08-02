export type Concentration = "EDP" | "EDT" | "PARFUM";

export type ProductSize = {
  ml: number;
  price: number;
  sku: string;
};

export type Product = {
  handle: string;
  name: string;
  descriptor: string;
  concentration: Concentration;
  family: string;
  gender: "her" | "him" | "unisex";
  prices: ProductSize[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  sillage: number; // 1–5
  longevity: number; // 1–5
  ingredients: string[];
  countryOfOrigin: string;
  story: string;
  howToWear: string;
  tags: string[];
  badges: ("bestseller" | "new" | "limited" | "sale")[];
  imagePrimary: string;
  imageSecondary: string;
  gallery: string[];
  relatedHandles: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
  seoCopy: string;
  bannerTone: "canvas" | "deep";
  filterTags?: string[];
};

export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  date: string;
  readTime: string;
  relatedProductHandle?: string;
  relatedCollectionHandle?: string;
  imageTone: string;
};

export type CartLine = {
  productHandle: string;
  name: string;
  sizeMl: number;
  price: number;
  sku: string;
  quantity: number;
  image: string;
  /** Marked as a gift at add-to-bag time */
  isGift?: boolean;
  /** Optional note printed / included for the recipient */
  giftMessage?: string;
  /** Paid gift wrap was included in `price` */
  giftWrap?: boolean;
};

/** Fixed gift-wrap add-on in PKR (included in line price when selected). */
export const GIFT_WRAP_FEE_PKR = 800;

export type Review = {
  id: string;
  productHandle: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  date: string;
};

import { cache } from "react";
import { connectDB } from "@/lib/db";
import { mapJournal, mapProduct, type StoreProduct } from "@/lib/mappers";
import { ProductModel } from "@/models/Product";
import { CollectionModel } from "@/models/Collection";
import { TestimonialModel } from "@/models/Testimonial";
import { ReviewModel } from "@/models/Review";
import { JournalModel } from "@/models/Journal";
import { products as fallbackProducts } from "@/data/products";
import { collections as fallbackCollections } from "@/data/collections";
import { productsInCollectionQuery } from "@/lib/collection-query";
import { safeRichText } from "@/lib/rich-text";

/**
 * The built-in demo catalog (src/data) only stands in during local development.
 * In production a database error is rethrown so ISR keeps serving the last good
 * page, and an empty database shows an empty store, never invented products,
 * prices or customer quotes.
 */
const useDemoData = process.env.NODE_ENV !== "production";

function dbFailed(label: string, e: unknown) {
  if (!useDemoData) throw e;
  console.warn(`${label}: database unavailable, showing demo data.`, e);
}

function toPkrFallback(p: (typeof fallbackProducts)[0]): StoreProduct {
  return {
    ...p,
    id: p.handle,
    description: p.description || "",
    containsAlcohol: p.containsAlcohol !== false,
    seoTitle: "",
    seoDescription: "",
    collectionHandles: [],
    prices: p.prices.map((s) => ({
      ml: s.ml,
      price: Math.round(s.price * 280),
      sku: s.sku,
    })),
  };
}

/**
 * "Featured" order for the shop: bestsellers, then new, then the best rated,
 * then A to Z. Stable no matter which product was edited last.
 */
function featuredOrder(a: StoreProduct, b: StoreProduct) {
  const rank = (p: StoreProduct) =>
    p.badges.includes("bestseller") ? 0 : p.badges.includes("new") ? 1 : 2;
  return (
    rank(a) - rank(b) ||
    Number(b.inStock) - Number(a.inStock) ||
    b.rating - a.rating ||
    a.name.localeCompare(b.name)
  );
}

/** Active catalog in featured order. Deduplicated per request with React cache. */
export const getStoreProducts = cache(async (): Promise<StoreProduct[]> => {
  try {
    await connectDB();
    const docs = await ProductModel.find({ status: "active" }).lean();
    if (docs.length || !useDemoData) return docs.map(mapProduct).sort(featuredOrder);
  } catch (e) {
    dbFailed("getStoreProducts", e);
  }
  return fallbackProducts.map(toPkrFallback);
});

export const getStoreProduct = cache(async function getStoreProduct(
  handle: string,
): Promise<StoreProduct | null> {
  try {
    await connectDB();
    const doc = await ProductModel.findOne({ handle, status: "active" }).lean();
    if (doc || !useDemoData) return doc ? mapProduct(doc) : null;
  } catch (e) {
    dbFailed("getStoreProduct", e);
  }
  const fb = fallbackProducts.find((p) => p.handle === handle);
  return fb ? toPkrFallback(fb) : null;
});

export async function getBestsellers(): Promise<StoreProduct[]> {
  const all = await getStoreProducts();
  return all.filter((p) => p.badges.includes("bestseller"));
}

export async function getCollections() {
  try {
    await connectDB();
    const docs = await CollectionModel.find({ status: "active" })
      .sort({ sortOrder: 1 })
      .lean();
    if (docs.length || !useDemoData) return docs;
  } catch (e) {
    dbFailed("getCollections", e);
  }
  return fallbackCollections.map((c) => ({
    ...c,
    status: "active",
    productHandles: [],
    sortOrder: 0,
  }));
}

export const getCollectionWithProducts = cache(async function getCollectionWithProducts(handle: string) {
  try {
    await connectDB();
    const collection = await CollectionModel.findOne({
      handle,
      status: "active",
    }).lean();
    if (collection) {
      const docs = await ProductModel.find(
        productsInCollectionQuery(collection),
      ).lean();
      const products = docs.map(mapProduct).sort(featuredOrder);
      return { collection, products };
    }
    if (!useDemoData) return null;
  } catch (e) {
    dbFailed("getCollectionWithProducts", e);
  }

  const fb = fallbackCollections.find((c) => c.handle === handle);
  if (!fb) return null;
  const all = await getStoreProducts();
  let products = all;
  if (fb.filterTags?.length) {
    products = all.filter((p) =>
      fb.filterTags!.some(
        (tag) =>
          p.tags.includes(tag) ||
          p.badges.includes(
            tag.replace("badge:", "") as StoreProduct["badges"][number],
          ),
      ),
    );
  }
  return { collection: fb, products };
});

export async function getTestimonials() {
  try {
    await connectDB();
    const docs = await TestimonialModel.find({
      status: "published",
      featured: true,
    })
      .sort({ sortOrder: 1 })
      .lean();
    if (docs.length || !useDemoData) {
      return docs.map((d) => ({ ...d, quote: safeRichText(String(d.quote ?? "")) }));
    }
  } catch (e) {
    dbFailed("getTestimonials", e);
  }
  return [
    {
      author: "Ayesha Siddiqui",
      city: "Karachi",
      quote:
        "Amber Noir lasts through a full wedding mehndi without going heavy.",
      rating: 5,
      productName: "Amber Noir",
    },
    {
      author: "Hassan Malik",
      city: "Lahore",
      quote:
        "Cedar Rift is clean for the office and still present after Maghrib.",
      rating: 5,
      productName: "Cedar Rift",
    },
    {
      author: "Fatima Noor",
      city: "Islamabad",
      quote:
        "Iris Solstice sits soft on skin in AC and heat. Notes matched the page.",
      rating: 5,
      productName: "Iris Solstice",
    },
  ];
}

export async function getProductReviews(handle: string) {
  try {
    await connectDB();
    const docs = await ReviewModel.find({
      productHandle: handle,
      status: "published",
    })
      .sort({ createdAt: -1 })
      .lean();
    return docs;
  } catch (e) {
    dbFailed("getProductReviews", e);
  }
  return [];
}

export async function getJournalPosts() {
  try {
    await connectDB();
    const docs = await JournalModel.find({ status: "published" })
      .sort({ date: -1 })
      .lean();
    return docs.map(mapJournal);
  } catch (e) {
    dbFailed("getJournalPosts", e);
    return [];
  }
}

export async function getJournalPost(slug: string) {
  try {
    await connectDB();
    const doc = await JournalModel.findOne({
      slug,
      status: "published",
    }).lean();
    return doc ? mapJournal(doc) : null;
  } catch (e) {
    dbFailed("getJournalPost", e);
    return null;
  }
}

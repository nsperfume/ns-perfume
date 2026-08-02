import { connectDB } from "@/lib/db";
import { mapProduct, type StoreProduct } from "@/lib/mappers";
import { ProductModel } from "@/models/Product";
import { CollectionModel } from "@/models/Collection";
import { TestimonialModel } from "@/models/Testimonial";
import { ReviewModel } from "@/models/Review";
import { JournalModel } from "@/models/Journal";
import { products as fallbackProducts } from "@/data/products";
import { collections as fallbackCollections } from "@/data/collections";
import { journalPosts as fallbackJournal } from "@/data/journal";

function toPkrFallback(p: (typeof fallbackProducts)[0]): StoreProduct {
  return {
    ...p,
    id: p.handle,
    prices: p.prices.map((s) => ({
      ml: s.ml,
      price: Math.round(s.price * 280),
      sku: s.sku,
    })),
  };
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
  try {
    await connectDB();
    const docs = await ProductModel.find({ status: "active" })
      .sort({ updatedAt: -1 })
      .lean();
    if (docs.length) return docs.map(mapProduct);
  } catch (e) {
    console.error("getStoreProducts fallback", e);
  }
  return fallbackProducts.map(toPkrFallback);
}

export async function getStoreProduct(
  handle: string,
): Promise<StoreProduct | null> {
  try {
    await connectDB();
    const doc = await ProductModel.findOne({ handle, status: "active" }).lean();
    if (doc) return mapProduct(doc);
  } catch (e) {
    console.error("getStoreProduct fallback", e);
  }
  const fb = fallbackProducts.find((p) => p.handle === handle);
  return fb ? toPkrFallback(fb) : null;
}

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
    if (docs.length) return docs;
  } catch (e) {
    console.error("getCollections fallback", e);
  }
  return fallbackCollections.map((c) => ({
    ...c,
    status: "active",
    productHandles: [],
    sortOrder: 0,
  }));
}

export async function getCollectionWithProducts(handle: string) {
  try {
    await connectDB();
    const collection = await CollectionModel.findOne({
      handle,
      status: "active",
    }).lean();
    if (collection) {
      let products: StoreProduct[] = [];
      if (collection.productHandles?.length) {
        const docs = await ProductModel.find({
          handle: { $in: collection.productHandles },
          status: "active",
        }).lean();
        products = docs.map(mapProduct);
      } else if (collection.filterTags?.length) {
        const tags = collection.filterTags as string[];
        const docs = await ProductModel.find({
          status: "active",
          $or: [
            { tags: { $in: tags } },
            {
              badges: {
                $in: tags
                  .filter((t) => t.startsWith("badge:"))
                  .map((t) => t.replace("badge:", "")),
              },
            },
          ],
        }).lean();
        products = docs.map(mapProduct);
      } else {
        products = await getStoreProducts();
      }
      return { collection, products };
    }
  } catch (e) {
    console.error("getCollectionWithProducts fallback", e);
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
}

export async function getTestimonials() {
  try {
    await connectDB();
    const docs = await TestimonialModel.find({
      status: "published",
      featured: true,
    })
      .sort({ sortOrder: 1 })
      .lean();
    if (docs.length) return docs;
  } catch (e) {
    console.error("getTestimonials fallback", e);
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
    if (docs.length) return docs;
  } catch (e) {
    console.error("getProductReviews fallback", e);
  }
  return [];
}

export async function getJournalPosts() {
  try {
    await connectDB();
    const docs = await JournalModel.find({ status: "published" })
      .sort({ date: -1 })
      .lean();
    if (docs.length) return docs;
  } catch (e) {
    console.error("getJournalPosts fallback", e);
  }
  return fallbackJournal;
}

export async function getJournalPost(slug: string) {
  try {
    await connectDB();
    const doc = await JournalModel.findOne({ slug, status: "published" }).lean();
    if (doc) return doc;
  } catch (e) {
    console.error("getJournalPost fallback", e);
  }
  return fallbackJournal.find((p) => p.slug === slug) || null;
}

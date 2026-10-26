import { timingSafeEqual } from "node:crypto";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/auth";
import { revalidateStorefront } from "@/lib/revalidate";
import { ProductModel } from "@/models/Product";
import { CollectionModel } from "@/models/Collection";
import { TestimonialModel } from "@/models/Testimonial";
import { ReviewModel } from "@/models/Review";
import { JournalModel } from "@/models/Journal";
import {
  seedProducts,
  seedCollections,
  seedTestimonials,
  seedReviews,
  seedJournal,
} from "@/data/seed-catalog";


function hasSeedSecret(req: Request) {
  const secret = process.env.SEED_SECRET;
  const sent = req.headers.get("x-seed-secret");
  if (!secret || !sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Seeds the demo catalog.
 * - Empty catalog: super admin session or x-seed-secret.
 * - Replace (?force=1) wipes products, collections, testimonials and journal. It needs
 *   x-seed-secret and is refused in production unless ALLOW_DESTRUCTIVE_SEED=1.
 * - Customer reviews are never deleted.
 */
export async function POST(req: Request) {
  try {
    const secretOk = hasSeedSecret(req);
    if (!secretOk && !(await requireSuperAdmin())) {
      return jsonError("Unauthorized", 401);
    }

    await connectDB();
    const force = new URL(req.url).searchParams.get("force") === "1";
    const productCount = await ProductModel.countDocuments();

    if (productCount > 0 && !force) {
      return jsonError("Catalog already seeded. Use ?force=1 to replace.", 409);
    }

    if (productCount > 0 && force) {
      if (!secretOk) {
        return jsonError("Replacing the catalog requires the x-seed-secret header.", 403);
      }
      if (
        process.env.NODE_ENV === "production" &&
        process.env.ALLOW_DESTRUCTIVE_SEED !== "1"
      ) {
        return jsonError("Catalog replacement is disabled in production.", 403);
      }
      await Promise.all([
        ProductModel.deleteMany({}),
        CollectionModel.deleteMany({}),
        TestimonialModel.deleteMany({}),
        JournalModel.deleteMany({}),
      ]);
    }

    await ProductModel.insertMany(seedProducts);
    await CollectionModel.insertMany(seedCollections);
    await TestimonialModel.insertMany(seedTestimonials);
    const seedReviewsInserted = (await ReviewModel.countDocuments()) === 0;
    if (seedReviewsInserted) await ReviewModel.insertMany(seedReviews);
    await JournalModel.insertMany(seedJournal);

    revalidateStorefront();
    return jsonOk({
      message: "Database seeded",
      products: seedProducts.length,
      collections: seedCollections.length,
      testimonials: seedTestimonials.length,
      reviews: seedReviewsInserted ? seedReviews.length : 0,
      journal: seedJournal.length,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Seed failed", 500);
  }
}

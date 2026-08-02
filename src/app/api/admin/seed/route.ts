import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { ProductModel } from "@/models/Product";
import { CollectionModel } from "@/models/Collection";
import { TestimonialModel } from "@/models/Testimonial";
import { ReviewModel } from "@/models/Review";
import { JournalModel } from "@/models/Journal";
import { AdminUserModel } from "@/models/AdminUser";
import {
  seedProducts,
  seedCollections,
  seedTestimonials,
  seedReviews,
  seedJournal,
} from "@/data/seed-catalog";

async function ensureAdmin() {
  const email = (
    process.env.ADMIN_EMAIL || "admin@nsperfume.com"
  ).toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMeNSAdmin123!";
  const passwordHash = await hashPassword(password);

  const existing = await AdminUserModel.findOne({ email });
  if (!existing) {
    await AdminUserModel.create({
      email,
      name: "Store Owner",
      passwordHash,
      role: "owner",
    });
    return { email, created: true };
  }

  existing.passwordHash = passwordHash;
  existing.name = existing.name || "Store Owner";
  await existing.save();
  return { email, created: false };
}

function allowSeedSecret(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) return false;
  return req.headers.get("x-seed-secret") === secret;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const force = new URL(req.url).searchParams.get("force") === "1";
    const productCount = await ProductModel.countDocuments();
    const hasSeedSecret = allowSeedSecret(req);

    if (productCount > 0 && !force && !hasSeedSecret) {
      const admin = await requireAdmin();
      if (!admin) {
        return jsonError(
          "Unauthorized — login, or POST with ?force=1 after login, or send x-seed-secret",
          401,
        );
      }
    }

    if ((productCount > 0 && force) || hasSeedSecret) {
      if (!hasSeedSecret) {
        const admin = await requireAdmin();
        if (!admin) return jsonError("Unauthorized", 401);
      }
      await Promise.all([
        ProductModel.deleteMany({}),
        CollectionModel.deleteMany({}),
        TestimonialModel.deleteMany({}),
        ReviewModel.deleteMany({}),
        JournalModel.deleteMany({}),
      ]);
    } else if (productCount > 0) {
      return jsonError("Catalog already seeded. Use ?force=1 to replace.", 409);
    }

    const admin = await ensureAdmin();

    await ProductModel.insertMany(seedProducts);
    await CollectionModel.insertMany(seedCollections);
    await TestimonialModel.insertMany(seedTestimonials);
    await ReviewModel.insertMany(seedReviews);
    await JournalModel.insertMany(seedJournal);

    return jsonOk({
      message: "Database seeded",
      products: seedProducts.length,
      collections: seedCollections.length,
      testimonials: seedTestimonials.length,
      reviews: seedReviews.length,
      journal: seedJournal.length,
      adminEmail: admin.email,
      adminCreated: admin.created,
      adminPasswordSynced: true,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Seed failed", 500, String(e));
  }
}

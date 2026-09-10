import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ReviewModel } from "@/models/Review";
import { ProductModel } from "@/models/Product";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productHandle = searchParams.get("product");
    const all = searchParams.get("all") === "1";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = all ? {} : { status: "published" };
    if (productHandle) filter.productHandle = productHandle;
    const docs = await ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return jsonOk(docs);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load reviews", 500);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const admin = await requireAdmin();

    const productHandle = String(body.productHandle || "").trim();
    const author = String(body.author || "").trim();
    const reviewBody = String(body.body || "").trim();
    const rating = Number(body.rating);
    const city = String(body.city || "").trim().slice(0, 80);
    const title = String(body.title || "").trim().slice(0, 120);

    if (!productHandle || !author || !reviewBody || !rating) {
      return jsonError("productHandle, author, body, rating required");
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return jsonError("Rating must be between 1 and 5");
    }
    if (reviewBody.length < 20) {
      return jsonError("Review is too short");
    }

    const product = await ProductModel.findOne({ handle: productHandle })
      .select("_id")
      .lean();
    if (!product) return jsonError("Product not found", 404);

    const created = await ReviewModel.create({
      productHandle,
      author: author.slice(0, 80),
      city,
      title,
      body: reviewBody.slice(0, 4000),
      rating: Math.round(rating),
      verified: false,
      status: admin ? (body.status === "published" ? "published" : "pending") : "pending",
    });

    if (created.status === "published") {
      await recomputeProductRating(productHandle);
    }
    return jsonOk(
      {
        id: created._id,
        status: created.status,
        message:
          created.status === "pending"
            ? "Review submitted for moderation"
            : "Review published",
      },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create review", 500);
  }
}

export async function recomputeProductRating(handle: string) {
  const published = await ReviewModel.find({
    productHandle: handle,
    status: "published",
  }).lean();
  if (!published.length) {
    await ProductModel.updateOne(
      { handle },
      { rating: 0, reviewCount: 0 },
    );
    return;
  }
  const avg =
    published.reduce((s, r) => s + (r.rating || 0), 0) / published.length;
  await ProductModel.updateOne(
    { handle },
    {
      rating: Math.round(avg * 10) / 10,
      reviewCount: published.length,
    },
  );
}

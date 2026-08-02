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
    // Public can submit as pending; admin publishes immediately
    if (!body.productHandle || !body.author || !body.body || !body.rating) {
      return jsonError("productHandle, author, body, rating required");
    }
    const created = await ReviewModel.create({
      ...body,
      status: admin ? body.status || "published" : "pending",
    });

    if (created.status === "published") {
      await recomputeProductRating(body.productHandle);
    }
    return jsonOk(created, { status: 201 });
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

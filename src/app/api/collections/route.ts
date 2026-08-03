import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { CollectionModel } from "@/models/Collection";
import { ProductModel } from "@/models/Product";
import { mapProduct } from "@/lib/mappers";
import { productsInCollectionQuery } from "@/lib/collection-query";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";
    if (all) {
      const admin = await requireAdmin();
      if (!admin) return jsonError("Unauthorized", 401);
      const docs = await CollectionModel.find()
        .sort({ sortOrder: 1, title: 1 })
        .lean();
      return jsonOk(docs);
    }
    const docs = await CollectionModel.find({ status: "active" })
      .sort({ sortOrder: 1, title: 1 })
      .lean();
    return jsonOk(docs);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load collections", 500);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const body = await req.json();
    const title = String(body.title || "").trim();
    let handle = String(body.handle || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!title) return jsonError("Title is required");
    if (!handle) return jsonError("Handle is required");
    if (handle.length < 2) return jsonError("Handle is too short");
    const status =
      body.status === "draft" || body.status === "active"
        ? body.status
        : "draft";
    const created = await CollectionModel.create({
      handle,
      title,
      description: String(body.description || "").trim(),
      seoCopy: String(body.seoCopy || "").trim(),
      bannerImage: String(body.bannerImage || body.image || "").trim(),
      filterTags: Array.isArray(body.filterTags) ? body.filterTags : [],
      productHandles: Array.isArray(body.productHandles)
        ? body.productHandles
        : [],
      sortOrder: Number(body.sortOrder) || 0,
      status,
      bannerTone: body.bannerTone === "deep" ? "deep" : "canvas",
    });
    return jsonOk(created, { status: 201 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error && "code" in e && (e as { code?: number }).code === 11000
      ? "A collection with this handle already exists"
      : "Failed to create collection";
    return jsonError(msg, 500);
  }
}

export async function resolveCollectionProducts(handle: string) {
  const collection = await CollectionModel.findOne({
    handle,
    status: "active",
  }).lean();
  if (!collection) return null;

  const products = await ProductModel.find(
    productsInCollectionQuery(collection),
  ).lean();

  return {
    collection,
    products: products.map(mapProduct),
  };
}

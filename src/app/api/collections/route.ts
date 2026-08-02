import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { CollectionModel } from "@/models/Collection";
import { ProductModel } from "@/models/Product";
import { mapProduct } from "@/lib/mappers";

export async function GET() {
  try {
    await connectDB();
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
    if (!body.handle || !body.title) return jsonError("handle and title required");
    const created = await CollectionModel.create(body);
    return jsonOk(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create collection", 500);
  }
}

export async function resolveCollectionProducts(handle: string) {
  const collection = await CollectionModel.findOne({
    handle,
    status: "active",
  }).lean();
  if (!collection) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  if (collection.productHandles?.length) {
    products = await ProductModel.find({
      handle: { $in: collection.productHandles },
      status: "active",
    }).lean();
  } else if (collection.filterTags?.length) {
    products = await ProductModel.find({
      status: "active",
      $or: [
        { tags: { $in: collection.filterTags } },
        {
          badges: {
            $in: collection.filterTags
              .filter((t: string) => t.startsWith("badge:"))
              .map((t: string) => t.replace("badge:", "")),
          },
        },
      ],
    }).lean();
  } else {
    products = await ProductModel.find({ status: "active" }).lean();
  }

  return {
    collection,
    products: products.map(mapProduct),
  };
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { mapProduct } from "@/lib/mappers";
import { ProductModel } from "@/models/Product";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status") || "active";
    const tag = searchParams.get("tag");
    const all = searchParams.get("all") === "1";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (!all) filter.status = status;
    if (tag) filter.tags = tag;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { descriptor: { $regex: q, $options: "i" } },
        { handle: { $regex: q, $options: "i" } },
        { "topNotes": { $regex: q, $options: "i" } },
        { "heartNotes": { $regex: q, $options: "i" } },
        { "baseNotes": { $regex: q, $options: "i" } },
      ];
    }

    const docs = await ProductModel.find(filter).sort({ updatedAt: -1 }).lean();
    return jsonOk(docs.map(mapProduct));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load products", 500);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const body = await req.json();
    if (!body.handle || !body.name) {
      return jsonError("handle and name are required");
    }
    const created = await ProductModel.create(body);
    return jsonOk(mapProduct(created.toObject()), { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create product", 500, String(e));
  }
}

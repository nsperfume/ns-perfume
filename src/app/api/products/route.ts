import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { mapProduct } from "@/lib/mappers";
import { ProductModel } from "@/models/Product";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().slice(0, 80);
    const tag = searchParams.get("tag");
    const wantsHidden =
      searchParams.get("all") === "1" ||
      (searchParams.has("status") && searchParams.get("status") !== "active");
    // Drafts and archived products are admin-only.
    const isAdmin = wantsHidden ? Boolean(await requireAdmin()) : false;
    const all = isAdmin && searchParams.get("all") === "1";
    const status = isAdmin ? searchParams.get("status") || "active" : "active";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (!all) filter.status = status;
    if (tag) filter.tags = tag;
    if (q) {
      const pattern = { $regex: escapeRegex(q), $options: "i" };
      filter.$or = [
        { name: pattern },
        { descriptor: pattern },
        { handle: pattern },
        { topNotes: pattern },
        { heartNotes: pattern },
        { baseNotes: pattern },
      ];
    }

    const docs = await ProductModel.find(filter)
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();
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
    return jsonError("Failed to create product", 500);
  }
}

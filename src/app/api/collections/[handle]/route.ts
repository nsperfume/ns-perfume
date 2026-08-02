import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { CollectionModel } from "@/models/Collection";
import { resolveCollectionProducts } from "@/app/api/collections/route";

type Ctx = { params: Promise<{ handle: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await connectDB();
    const { handle } = await ctx.params;
    const data = await resolveCollectionProducts(handle);
    if (!data) return jsonError("Collection not found", 404);
    return jsonOk(data);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load collection", 500);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { handle } = await ctx.params;
    const body = await req.json();
    const doc = await CollectionModel.findOneAndUpdate({ handle }, body, {
      new: true,
    }).lean();
    if (!doc) return jsonError("Not found", 404);
    return jsonOk(doc);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update collection", 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { handle } = await ctx.params;
    await CollectionModel.findOneAndDelete({ handle });
    return jsonOk({ handle });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete", 500);
  }
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { CollectionModel } from "@/models/Collection";
import { ProductModel } from "@/models/Product";
import { resolveCollectionProducts } from "@/app/api/collections/route";

type Ctx = { params: Promise<{ handle: string }> };

function stringList(value: unknown) {
  if (!Array.isArray(value)) return null;
  return Array.from(
    new Set(value.map((v) => String(v || "").trim()).filter(Boolean)),
  );
}

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
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid payload", 400);
    }

    // Whitelist editable fields. The handle (URL) stays fixed after create.
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) {
      const title = String(body.title || "").trim();
      if (title.length < 2) return jsonError("Title is required");
      updates.title = title;
    }
    if (body.description !== undefined)
      updates.description = String(body.description || "").trim();
    if (body.seoCopy !== undefined)
      updates.seoCopy = String(body.seoCopy || "").trim();
    if (body.bannerImage !== undefined || body.image !== undefined)
      updates.bannerImage = String(body.bannerImage ?? body.image ?? "").trim();
    if (body.status !== undefined) {
      if (body.status !== "active" && body.status !== "draft") {
        return jsonError("Status must be active or draft");
      }
      updates.status = body.status;
    }
    if (body.bannerTone !== undefined)
      updates.bannerTone = body.bannerTone === "deep" ? "deep" : "canvas";
    if (body.sortOrder !== undefined)
      updates.sortOrder = Number(body.sortOrder) || 0;
    const productHandles = stringList(body.productHandles);
    if (productHandles) updates.productHandles = productHandles;
    const filterTags = stringList(body.filterTags);
    if (filterTags) updates.filterTags = filterTags;

    const doc = await CollectionModel.findOneAndUpdate({ handle }, updates, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!doc) return jsonError("Collection not found", 404);
    return jsonOk(doc);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update collection", 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return jsonError("Forbidden", 403);
    await connectDB();
    const { handle } = await ctx.params;
    const doc = await CollectionModel.findOneAndDelete({ handle }).lean();
    if (!doc) return jsonError("Collection not found", 404);
    // Drop the dangling membership so products don't point at a dead collection.
    await ProductModel.updateMany(
      { collectionHandles: handle },
      { $pull: { collectionHandles: handle } },
    );
    return jsonOk({ handle });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete collection", 500);
  }
}

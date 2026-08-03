import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { ReviewModel } from "@/models/Review";
import { recomputeProductRating } from "@/app/api/reviews/route";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json();
    const doc = await ReviewModel.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!doc) return jsonError("Not found", 404);
    await recomputeProductRating(doc.productHandle);
    return jsonOk(doc);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update", 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return jsonError("Forbidden", 403);
    await connectDB();
    const { id } = await ctx.params;
    const doc = await ReviewModel.findByIdAndDelete(id);
    if (doc) await recomputeProductRating(doc.productHandle);
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete", 500);
  }
}

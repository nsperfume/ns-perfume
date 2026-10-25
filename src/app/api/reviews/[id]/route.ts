import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { ReviewModel } from "@/models/Review";
import { recomputeProductRating } from "@/app/api/reviews/route";
import { revalidateStorefront } from "@/lib/revalidate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid payload", 400);
    }
    // Moderation fields only; author content and product link stay as written.
    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!["published", "pending", "hidden"].includes(body.status)) {
        return jsonError("Status must be published, pending, or hidden", 400);
      }
      updates.status = body.status;
    }
    if (typeof body.verified === "boolean") updates.verified = body.verified;
    if (!Object.keys(updates).length) {
      return jsonError("Nothing to update", 400);
    }
    const doc = await ReviewModel.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!doc) return jsonError("Not found", 404);
    await recomputeProductRating(doc.productHandle);
    revalidateStorefront();
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
    if (!doc) return jsonError("Review not found", 404);
    await recomputeProductRating(doc.productHandle);
    revalidateStorefront();
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete", 500);
  }
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/auth";
import { CouponModel } from "@/models/Coupon";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError("Forbidden", 403);
  try {
    const { id } = await ctx.params;
    await connectDB();
    const doc = await CouponModel.findByIdAndDelete(id).lean();
    if (!doc) return jsonError("Coupon not found", 404);
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete coupon", 500);
  }
}

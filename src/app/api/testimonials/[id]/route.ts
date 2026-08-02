import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { TestimonialModel } from "@/models/Testimonial";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json();
    const doc = await TestimonialModel.findByIdAndUpdate(id, body, {
      new: true,
    }).lean();
    if (!doc) return jsonError("Not found", 404);
    return jsonOk(doc);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update", 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { id } = await ctx.params;
    await TestimonialModel.findByIdAndDelete(id);
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete", 500);
  }
}

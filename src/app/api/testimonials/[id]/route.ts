import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSuperAdmin, requireAdminWrite, adminDenied } from "@/lib/auth";
import { TestimonialModel } from "@/models/Testimonial";
import { testimonialSchema, validationError } from "@/lib/validation/catalog";
import { revalidateStorefront } from "@/lib/revalidate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdminWrite();
    if (!admin) return adminDenied();
    await connectDB();
    const { id } = await ctx.params;
    const parsed = testimonialSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const doc = await TestimonialModel.findByIdAndUpdate(id, { $set: parsed.data }, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!doc) return jsonError("Not found", 404);
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
    if (!admin) return adminDenied();
    await connectDB();
    const { id } = await ctx.params;
    const doc = await TestimonialModel.findByIdAndDelete(id).lean();
    if (!doc) return jsonError("Testimonial not found", 404);
    revalidateStorefront();
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete", 500);
  }
}

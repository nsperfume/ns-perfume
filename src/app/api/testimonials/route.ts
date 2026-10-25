import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { TestimonialModel } from "@/models/Testimonial";
import { testimonialSchema, validationError } from "@/lib/validation/catalog";
import { revalidateStorefront } from "@/lib/revalidate";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    // Draft testimonials are admin-only.
    const all = searchParams.get("all") === "1" && Boolean(await requireAdmin());
    const filter = all ? {} : { status: "published", featured: true };
    const docs = await TestimonialModel.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return jsonOk(docs);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load testimonials", 500);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const parsed = testimonialSchema
      .required({ author: true, quote: true })
      .safeParse(await req.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const created = await TestimonialModel.create(parsed.data);
    revalidateStorefront();
    return jsonOk(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create testimonial", 500);
  }
}

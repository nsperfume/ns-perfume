import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { mapJournal } from "@/lib/mappers";
import { sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";
import { JournalModel } from "@/models/Journal";
import slugify from "slugify";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json();

    const title = String(body.title || "").trim();
    if (!title) return jsonError("Title is required", 400);

    const slug = String(
      body.slug ||
        slugify(title, { lower: true, strict: true, trim: true }),
    ).trim();

    const clash = await JournalModel.findOne({
      slug,
      _id: { $ne: id },
    }).lean();
    if (clash) return jsonError("A post with this slug already exists", 409);

    const doc = await JournalModel.findByIdAndUpdate(
      id,
      {
        slug,
        title,
        excerpt: String(body.excerpt || "").trim(),
        body: sanitizeRichHtml(toRichHtml(body.body)),
        date: String(body.date || "").trim(),
        readTime: String(body.readTime || "5 min").trim(),
        category: String(body.category || "Guides").trim(),
        relatedProductHandle: String(body.relatedProductHandle || "").trim(),
        relatedCollectionHandle: String(
          body.relatedCollectionHandle || "",
        ).trim(),
        imageUrl: String(body.imageUrl || "").trim(),
        imageTone: String(body.imageTone || "#E8DFC8").trim(),
        status: body.status === "draft" ? "draft" : "published",
      },
      { new: true },
    ).lean();

    if (!doc) return jsonError("Not found", 404);
    return jsonOk(mapJournal(doc));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update journal post", 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return jsonError("Forbidden", 403);
    await connectDB();
    const { id } = await ctx.params;
    await JournalModel.findByIdAndDelete(id);
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete journal post", 500);
  }
}

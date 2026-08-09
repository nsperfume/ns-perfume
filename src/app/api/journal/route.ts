import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { mapJournal } from "@/lib/mappers";
import { sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";
import { JournalModel } from "@/models/Journal";
import slugify from "slugify";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";
    if (all) {
      const admin = await requireAdmin();
      if (!admin) return jsonError("Unauthorized", 401);
    }
    const filter = all ? {} : { status: "published" };
    const docs = await JournalModel.find(filter).sort({ date: -1 }).lean();
    return jsonOk(docs.map(mapJournal));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load journal", 500);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) return jsonError("Title is required", 400);

    const slug = String(
      body.slug ||
        slugify(title, { lower: true, strict: true, trim: true }),
    ).trim();
    if (!slug) return jsonError("Slug is required", 400);

    const exists = await JournalModel.findOne({ slug }).lean();
    if (exists) return jsonError("A post with this slug already exists", 409);

    const created = await JournalModel.create({
      slug,
      title,
      excerpt: String(body.excerpt || "").trim(),
      body: sanitizeRichHtml(toRichHtml(body.body)),
      date: String(body.date || new Date().toISOString().slice(0, 10)),
      readTime: String(body.readTime || "5 min").trim(),
      category: String(body.category || "Guides").trim(),
      relatedProductHandle: String(body.relatedProductHandle || "").trim(),
      relatedCollectionHandle: String(
        body.relatedCollectionHandle || "",
      ).trim(),
      imageUrl: String(body.imageUrl || "").trim(),
      imageTone: String(body.imageTone || "#E8DFC8").trim(),
      status: body.status === "draft" ? "draft" : "published",
    });

    return jsonOk(mapJournal(created.toObject()), { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create journal post", 500);
  }
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSuperAdmin, requireAdminWrite, adminDenied } from "@/lib/auth";
import { mapJournal } from "@/lib/mappers";
import { sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";
import { JournalModel } from "@/models/Journal";
import slugify from "slugify";
import { revalidateStorefront } from "@/lib/revalidate";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdminWrite();
    if (!admin) return adminDenied();
    await connectDB();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid payload", 400);
    }

    // Partial update: only fields the client sends are changed.
    const updates: Record<string, unknown> = {};
    const text = (v: unknown) => String(v ?? "").trim();

    if (body.title !== undefined) {
      const title = text(body.title);
      if (!title) return jsonError("Title is required", 400);
      updates.title = title;
    }

    if (body.slug !== undefined) {
      const slug =
        text(body.slug) ||
        (typeof updates.title === "string"
          ? slugify(updates.title, { lower: true, strict: true, trim: true })
          : "");
      if (!slug) return jsonError("Slug is required", 400);
      const clash = await JournalModel.findOne({
        slug,
        _id: { $ne: id },
      }).lean();
      if (clash) return jsonError("A post with this slug already exists", 409);
      updates.slug = slug;
    }

    // Keep the existing date unless a non-empty one is sent.
    if (typeof body.date === "string" && body.date.trim()) {
      updates.date = body.date.trim();
    }
    if (body.excerpt !== undefined) updates.excerpt = text(body.excerpt);
    if (body.body !== undefined) {
      updates.body = sanitizeRichHtml(toRichHtml(body.body));
    }
    if (body.readTime !== undefined)
      updates.readTime = text(body.readTime) || "5 min";
    if (body.category !== undefined)
      updates.category = text(body.category) || "Guides";
    if (body.relatedProductHandle !== undefined)
      updates.relatedProductHandle = text(body.relatedProductHandle);
    if (body.relatedCollectionHandle !== undefined)
      updates.relatedCollectionHandle = text(body.relatedCollectionHandle);
    if (body.imageUrl !== undefined) updates.imageUrl = text(body.imageUrl);
    if (body.imageTone !== undefined)
      updates.imageTone = text(body.imageTone) || "#E8DFC8";
    if (body.status !== undefined)
      updates.status = body.status === "draft" ? "draft" : "published";

    const doc = await JournalModel.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
    }).lean();

    if (!doc) return jsonError("Not found", 404);
    revalidateStorefront();
    return jsonOk(mapJournal(doc));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update journal post", 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return adminDenied();
    await connectDB();
    const { id } = await ctx.params;
    const doc = await JournalModel.findByIdAndDelete(id).lean();
    if (!doc) return jsonError("Journal post not found", 404);
    revalidateStorefront();
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete journal post", 500);
  }
}

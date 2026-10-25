import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { mapProduct } from "@/lib/mappers";
import { ProductModel } from "@/models/Product";
import { isDuplicateKey, productUpdateSchema, validationError } from "@/lib/validation/catalog";
import { revalidateStorefront } from "@/lib/revalidate";

type Ctx = { params: Promise<{ handle: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await connectDB();
    const { handle } = await ctx.params;
    const doc = await ProductModel.findOne({ handle }).lean<{ status?: string }>();
    if (!doc) return jsonError("Product not found", 404);
    // Unpublished products are visible to admins only.
    if (doc.status !== "active" && !(await requireAdmin())) {
      return jsonError("Product not found", 404);
    }
    return jsonOk(mapProduct(doc as Parameters<typeof mapProduct>[0]));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load product", 500);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { handle } = await ctx.params;
    const parsed = productUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const update = parsed.data;

    const current = await ProductModel.findOne({ handle }).select("status imagePrimary").lean<{ status?: string; imagePrimary?: string }>();
    if (!current) return jsonError("Product not found", 404);
    const status = update.status ?? current.status;
    const image = update.imagePrimary ?? current.imagePrimary;
    if (status === "active" && !image) {
      return jsonError("Add a main image before publishing", 400, { fieldErrors: { imagePrimary: "Add a main image before publishing" } });
    }

    const doc = await ProductModel.findOneAndUpdate({ handle }, { $set: update }, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!doc) return jsonError("Product not found", 404);
    revalidateStorefront();
    return jsonOk(mapProduct(doc));
  } catch (e) {
    if (isDuplicateKey(e)) {
      return jsonError("Another product already uses this URL. Change the name or URL.", 409, {
        fieldErrors: { handle: "Already in use" },
      });
    }
    console.error(e);
    return jsonError("Failed to update product", 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return jsonError("Forbidden", 403);
    await connectDB();
    const { handle } = await ctx.params;
    const doc = await ProductModel.findOneAndDelete({ handle }).lean();
    if (!doc) return jsonError("Product not found", 404);
    revalidateStorefront();
    return jsonOk({ handle });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete product", 500);
  }
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { mapProduct } from "@/lib/mappers";
import { ProductModel } from "@/models/Product";

type Ctx = { params: Promise<{ handle: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await connectDB();
    const { handle } = await ctx.params;
    const doc = await ProductModel.findOne({ handle }).lean();
    if (!doc) return jsonError("Product not found", 404);
    return jsonOk(mapProduct(doc));
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
    const body = await req.json();
    const doc = await ProductModel.findOneAndUpdate({ handle }, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) return jsonError("Product not found", 404);
    return jsonOk(mapProduct(doc));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update product", 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const { handle } = await ctx.params;
    const doc = await ProductModel.findOneAndDelete({ handle }).lean();
    if (!doc) return jsonError("Product not found", 404);
    return jsonOk({ handle });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to delete product", 500);
  }
}

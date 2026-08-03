import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { CouponModel } from "@/models/Coupon";
import { ensureDefaultCoupons } from "@/lib/coupons";

function mapCoupon(doc: {
  _id: unknown;
  code: string;
  label?: string;
  type: string;
  value: number;
  active?: boolean;
  minSubtotalPkr?: number;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  usedCount?: number;
  posterBgMode?: string;
  posterBgColor?: string;
  posterImageUrl?: string;
  posterHeadline?: string;
  posterSubcopy?: string;
}) {
  return {
    id: String(doc._id),
    code: doc.code,
    label: doc.label || "",
    type: doc.type,
    value: doc.value,
    active: doc.active !== false,
    minSubtotalPkr: doc.minSubtotalPkr || 0,
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
    usageLimit:
      typeof doc.usageLimit === "number" && doc.usageLimit > 0
        ? doc.usageLimit
        : null,
    usedCount: doc.usedCount || 0,
    posterBgMode: doc.posterBgMode === "image" ? "image" : "color",
    posterBgColor: doc.posterBgColor || "#1c1917",
    posterImageUrl: doc.posterImageUrl || "",
    posterHeadline: doc.posterHeadline || "",
    posterSubcopy: doc.posterSubcopy || "",
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Unauthorized", 401);
  await connectDB();
  await ensureDefaultCoupons();
  const docs = await CouponModel.find().sort({ createdAt: -1 }).lean();
  return jsonOk(docs.map(mapCoupon));
}

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .transform((s) => s.toUpperCase().replace(/\s+/g, "")),
  label: z.string().trim().max(80).optional().default(""),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().min(0).max(1000000).optional().default(0),
  active: z.boolean().optional().default(true),
  minSubtotalPkr: z.number().min(0).optional().default(0),
  usageLimit: z
    .union([z.number().int().positive(), z.null()])
    .optional()
    .default(null),
  expiresAt: z.union([z.string(), z.null()]).optional().default(null),
  posterBgMode: z.enum(["color", "image"]).optional().default("color"),
  posterBgColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/)
    .optional()
    .default("#1c1917"),
  posterImageUrl: z.string().trim().max(800).optional().default(""),
  posterHeadline: z.string().trim().max(80).optional().default(""),
  posterSubcopy: z.string().trim().max(160).optional().default(""),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Unauthorized", 401);
  try {
    await connectDB();
    const raw = await req.json();
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError("Invalid coupon", 400, parsed.error.flatten());
    }
    const data = parsed.data;
    if (data.type === "percent" && (data.value < 1 || data.value > 100)) {
      return jsonError("Percent discounts must be between 1 and 100", 400);
    }
    if (data.type === "fixed" && data.value < 1) {
      return jsonError("Fixed discount must be at least 1 PKR", 400);
    }
    if (data.type === "free_shipping") data.value = 0;
    if (data.posterBgMode === "image" && !data.posterImageUrl) {
      // allow save without image yet; studio can assign later
    }

    const exists = await CouponModel.findOne({ code: data.code });
    if (exists) return jsonError("That code already exists", 409);

    const doc = await CouponModel.create({
      code: data.code,
      label: data.label || data.code,
      type: data.type,
      value: data.value,
      active: data.active,
      minSubtotalPkr: data.minSubtotalPkr,
      usageLimit: data.usageLimit ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      usedCount: 0,
      posterBgMode: data.posterBgMode,
      posterBgColor: data.posterBgColor,
      posterImageUrl: data.posterImageUrl,
      posterHeadline: data.posterHeadline,
      posterSubcopy: data.posterSubcopy,
    });
    return jsonOk(mapCoupon(doc));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create coupon", 500);
  }
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Unauthorized", 401);
  try {
    await connectDB();
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return jsonError("Missing coupon id", 400);
    const updates: Record<string, unknown> = {};
    if (typeof body.label === "string") updates.label = body.label.trim();
    if (typeof body.active === "boolean") updates.active = body.active;
    if (typeof body.value === "number") updates.value = body.value;
    if (typeof body.minSubtotalPkr === "number")
      updates.minSubtotalPkr = body.minSubtotalPkr;
    if (body.usageLimit === null) updates.usageLimit = null;
    else if (typeof body.usageLimit === "number" && body.usageLimit > 0)
      updates.usageLimit = Math.floor(body.usageLimit);
    if (body.expiresAt === null) updates.expiresAt = null;
    else if (typeof body.expiresAt === "string" && body.expiresAt)
      updates.expiresAt = new Date(body.expiresAt);
    if (typeof body.type === "string") updates.type = body.type;
    if (body.posterBgMode === "color" || body.posterBgMode === "image")
      updates.posterBgMode = body.posterBgMode;
    if (
      typeof body.posterBgColor === "string" &&
      /^#([0-9a-fA-F]{6})$/.test(body.posterBgColor)
    ) {
      updates.posterBgColor = body.posterBgColor;
    }
    if (typeof body.posterImageUrl === "string")
      updates.posterImageUrl = body.posterImageUrl.trim().slice(0, 800);
    if (typeof body.posterHeadline === "string")
      updates.posterHeadline = body.posterHeadline.trim().slice(0, 80);
    if (typeof body.posterSubcopy === "string")
      updates.posterSubcopy = body.posterSubcopy.trim().slice(0, 160);

    const doc = await CouponModel.findByIdAndUpdate(id, updates, {
      new: true,
    }).lean();
    if (!doc) return jsonError("Coupon not found", 404);
    return jsonOk(mapCoupon(doc));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update coupon", 500);
  }
}

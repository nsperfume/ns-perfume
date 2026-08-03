import { Schema, models, model } from "mongoose";

/**
 * Coupons applied at checkout (amounts in PKR base).
 * type free_shipping zeros standard shipping when code is active.
 */
const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    label: { type: String, default: "" },
    type: {
      type: String,
      enum: ["percent", "fixed", "free_shipping"],
      required: true,
    },
    /** percent: 1-100, fixed: PKR off, free_shipping: ignored */
    value: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    minSubtotalPkr: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    /** null / undefined = unlimited redemptions */
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    /** Ad poster settings (marketing) */
    posterBgMode: {
      type: String,
      enum: ["color", "image"],
      default: "color",
    },
    posterBgColor: { type: String, default: "#1c1917" },
    posterImageUrl: { type: String, default: "" },
    posterHeadline: { type: String, default: "" },
    posterSubcopy: { type: String, default: "" },
  },
  { timestamps: true },
);

export type CouponDoc = {
  _id: string;
  code: string;
  label: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  active: boolean;
  minSubtotalPkr: number;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  usedCount: number;
  posterBgMode?: "color" | "image";
  posterBgColor?: string;
  posterImageUrl?: string;
  posterHeadline?: string;
  posterSubcopy?: string;
};

export const CouponModel = models.Coupon || model("Coupon", CouponSchema);

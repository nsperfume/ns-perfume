import mongoose, { Schema, models, model } from "mongoose";

const SiteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    topbarText: {
      type: String,
      required: true,
      default: "Free delivery over Rs 8,000 · Cash on delivery across Pakistan",
    },
    topbarEnabled: { type: Boolean, default: true },
    /** Store charges (shipping, free-shipping threshold, gift wrap, COD fee, tax). See lib/checkout-config. */
    checkout: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true },
);

export const SiteSettingsModel =
  models.SiteSettings || model("SiteSettings", SiteSettingsSchema);

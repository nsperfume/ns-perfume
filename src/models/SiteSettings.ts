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
    /** Social page links keyed by platform. See lib/social. */
    socialLinks: { type: Schema.Types.Mixed, default: undefined },
    /** Standard collections were created once; deleting them later does not bring them back. */
    collectionsSeeded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Dev hot reload keeps the first compiled model; drop it so schema changes apply without a restart.
if (process.env.NODE_ENV !== "production" && models.SiteSettings) mongoose.deleteModel("SiteSettings");

export const SiteSettingsModel =
  models.SiteSettings || model("SiteSettings", SiteSettingsSchema);

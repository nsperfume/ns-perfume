import mongoose, { Schema, models, model } from "mongoose";

const CollectionSchema = new Schema(
  {
    handle: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    seoCopy: { type: String, default: "" },
    bannerTone: { type: String, enum: ["canvas", "deep"], default: "canvas" },
    bannerImage: { type: String, default: "" },
    filterTags: { type: [String], default: [] },
    productHandles: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "draft"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Storefront collection list in display order.
CollectionSchema.index({ status: 1, sortOrder: 1 });

export const CollectionModel =
  models.Collection || model("Collection", CollectionSchema);

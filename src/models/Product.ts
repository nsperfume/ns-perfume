import mongoose, { Schema, models, model } from "mongoose";

const SizeSchema = new Schema(
  {
    ml: { type: Number, required: true },
    pricePkr: { type: Number, required: true },
    sku: { type: String, required: true },
    compareAtPkr: { type: Number },
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    handle: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    descriptor: { type: String, default: "" },
    /** Longer product description shown on the PDP buy column. */
    description: { type: String, default: "" },
    concentration: {
      type: String,
      enum: ["EDP", "EDT", "PARFUM"],
      default: "EDP",
    },
    family: { type: String, default: "fresh" },
    gender: {
      type: String,
      enum: ["her", "him", "unisex"],
      default: "unisex",
    },
    sizes: { type: [SizeSchema], default: [] },
    topNotes: { type: [String], default: [] },
    heartNotes: { type: [String], default: [] },
    baseNotes: { type: [String], default: [] },
    sillage: { type: Number, min: 1, max: 5, default: 3 },
    longevity: { type: Number, min: 1, max: 5, default: 3 },
    ingredients: { type: [String], default: [] },
    /** False for oil / attar formulas with no alcohol carrier. */
    containsAlcohol: { type: Boolean, default: true },
    countryOfOrigin: { type: String, default: "Pakistan" },
    story: { type: String, default: "" },
    howToWear: { type: String, default: "" },
    tags: { type: [String], default: [] },
    /** Explicit storefront collection membership (handles). */
    collectionHandles: { type: [String], default: [], index: true },
    badges: {
      type: [String],
      default: [],
    },
    imagePrimary: { type: String, default: "" },
    imageSecondary: { type: String, default: "" },
    gallery: { type: [String], default: [] },
    relatedHandles: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
  },
  { timestamps: true },
);

export type ProductDoc = mongoose.InferSchemaType<typeof ProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProductModel =
  models.Product || model("Product", ProductSchema);

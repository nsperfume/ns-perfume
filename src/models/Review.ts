import mongoose, { Schema, models, model } from "mongoose";

/** Product page reviews — separate from site testimonials */
const ReviewSchema = new Schema(
  {
    productHandle: { type: String, required: true, index: true },
    author: { type: String, required: true },
    city: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, default: "" },
    body: { type: String, required: true },
    verified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["published", "pending", "hidden"],
      default: "published",
      index: true,
    },
  },
  { timestamps: true },
);

export const ReviewModel = models.Review || model("Review", ReviewSchema);

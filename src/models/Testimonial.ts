import mongoose, { Schema, models, model } from "mongoose";

/** Site-wide brand testimonials (not product reviews) */
const TestimonialSchema = new Schema(
  {
    author: { type: String, required: true },
    city: { type: String, default: "Karachi" },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    productName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    featured: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Home page: featured, published testimonials in order.
TestimonialSchema.index({ status: 1, featured: 1, sortOrder: 1 });

export const TestimonialModel =
  models.Testimonial || model("Testimonial", TestimonialSchema);

import mongoose, { Schema, models, model } from "mongoose";

const JournalSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    /** HTML from TipTap. Legacy docs may still store string[]. */
    body: { type: Schema.Types.Mixed, default: "" },
    date: { type: String, default: "" },
    readTime: { type: String, default: "5 min" },
    category: { type: String, default: "Guides" },
    relatedProductHandle: { type: String, default: "" },
    relatedCollectionHandle: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imageTone: { type: String, default: "#E8DFC8" },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
  },
  { timestamps: true },
);

export const JournalModel = models.Journal || model("Journal", JournalSchema);

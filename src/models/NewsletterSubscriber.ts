import mongoose, { Schema, models, model } from "mongoose";

const NewsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "subscribed",
      index: true,
    },
    /** Where the signup came from, e.g. "footer" or "checkout". */
    source: { type: String, default: "footer" },
    /** Hash of the token in the unsubscribe link. */
    unsubscribeTokenHash: { type: String, default: "", index: true },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type NewsletterSubscriberDoc = mongoose.InferSchemaType<
  typeof NewsletterSubscriberSchema
> & { _id: mongoose.Types.ObjectId };

export const NewsletterSubscriberModel =
  models.NewsletterSubscriber ||
  model("NewsletterSubscriber", NewsletterSubscriberSchema);

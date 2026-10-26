import mongoose, { Schema, models, model } from "mongoose";

/** One row per transactional email attempt, for the admin Emails screen and debugging. */
const EmailLogSchema = new Schema(
  {
    template: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    subject: { type: String, default: "" },
    status: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      required: true,
      index: true,
    },
    error: { type: String, default: "" },
    messageId: { type: String, default: "" },
    /** Order number, contact id, etc. for cross-referencing. */
    ref: { type: String, default: "", index: true },
  },
  { timestamps: true },
);

EmailLogSchema.index({ createdAt: -1 });

export type EmailLogDoc = mongoose.InferSchemaType<typeof EmailLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmailLogModel = models.EmailLog || model("EmailLog", EmailLogSchema);

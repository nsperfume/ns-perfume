import mongoose, { Schema, models, model } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    topic: { type: String, default: "general" },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "read", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

export const ContactMessageModel =
  models.ContactMessage || model("ContactMessage", ContactMessageSchema);

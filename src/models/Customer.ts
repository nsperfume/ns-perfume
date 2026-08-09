import mongoose, { Schema, models, model } from "mongoose";

const CustomerSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    passwordHash: { type: String, default: "" },
    googleId: { type: String, default: "", index: true },
    avatarUrl: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CustomerModel =
  models.Customer || model("Customer", CustomerSchema);

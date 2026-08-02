import mongoose, { Schema, models, model } from "mongoose";

const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, default: "Admin" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "staff"], default: "owner" },
  },
  { timestamps: true },
);

export const AdminUserModel =
  models.AdminUser || model("AdminUser", AdminUserSchema);

import mongoose, { Schema, models, model } from "mongoose";

const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, default: "Admin" },
    passwordHash: { type: String, required: true },
    /** super_admin: Asim / owner. admin: limited staff. */
    role: {
      type: String,
      enum: ["super_admin", "admin", "owner", "staff"],
      default: "admin",
    },
  },
  { timestamps: true },
);

export const AdminUserModel =
  models.AdminUser || model("AdminUser", AdminUserSchema);

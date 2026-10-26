import mongoose, { Schema, models, model } from "mongoose";

/**
 * Admin console accounts. Sign-in is database only (no environment master key).
 *
 * Roles (see lib/admin-token normalizeRole):
 *   super_admin  Owner: everything, including the team and store charges.
 *   admin        Editor: view and change orders, products and content.
 *   viewer       Viewer: view only.
 * "owner" and "staff" are legacy spellings of super_admin and admin.
 */
const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "Admin", trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "viewer", "owner", "staff"],
      default: "admin",
    },
    /** Deactivated accounts cannot sign in; existing sessions stop at once. */
    active: { type: Boolean, default: true },
    /** Bumped on password change, reset or deactivation to sign out every session. */
    tokenVersion: { type: Number, default: 0 },
    /** Set for accounts created or reset by the owner: choose a new password first. */
    mustChangePassword: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null },
    /** sha256 of the emailed reset token; the raw token is never stored. */
    resetTokenHash: { type: String, default: null, index: true },
    resetTokenExpires: { type: Date, default: null },
    /** Brute force guard that also works across serverless instances. */
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

// Dev hot reload keeps the first compiled model; drop it so schema changes apply without a restart.
if (process.env.NODE_ENV !== "production" && models.AdminUser) mongoose.deleteModel("AdminUser");

export const AdminUserModel = models.AdminUser || model("AdminUser", AdminUserSchema);

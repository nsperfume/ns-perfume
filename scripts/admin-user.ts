/**
 * Create or reset an admin account from the terminal. This is the recovery path
 * when nobody can sign in (for example, email is not set up for password resets).
 *
 * Usage:
 *   ADMIN_NEW_PASSWORD='...' pnpm admin:user --email owner@example.com --name "Asim Ali" \
 *     [--role owner|editor|viewer] [--db ns-perfume-prod] [--must-change] [--force]
 *
 * - The password is read from ADMIN_NEW_PASSWORD so it never appears in shell history arguments.
 * - Existing accounts get the new password, are re-activated and signed out everywhere.
 * - --db overrides MONGODB_DB (the connection string still comes from .env.local).
 * - --force skips the "do not include your name" rule (length and letter+number rules always apply).
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const ROLES: Record<string, string> = { owner: "super_admin", editor: "admin", viewer: "viewer" };

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI || fail("MONGODB_URI is missing from .env.local");
  const dbName = arg("db") || process.env.MONGODB_DB || "ns-perfume";
  const email = (arg("email") || "").trim().toLowerCase();
  const name = (arg("name") || "").trim();
  const roleKey = (arg("role") || "owner").toLowerCase();
  const role = ROLES[roleKey] || fail(`--role must be one of: ${Object.keys(ROLES).join(", ")}`);
  const password = process.env.ADMIN_NEW_PASSWORD || "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Pass a valid --email");
  if (password.length < 10) fail("ADMIN_NEW_PASSWORD must be at least 10 characters");
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) fail("ADMIN_NEW_PASSWORD needs letters and at least one number");
  const first = name.split(/\s+/)[0]?.toLowerCase() ?? "";
  const local = email.split("@")[0]!.toLowerCase();
  const containsName =
    (first.length >= 4 && password.toLowerCase().includes(first)) ||
    (local.length >= 4 && password.toLowerCase().includes(local));
  if (containsName && !process.argv.includes("--force")) {
    fail("The password contains your name or email. Choose another, or pass --force to accept it anyway.");
  }

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15_000 });
  const users = mongoose.connection.db!.collection("adminusers");
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          passwordHash,
          role,
          ...(name ? { name } : {}),
          active: true,
          mustChangePassword: process.argv.includes("--must-change"),
          passwordChangedAt: now,
          failedLoginCount: 0,
          lockedUntil: null,
          resetTokenHash: null,
          resetTokenExpires: null,
          updatedAt: now,
        },
        $inc: { tokenVersion: 1 },
      },
    );
    console.log(`Updated ${email} in "${dbName}" as ${roleKey}. Other sessions for this account were signed out.`);
  } else {
    await users.insertOne({
      email,
      name: name || "Admin",
      passwordHash,
      role,
      active: true,
      tokenVersion: 0,
      mustChangePassword: process.argv.includes("--must-change"),
      passwordChangedAt: now,
      failedLoginCount: 0,
      lockedUntil: null,
      resetTokenHash: null,
      resetTokenExpires: null,
      lastLoginAt: null,
      createdBy: "terminal",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created ${email} in "${dbName}" as ${roleKey}.`);
  }
  if (containsName) console.warn("Warning: this password contains your name or email. Change it in Admin > Profile.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

/**
 * Direct Mongo seed (no HTTP). Syncs admin from .env and replaces catalog.
 * Usage: pnpm seed:db
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  seedProducts,
  seedCollections,
  seedTestimonials,
  seedReviews,
  seedJournal,
} from "../src/data/seed-catalog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");

  const dbName = process.env.MONGODB_DB || "ns-perfume";
  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;
  if (!db) throw new Error("No db");

  const email = (
    process.env.ADMIN_EMAIL || "admin@nsperfume.com"
  ).toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMeNSAdmin123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await db.collection("adminusers").updateOne(
    { email },
    {
      $set: {
        email,
        name: "Store Owner",
        passwordHash,
        role: "owner",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  for (const name of [
    "products",
    "collections",
    "testimonials",
    "reviews",
    "journals",
  ]) {
    await db.collection(name).deleteMany({});
  }

  const now = new Date();
  const stamp = (rows: Record<string, unknown>[]) =>
    rows.map((r) => ({ ...r, createdAt: now, updatedAt: now }));

  await db.collection("products").insertMany(stamp(seedProducts as never[]));
  await db
    .collection("collections")
    .insertMany(stamp(seedCollections as never[]));
  await db
    .collection("testimonials")
    .insertMany(stamp(seedTestimonials as never[]));
  await db.collection("reviews").insertMany(stamp(seedReviews as never[]));
  await db.collection("journals").insertMany(stamp(seedJournal as never[]));

  console.log("Seeded:", {
    products: seedProducts.length,
    collections: seedCollections.length,
    testimonials: seedTestimonials.length,
    reviews: seedReviews.length,
    journal: seedJournal.length,
    adminEmail: email,
  });
  console.log("Admin password synced from ADMIN_PASSWORD in .env.local");

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});

/**
 * Direct Mongo seed (no HTTP). Replaces the demo catalog only.
 * Admin accounts are managed with `pnpm admin:user` and in Admin > Settings > Team.
 * Usage: pnpm seed:db --yes
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
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
  const host = uri.replace(/^mongodb(\+srv)?:\/\/([^@]*@)?/, "").split(/[/?]/)[0];
  if (!process.argv.includes("--yes")) {
    console.error(
      `This wipes products, collections, testimonials, reviews and journal in "${dbName}" on ${host}.\n` +
        "Re-run with --yes to confirm: pnpm seed:db -- --yes",
    );
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;
  if (!db) throw new Error("No db");

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
  });

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

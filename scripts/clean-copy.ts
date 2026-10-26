/**
 * Remove em and en dashes from store copy saved in MongoDB (products, collections,
 * journal posts, testimonials). Customer reviews are never modified.
 *
 *   pnpm clean:copy            dry run: lists every change, writes nothing
 *   pnpm clean:copy --apply    backs up affected documents to scripts/backups/, then updates
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function loadEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
  }
}

/** Number ranges become "to"; every other dash becomes a comma. */
export function undash(text: string): string {
  return text
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*([.!?])/g, "$1");
}

const TARGETS: Record<string, string[]> = {
  products: ["name", "descriptor", "description", "story", "howToWear", "seoTitle", "seoDescription", "ingredients", "topNotes", "heartNotes", "baseNotes"],
  collections: ["title", "description", "seoTitle", "seoDescription", "seoCopy"],
  journals: ["title", "excerpt", "body", "category"],
  testimonials: ["quote", "body", "author", "location"],
};

type Change = { collection: string; id: unknown; field: string; before: string; after: string };

function cleanValue(value: unknown): unknown {
  if (typeof value === "string") return undash(value);
  if (Array.isArray(value)) return value.map(cleanValue);
  return value;
}

async function main() {
  loadEnv();
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "ns-perfume" });
  const db = mongoose.connection.db!;

  const changes: Change[] = [];
  const backups: Record<string, unknown[]> = {};
  const updates: Array<{ collection: string; id: unknown; set: Record<string, unknown> }> = [];

  for (const [name, fields] of Object.entries(TARGETS)) {
    const docs = await db.collection(name).find({}).toArray();
    for (const doc of docs) {
      const set: Record<string, unknown> = {};
      for (const field of fields) {
        const before = doc[field];
        if (before == null) continue;
        const after = cleanValue(before);
        if (JSON.stringify(after) !== JSON.stringify(before)) {
          set[field] = after;
          changes.push({ collection: name, id: doc._id, field, before: JSON.stringify(before).slice(0, 160), after: JSON.stringify(after).slice(0, 160) });
        }
      }
      if (Object.keys(set).length) {
        (backups[name] ||= []).push(doc);
        updates.push({ collection: name, id: doc._id, set });
      }
    }
  }

  for (const c of changes) {
    console.log(`[${c.collection}] ${String(c.id)} ${c.field}\n  - ${c.before}\n  + ${c.after}`);
  }
  console.log(`\n${changes.length} field(s) in ${updates.length} document(s) contain dashes.`);

  if (!apply) {
    console.log("Dry run. Re-run with --apply to back up and update.");
  } else if (updates.length) {
    const dir = path.join(process.cwd(), "scripts/backups");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `clean-copy-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(file, JSON.stringify(backups, null, 2));
    console.log(`Backup written to ${path.relative(process.cwd(), file)}`);
    for (const u of updates) {
      await db.collection(u.collection).updateOne({ _id: u.id as mongoose.Types.ObjectId }, { $set: u.set });
    }
    console.log(`Updated ${updates.length} document(s).`);
  }

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});

/**
 * Download Unsplash perfume / beauty stills into public/products/photos as WebP.
 * Free under the Unsplash License: https://unsplash.com/license
 */
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "products", "photos");

/** basename (no ext) → Unsplash photo id + crop */
const VERIFIED = {
  "amber-noir-1": { id: "1541643600914-78b084683601", w: 900, h: 1100 },
  "amber-noir-2": { id: "1588405748880-12d1d2a59f75", w: 900, h: 1100 },
  "amber-noir-3": { id: "1594035910387-fea47794261f", w: 900, h: 1100 },
  "iris-solstice-1": { id: "1592945403244-b3fbafd7f539", w: 900, h: 1100 },
  "iris-solstice-2": { id: "1615634260167-c8cdede054de", w: 900, h: 1100 },
  "cedar-rift-1": { id: "1595425970377-c9703cf48b6d", w: 1000, h: 1200 },
  "cedar-rift-2": { id: "1595425970377-c9703cf48b6d", w: 900, h: 1100 },
  "fig-verdure-1": { id: "1563170351-be82bc888aa4", w: 900, h: 1100 },
  "fig-verdure-2": { id: "1512496015851-a90fb38ba796", w: 900, h: 1100 },
  "oud-atelier-1": { id: "1588405748880-12d1d2a59f75", w: 900, h: 1100 },
  "oud-atelier-2": { id: "1609749282774-5883a366cdd1", w: 900, h: 1100 },
  "oud-atelier-3": { id: "1541643600914-78b084683601", w: 1000, h: 1000 },
  "citrus-atelier-1": { id: "1556228578-0d85b1a4d571", w: 900, h: 1100 },
  "citrus-atelier-2": { id: "1512496015851-a90fb38ba796", w: 1000, h: 1000 },
  "vanille-gilde-1": { id: "1587017539504-67cfbddac569", w: 900, h: 1100 },
  "vanille-gilde-2": { id: "1609749282774-5883a366cdd1", w: 900, h: 1100 },
  "vanille-gilde-3": { id: "1556228578-0d85b1a4d571", w: 1000, h: 1200 },
  "saffron-district-1": { id: "1594035910387-fea47794261f", w: 1000, h: 1200 },
  "saffron-district-2": { id: "1588405748880-12d1d2a59f75", w: 1000, h: 1000 },
  "rose-kashmir-1": { id: "1592945403244-b3fbafd7f539", w: 1000, h: 1200 },
  "rose-kashmir-2": { id: "1587017539504-67cfbddac569", w: 1000, h: 1000 },
  "jasmine-bazaar-1": { id: "1615634260167-c8cdede054de", w: 1000, h: 1200 },
  "jasmine-bazaar-2": { id: "1563170351-be82bc888aa4", w: 1000, h: 1000 },
  "leather-garrison-1": { id: "1595425970377-c9703cf48b6d", w: 1000, h: 1200 },
  "leather-garrison-2": { id: "1594035910387-fea47794261f", w: 1000, h: 1000 },
  "green-monsoon-1": { id: "1512496015851-a90fb38ba796", w: 900, h: 1100 },
  "green-monsoon-2": { id: "1563170351-be82bc888aa4", w: 900, h: 900 },
  "musk-nights-1": { id: "1609749282774-5883a366cdd1", w: 1000, h: 1200 },
  "musk-nights-2": { id: "1588405748880-12d1d2a59f75", w: 900, h: 900 },
  "discovery-1": { id: "1595425970377-c9703cf48b6d", w: 1000, h: 1000 },
  "discovery-2": { id: "1541643600914-78b084683601", w: 1100, h: 900 },
  "lifestyle-desk": { id: "1556228578-0d85b1a4d571", w: 1200, h: 800 },
  "lifestyle-window": { id: "1512496015851-a90fb38ba796", w: 1200, h: 800 },
  "detail-cap": { id: "1594035910387-fea47794261f", w: 900, h: 900 },
  "detail-spray": { id: "1594035910387-fea47794261f", w: 900, h: 900 },
};

function urlFor({ id, w, h }) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const [base, meta] of Object.entries(VERIFIED)) {
    const dest = path.join(outDir, `${base}.webp`);
    if (await exists(dest)) {
      skip += 1;
      continue;
    }
    try {
      const res = await fetch(urlFor(meta), {
        headers: { "User-Agent": "ns-perfume-seed/1.0" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) throw new Error(`too small (${buf.length}b)`);

      await sharp(buf, { failOn: "none" })
        .rotate()
        .resize({
          width: Math.min(meta.w, 900),
          height: Math.min(meta.h, 1100),
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 78, effort: 6, smartSubsample: true })
        .toFile(dest);

      ok += 1;
      console.log("saved", `${base}.webp`);
    } catch (e) {
      fail += 1;
      console.error("failed", base, e.message);
    }
  }

  console.log(`done. saved=${ok} skipped=${skip} failed=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main();

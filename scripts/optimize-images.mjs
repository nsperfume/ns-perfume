/**
 * Convert raster images under public/ to optimized WebP.
 *
 * Usage:
 *   node scripts/optimize-images.mjs
 *   node scripts/optimize-images.mjs --dir=public/assets
 *   node scripts/optimize-images.mjs --keep-originals
 *   node scripts/optimize-images.mjs --quality=80 --max-width=1920
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INPUT_EXTS = new Set([".png", ".jpg", ".jpeg", ".tif", ".tiff", ".gif", ".avif"]);

function parseArgs(argv) {
  const opts = {
    dir: "public/assets",
    quality: 82,
    maxWidth: 1920,
    keepOriginals: false,
  };
  for (const arg of argv) {
    if (arg === "--keep-originals") opts.keepOriginals = true;
    else if (arg.startsWith("--dir=")) opts.dir = arg.slice(6);
    else if (arg.startsWith("--quality=")) opts.quality = Number(arg.slice(10));
    else if (arg.startsWith("--max-width=")) opts.maxWidth = Number(arg.slice(12));
  }
  return opts;
}

/** Cap long edges; collection cards and heroes stay sharp on retina without multi-MB files. */
function presetFor(file) {
  const base = path.basename(file).toLowerCase();
  const dir = path.dirname(file).replace(/\\/g, "/").toLowerCase();

  /* Product catalog stills */
  if (dir.includes("/products/photos") || dir.endsWith("products/photos")) {
    return { maxWidth: 900, maxHeight: 1100, quality: 78 };
  }

  if (
    base.startsWith("hero") ||
    base.includes("story-band") ||
    base.includes("find-your-scent") ||
    base.startsWith("navbar-") ||
    base.startsWith("cart") ||
    base.startsWith("wishlist") ||
    base.startsWith("search") ||
    base.startsWith("gift-cards") ||
    base.startsWith("about-") ||
    base.startsWith("contact")
  ) {
    return { maxWidth: 1920, maxHeight: 1200, quality: 80 };
  }
  if (base.startsWith("sbc-") || base.startsWith("worn-")) {
    return { maxWidth: 960, maxHeight: 1200, quality: 82 };
  }
  return null;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function optimizeFile(file, defaults) {
  const ext = path.extname(file).toLowerCase();
  if (!INPUT_EXTS.has(ext)) return null;
  if (ext === ".webp") return null;

  const preset = presetFor(file) ?? {
    maxWidth: defaults.maxWidth,
    maxHeight: defaults.maxWidth,
    quality: defaults.quality,
  };

  const out = file.replace(new RegExp(`${ext.replace(".", "\\.")}$`, "i"), ".webp");
  const inputStat = await fs.stat(file);
  const image = sharp(file, { failOn: "none" }).rotate();
  const meta = await image.metadata();

  let pipeline = image;
  const needsResize =
    (meta.width && meta.width > preset.maxWidth) ||
    (meta.height && meta.height > (preset.maxHeight ?? preset.maxWidth));

  if (needsResize) {
    pipeline = pipeline.resize({
      width: preset.maxWidth,
      height: preset.maxHeight ?? preset.maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  await pipeline
    .webp({
      quality: preset.quality,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(out);

  const outStat = await fs.stat(out);
  if (!defaults.keepOriginals) {
    await fs.unlink(file);
  }

  return {
    in: path.relative(ROOT, file),
    out: path.relative(ROOT, out),
    before: inputStat.size,
    after: outStat.size,
    width: meta.width,
    height: meta.height,
  };
}

function fmtKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const dir = path.resolve(ROOT, opts.dir);
  await fs.access(dir);

  const files = await walk(dir);
  const results = [];

  for (const file of files) {
    try {
      const result = await optimizeFile(file, opts);
      if (result) results.push(result);
    } catch (err) {
      console.error(`Failed: ${file}`, err.message);
      process.exitCode = 1;
    }
  }

  if (!results.length) {
    console.log(`No convertible images found in ${opts.dir}`);
    return;
  }

  let saved = 0;
  for (const r of results) {
    const delta = r.before - r.after;
    saved += delta;
    const pct = ((delta / r.before) * 100).toFixed(0);
    console.log(
      `${r.in} → ${r.out}  ${fmtKb(r.before)} → ${fmtKb(r.after)}  (−${pct}%)  ${r.width}×${r.height}`,
    );
  }
  console.log(
    `\n${results.length} file(s). Saved ${fmtKb(saved)} total.${opts.keepOriginals ? " Originals kept." : " Originals removed."}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

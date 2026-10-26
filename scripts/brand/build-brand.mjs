/**
 * Builds every NS Perfume logo asset from scripts/brand/source.json.
 *
 *   node scripts/brand/build-brand.mjs
 *
 * Mark: the NS ligature under a slim crown. The crown is three tapered spikes
 * (top, heart and base notes) with a pearl on each and a fine band. All crown
 * parts are separate shapes that never overlap, so they render the same in
 * browsers, the PDF invoice and the Lottie loader without boolean unions.
 *
 * Lockup: crowned NS, a brass hairline, then PERFUME. The monogram already says
 * NS, so the wordmark does not repeat it.
 *
 * Outputs
 *   src/components/brand/paths.ts         geometry used by <Logo>, <LogoMark>, the invoice and the footer
 *   src/components/brand/ns-loader.json   adds the crown to the loader animation
 *   public/brand/*.svg                    symbol, logo, stacked, emblem, seal (colour, reverse, mono)
 *   public/brand/email-logo.png, icon-192.png, icon-512.png
 *   src/app/icon.svg, favicon.ico, apple-icon.png, opengraph-image.png
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "package.json"));
const sharp = require("sharp");
const SRC = JSON.parse(readFileSync(path.join(ROOT, "scripts/brand/source.json"), "utf8"));
const at = (p) => path.join(ROOT, p);

const BRASS = "#A9873C";
const INK = "#0B0B0B";
const WHITE = "#FFFFFF";
const NIGHT = "#0A0A0A";
const r2 = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ geometry */

const K = 0.5522847498; // cubic handle length for a quarter circle

/** Contour: closed list of nodes { p:[x,y], in:[dx,dy], out:[dx,dy] } (handles relative to p). */
const node = (p, inn = [0, 0], out = [0, 0]) => ({ p, in: inn, out });

function circle(cx, cy, r) {
  const k = K * r;
  return [
    node([cx, cy - r], [-k, 0], [k, 0]),
    node([cx + r, cy], [0, -k], [0, k]),
    node([cx, cy + r], [k, 0], [-k, 0]),
    node([cx - r, cy], [0, k], [0, -k]),
  ];
}

/** Bar with fully rounded ends. */
function capsule(x0, y0, x1, y1) {
  const r = (y1 - y0) / 2;
  const k = K * r;
  return [
    node([x0 + r, y0], [-k, 0], [0, 0]),
    node([x1 - r, y0], [0, 0], [k, 0]),
    node([x1, y0 + r], [0, -k], [0, k]),
    node([x1 - r, y1], [k, 0], [0, 0]),
    node([x0 + r, y1], [0, 0], [-k, 0]),
    node([x0, y0 + r], [0, k], [0, -k]),
  ];
}

function rotateContour(c, [ox, oy], deg) {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const rp = ([x, y]) => [ox + (x - ox) * cos - (y - oy) * sin, oy + (x - ox) * sin + (y - oy) * cos];
  const rv = ([x, y]) => [x * cos - y * sin, x * sin + y * cos];
  return c.map((n) => ({ p: rp(n.p), in: rv(n.in), out: rv(n.out) }));
}

/** Tapered spike: full width at the base, curving to a sharp tip. */
function spike(cx, baseY, w, h, deg) {
  const bl = [cx - w / 2, baseY];
  const br = [cx + w / 2, baseY];
  const tip = [cx, baseY - h];
  const c = [
    node(bl, [0, 0], [0, -h * 0.42]),
    node(tip, [-w * 0.08, h * 0.28], [w * 0.08, h * 0.28]),
    node(br, [0, -h * 0.42], [0, 0]),
  ];
  return { contour: rotateContour(c, [cx, baseY], deg), tip: rotateContour([node(tip)], [cx, baseY], deg)[0].p };
}

const mapContour = (c, f) => c.map((n) => ({ p: f(n.p), in: f(n.in, true), out: f(n.out, true) }));
/** Uniform scale + translate (handles only scale). */
const place = (c, k, dx, dy) => mapContour(c, ([x, y], vec) => (vec ? [x * k, y * k] : [x * k + dx, y * k + dy]));

function toD(contours) {
  return contours
    .map((c) => {
      let d = `M${r2(c[0].p[0])} ${r2(c[0].p[1])}`;
      for (let i = 0; i < c.length; i++) {
        const a = c[i];
        const b = c[(i + 1) % c.length];
        const straight = !a.out[0] && !a.out[1] && !b.in[0] && !b.in[1];
        if (i === c.length - 1 && straight) break; // Z closes it
        d += straight
          ? `L${r2(b.p[0])} ${r2(b.p[1])}`
          : `C${r2(a.p[0] + a.out[0])} ${r2(a.p[1] + a.out[1])} ${r2(b.p[0] + b.in[0])} ${r2(b.p[1] + b.in[1])} ${r2(b.p[0])} ${r2(b.p[1])}`;
      }
      return `${d}Z`;
    })
    .join("");
}

const toLottieShape = (c) => ({
  c: true,
  v: c.map((n) => n.p.map(r2)),
  i: c.map((n) => n.in.map(r2)),
  o: c.map((n) => n.out.map(r2)),
});

/* --------------------------------------------------------------------- crown */

const MONO = SRC.monogram; // 108.5 × 77.8
const CROWN_GAP = 5; // crown band to the top of the letters

const CROWN_REGULAR = { centerH: 16, sideH: 11, centerW: 5.6, sideW: 4.8, tilt: 18, spread: 0.36, band: 2.4, bandW: 0.78, gap: 1.2, pearl: 1.45, pearlGap: 0.9 };
/** Heavier cut for favicons and app icons so the crown survives 16 to 48 px. */
const CROWN_BOLD = { centerH: 16, sideH: 11.4, centerW: 7.6, sideW: 6.8, tilt: 17, spread: 0.37, band: 3.4, bandW: 0.8, gap: 1.5, pearl: 1.9, pearlGap: 1.1 };

/** Crown contours centred on the monogram, top at y = 0. */
function crown(o, w = MONO.width * 0.56) {
  const cx = MONO.width / 2;
  const baseY = o.pearlGap + 2 * o.pearl + o.centerH;
  const c = spike(cx, baseY, o.centerW, o.centerH, 0);
  const l = spike(cx - o.spread * w, baseY, o.sideW, o.sideH, -o.tilt);
  const r = spike(cx + o.spread * w, baseY, o.sideW, o.sideH, o.tilt);
  const pearlAt = ([px, py], radius, deg) => {
    const a = (deg * Math.PI) / 180;
    return circle(px + Math.sin(a) * (o.pearlGap + radius), py - Math.cos(a) * (o.pearlGap + radius), radius);
  };
  const by0 = baseY + o.gap;
  const by1 = by0 + o.band;
  const bw = (w * o.bandW) / 2;
  const contours = [
    c.contour,
    l.contour,
    r.contour,
    capsule(cx - bw, by0, cx + bw, by1),
    pearlAt(c.tip, o.pearl, 0),
    pearlAt(l.tip, o.pearl * 0.9, -o.tilt),
    pearlAt(r.tip, o.pearl * 0.9, o.tilt),
  ];
  return { contours, bottom: by1 };
}

function crownedMark(o) {
  const cr = crown(o);
  const monogramY = r2(cr.bottom + CROWN_GAP);
  return { width: MONO.width, height: r2(monogramY + MONO.height), monogramY, contours: cr.contours, d: toD(cr.contours) };
}

const CROWNED = crownedMark(CROWN_REGULAR);
const CROWNED_BOLD = crownedMark(CROWN_BOLD);

/* ------------------------------------------------------------------ wordmark */

/** Split an absolute M/L/Q/Z path into subpaths with their x range. */
function subpaths(d) {
  return d
    .split(/(?=M)/)
    .filter(Boolean)
    .map((s) => {
      const nums = s.match(/-?\d*\.?\d+/g).map(Number);
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      return { d: s, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    });
}

/** Translate and scale an absolute path made of M/L/Q/C/Z commands. */
function moveAbs(d, dx, dy, k = 1) {
  return d.replace(/([MLQC])([^MLQCZ]+)/g, (_, cmd, args) => {
    const n = args.match(/-?\d*\.?\d+/g).map(Number);
    const out = n.map((v, i) => r2(i % 2 === 0 ? v * k + dx : v * k + dy));
    const pairs = [];
    for (let i = 0; i < out.length; i += 2) pairs.push(`${out[i]} ${out[i + 1]}`);
    return cmd + pairs.join(cmd === "Q" || cmd === "C" ? " " : "L");
  });
}

function bboxOf(parts) {
  return {
    minX: Math.min(...parts.map((p) => p.minX)),
    maxX: Math.max(...parts.map((p) => p.maxX)),
    minY: Math.min(...parts.map((p) => p.minY)),
    maxY: Math.max(...parts.map((p) => p.maxY)),
  };
}

const WORD_PARTS = subpaths(SRC.wordmark.d);
const PERFUME_PARTS = WORD_PARTS.filter((p) => p.minX >= 300); // drop N and S
const PERFUME_BOX = bboxOf(PERFUME_PARTS);
const FULL_BOX = bboxOf(WORD_PARTS);
/** PERFUME with x starting at 0 and the original 96 px band for y (caps ~31 to ~66). */
const PERFUME_D = moveAbs(PERFUME_PARTS.map((p) => p.d).join(""), -PERFUME_BOX.minX, 0);
const PERFUME_W = r2(PERFUME_BOX.maxX - PERFUME_BOX.minX);
const CAP_TOP = PERFUME_BOX.minY;
const CAP_BOTTOM = PERFUME_BOX.maxY;

/* -------------------------------------------------------- horizontal lockup */

const H = 96;
const markScale = r2(H / CROWNED.height);
const markW = r2(MONO.width * markScale);
const lettersTop = CROWNED.monogramY * markScale;
const lettersMid = (lettersTop + H) / 2;
const textDy = r2(lettersMid - (CAP_TOP + CAP_BOTTOM) / 2);
const rule = { x: r2(markW + 26), y: r2(lettersTop + 6), width: 1.4, height: r2(H - lettersTop - 12) };
const textX = r2(rule.x + rule.width + 26);
const HORIZONTAL = {
  width: r2(textX + PERFUME_W),
  height: H,
  markScale,
  rule,
  wordmark: moveAbs(PERFUME_D, textX, textDy),
};

const WORDMARK = {
  width: r2(FULL_BOX.maxX - FULL_BOX.minX),
  top: r2(FULL_BOX.minY),
  height: r2(FULL_BOX.maxY - FULL_BOX.minY),
  d: moveAbs(SRC.wordmark.d, -FULL_BOX.minX, -FULL_BOX.minY),
};

/* ------------------------------------------------------------------- paths.ts */

writeFileSync(
  at("src/components/brand/paths.ts"),
  `// Generated by scripts/brand/build-brand.mjs. Edit the generator, not this file.

/** NS ligature (no crown). */
export const MONOGRAM = ${JSON.stringify(MONO)};

/** Crowned mark: crown path (top at y = 0) and where the monogram starts. */
export const CROWNED = ${JSON.stringify({ width: CROWNED.width, height: CROWNED.height, monogramY: CROWNED.monogramY, crown: CROWNED.d })};

/** Heavier crown for icons under ~64 px. */
export const CROWNED_BOLD = ${JSON.stringify({ width: CROWNED_BOLD.width, height: CROWNED_BOLD.height, monogramY: CROWNED_BOLD.monogramY, crown: CROWNED_BOLD.d })};

/** Horizontal lockup (${HORIZONTAL.width} × ${H}): crowned mark scaled to full height, brass rule, PERFUME. */
export const HORIZONTAL = ${JSON.stringify(HORIZONTAL)};

/** Full NS PERFUME wordmark, top-left at 0,0 (footer signature). */
export const WORDMARK = ${JSON.stringify(WORDMARK)};
`,
);

/* -------------------------------------------------------------- SVG builders */

const svgDoc = (w, h, body, title = "NS Perfume") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${r2(w)}" height="${r2(h)}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

/** Crowned mark at (x, y) with scale k. */
const markSvg = (m, x, y, k, fill) =>
  `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(k * 10000) / 10000})" fill="${fill}"><path d="${m.d}"/><path transform="translate(0 ${m.monogramY})" d="${MONO.d}"/></g>`;

const VARIANTS = {
  "": { mark: BRASS, text: INK, accent: BRASS },
  "-reverse": { mark: BRASS, text: WHITE, accent: BRASS },
  "-mono-black": { mark: INK, text: INK, accent: INK },
  "-mono-brass": { mark: BRASS, text: BRASS, accent: BRASS },
};

function logoSvg(v) {
  const { rule: r } = HORIZONTAL;
  return svgDoc(
    HORIZONTAL.width,
    H,
    markSvg(CROWNED, 0, 0, markScale, v.mark) +
      `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="${v.accent}"/>` +
      `<path d="${HORIZONTAL.wordmark}" fill="${v.text}"/>`,
  );
}

function symbolSvg(v) {
  return svgDoc(CROWNED.width, CROWNED.height, markSvg(CROWNED, 0, 0, 1, v.mark));
}

const TAGLINE = subpaths(SRC.stackedTagline.d);
const TAGLINE_BOX = bboxOf(TAGLINE);

function stackedSvg(v) {
  const W = 363;
  const markH = 120;
  const k = markH / CROWNED.height;
  const t = 0.92;
  const textTop = markH + 22;
  const textY = textTop - CAP_TOP * t;
  const textBottom = textTop + (CAP_BOTTOM - CAP_TOP) * t;
  const ruleY = textBottom + 16;
  const tagY = ruleY + 14 - TAGLINE_BOX.minY;
  const tagDx = W / 2 - (TAGLINE_BOX.minX + TAGLINE_BOX.maxX) / 2;
  const height = ruleY + 14 + (TAGLINE_BOX.maxY - TAGLINE_BOX.minY) + 6;
  return svgDoc(
    W,
    height,
    markSvg(CROWNED, (W - MONO.width * k) / 2, 0, k, v.mark) +
      `<path d="${moveAbs(PERFUME_D, (W - PERFUME_W * t) / 2, textY, t)}" fill="${v.text}"/>` +
      `<rect x="${r2(W / 2 - 20)}" y="${r2(ruleY)}" width="40" height="1.2" fill="${v.accent}"/>` +
      `<path d="${moveAbs(SRC.stackedTagline.d, tagDx, tagY)}" fill="${v.text}"/>`,
  );
}

/** Emblem and seal keep their frames; the crown is added above the existing monogram. */
function addCrown(file) {
  let s = readFileSync(file, "utf8").replace(/<path id="crown"[^>]*\/>/g, "");
  const m = s.match(/<path transform="translate\(([\d.-]+) ([\d.-]+)\) scale\(([\d.]+)\)" d="([^"]+)" fill="([^"]+)"\/>/);
  if (!m || m[4] !== MONO.d) throw new Error(`Monogram not found in ${file}`);
  const [, tx, ty, k, , fill] = m;
  const crownTag = `<path id="crown" transform="translate(${tx} ${r2(Number(ty) - CROWNED.monogramY * Number(k))}) scale(${k})" d="${CROWNED.d}" fill="${fill}"/>`;
  s = s.replace(m[0], m[0] + crownTag);
  writeFileSync(file, s);
}

for (const [suffix, v] of Object.entries(VARIANTS)) {
  writeFileSync(at(`public/brand/ns-perfume-logo${suffix}.svg`), logoSvg(v));
  writeFileSync(at(`public/brand/ns-perfume-symbol${suffix}.svg`), symbolSvg(v));
  writeFileSync(at(`public/brand/ns-perfume-stacked${suffix}.svg`), stackedSvg(v));
  addCrown(at(`public/brand/ns-perfume-emblem${suffix}.svg`));
  addCrown(at(`public/brand/ns-perfume-seal${suffix}.svg`));
}

/* ------------------------------------------------------------------- rasters */

const png = (svg, w, h) => sharp(Buffer.from(svg)).resize(w, h).png({ compressionLevel: 9 }).toBuffer();

/** Square icon: night background, bold crowned mark centred. */
function iconSvg(size, radius, markRatio) {
  const mh = size * markRatio;
  const k = mh / CROWNED_BOLD.height;
  const x = (size - MONO.width * k) / 2;
  const y = (size - mh) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="NS Perfume"><title>NS Perfume</title><rect width="${size}" height="${size}" rx="${radius}" fill="${INK}"/>${markSvg(CROWNED_BOLD, x, y, k, BRASS)}</svg>\n`;
}

writeFileSync(at("src/app/icon.svg"), iconSvg(64, 14, 0.72));
const app = iconSvg(512, 0, 0.62);
writeFileSync(at("src/app/apple-icon.png"), await png(app, 180, 180));
writeFileSync(at("public/brand/icon-192.png"), await png(app, 192, 192));
writeFileSync(at("public/brand/icon-512.png"), await png(app, 512, 512));

/** favicon.ico with 16, 32 and 48 px PNG frames. */
{
  const sizes = [16, 32, 48];
  const frames = await Promise.all(sizes.map((s) => png(iconSvg(64, 14, 0.78), s, s)));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const entries = sizes.map((s, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s, 0);
    e.writeUInt8(s, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(frames[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += frames[i].length;
    return e;
  });
  writeFileSync(at("src/app/favicon.ico"), Buffer.concat([header, ...entries, ...frames]));
}

/** Email header: reverse lockup on night, 480 × 76 (shown at 240 × 38). */
{
  const h = 76;
  const lh = 50;
  const k = lh / H;
  const w = 480;
  const body = `<rect width="${w}" height="${h}" fill="${INK}"/><g transform="translate(24 ${r2((h - lh) / 2)}) scale(${r2(k * 10000) / 10000})">${logoSvg(VARIANTS["-reverse"]).replace(/^<svg[^>]*>/, "").replace(/<title>.*?<\/title>/, "").replace(/<\/svg>\s*$/, "")}</g>`;
  writeFileSync(at("public/brand/email-logo.png"), await png(svgDoc(w, h, body), w, h));
}

/** Open Graph card 1200 × 630. */
{
  const W = 1200;
  const Hh = 630;
  const fontBuf = readFileSync(at("src/lib/invoice/fonts/manrope-latin-600-normal.ttf"));
  const manrope = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));
  const spaced = (text, size, letter, y, fill) => {
    let x = 0;
    const glyphs = manrope.stringToGlyphs(text);
    const widths = glyphs.map((g) => (g.advanceWidth / manrope.unitsPerEm) * size + letter);
    const total = widths.reduce((a, b) => a + b, 0) - letter;
    x = (W - total) / 2;
    let d = "";
    glyphs.forEach((g, i) => {
      d += g.getPath(x, y, size).toPathData(2);
      x += widths[i];
    });
    return `<path d="${d}" fill="${fill}"/>`;
  };
  const markH = 190;
  const k = markH / CROWNED.height;
  const markTop = 92;
  const t = 1.32;
  const textTop = markTop + markH + 34;
  const textY = textTop - CAP_TOP * t;
  const textBottom = textTop + (CAP_BOTTOM - CAP_TOP) * t;
  const ruleY = textBottom + 26;
  const body =
    `<rect width="${W}" height="${Hh}" fill="${NIGHT}"/>` +
    markSvg(CROWNED, (W - MONO.width * k) / 2, markTop, k, BRASS) +
    `<path d="${moveAbs(PERFUME_D, (W - PERFUME_W * t) / 2, textY, t)}" fill="${WHITE}"/>` +
    `<rect x="${W / 2 - 28}" y="${r2(ruleY)}" width="56" height="2" fill="${BRASS}"/>` +
    spaced("TOP · HEART · BASE", 17, 4.2, ruleY + 42, WHITE) +
    spaced("NSPERFUME.PK", 15, 5, ruleY + 92, "#9A9A9A");
  writeFileSync(at("src/app/opengraph-image.png"), await png(svgDoc(W, Hh, body), W, Hh));
}

/* --------------------------------------------------------------- loader JSON */

{
  const file = at("src/components/brand/ns-loader.json");
  const lottie = JSON.parse(readFileSync(file, "utf8"));
  lottie.layers = lottie.layers.filter((l) => l.nm !== "Crown");
  const fill = lottie.layers.find((l) => l.nm === "Monogram fill");
  const verts = fill.shapes[0].it.find((i) => i.ty === "sh").ks.k.v;
  const minX = Math.min(...verts.map((v) => v[0]));
  const maxX = Math.max(...verts.map((v) => v[0]));
  const minY = Math.min(...verts.map((v) => v[1]));
  const k = (maxX - minX) / MONO.width;
  const dy = minY - CROWNED.monogramY * k;
  if (dy < 4) throw new Error(`Crown would leave the loader canvas (top ${r2(dy)})`);
  const color = [0.6627450980392157, 0.5294117647058824, 0.23529411764705882, 1];
  const ease = { o: { x: [0.65], y: [0] }, i: { x: [0.35], y: [1] } };
  const crownLayer = {
    ddd: 0,
    ind: 99,
    ty: 4,
    nm: "Crown",
    sr: 1,
    ip: 0,
    op: fill.op,
    st: 0,
    bm: 0,
    ks: {
      o: { a: 1, k: [{ t: 60, s: [0], ...ease }, { t: 84, s: [100], ...ease }, { t: 126, s: [100], ...ease }, { t: 146, s: [0] }] },
      r: { a: 0, k: 0 },
      p: { a: 1, k: [{ t: 60, s: [0, 7, 0], o: { x: [0.65, 0.65, 0.65], y: [0, 0, 0] }, i: { x: [0.3, 0.3, 0.3], y: [1, 1, 1] } }, { t: 86, s: [0, 0, 0] }] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        nm: "Crown",
        it: [
          ...CROWNED.contours.map((c, i) => ({ ty: "sh", nm: `Part ${i + 1}`, ks: { a: 0, k: toLottieShape(place(c, k, minX, dy)) } })),
          { ty: "fl", nm: "Brass", c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
        ],
      },
    ],
  };
  lottie.layers.unshift(crownLayer);
  writeFileSync(file, JSON.stringify(lottie));
  console.log(`loader: crown top ${r2(dy)} of ${lottie.h}`);
}

console.log(`horizontal ${HORIZONTAL.width} × ${H}, crowned ${CROWNED.width} × ${CROWNED.height}`);

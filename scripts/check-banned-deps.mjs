/**
 * Fail the build if SSR-hostile packages return to the lockfile.
 * isomorphic-dompurify → jsdom → @exodus/bytes caused Vercel ERR_REQUIRE_ESM 500s.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BANNED = [
  "isomorphic-dompurify",
  "jsdom",
  "dompurify", // browser-only; do not import on the server via this package name alone
];

/** Packages allowed only as transitive of known-safe tools; still banned as direct deps. */
const BANNED_DIRECT = new Set(["isomorphic-dompurify", "jsdom"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function fail(message) {
  console.error(`\n[check-banned-deps] ${message}\n`);
  process.exit(1);
}

const pkgPath = path.join(ROOT, "package.json");
const pkg = readJson(pkgPath);
const direct = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
  ...(pkg.optionalDependencies || {}),
};

for (const name of BANNED_DIRECT) {
  if (direct[name]) {
    fail(
      `"${name}" is listed in package.json. It pulls ESM-only server deps that break Vercel SSR. Use sanitize-html via src/lib/rich-text.ts instead.`,
    );
  }
}

const lockPath = path.join(ROOT, "pnpm-lock.yaml");
if (fs.existsSync(lockPath)) {
  const lock = fs.readFileSync(lockPath, "utf8");
  for (const name of ["isomorphic-dompurify", "jsdom"]) {
    // Match package entries like `/jsdom@` or `jsdom@` in the lockfile importer/packages sections
    const re = new RegExp(`(^|\\n|/)${name}@`, "m");
    if (re.test(lock)) {
      fail(
        `"${name}" appears in pnpm-lock.yaml. Remove it and reinstall so Vercel does not ship jsdom. Prefer sanitize-html for HTML sanitization.`,
      );
    }
  }
}

// Soft note only for accidental source imports
const srcRoot = path.join(ROOT, "src");
const importHits = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(name)) {
      const text = fs.readFileSync(full, "utf8");
      for (const banned of BANNED) {
        if (
          text.includes(`from "${banned}"`) ||
          text.includes(`from '${banned}'`) ||
          text.includes(`require("${banned}")`) ||
          text.includes(`require('${banned}')`)
        ) {
          importHits.push(`${path.relative(ROOT, full)} → ${banned}`);
        }
      }
    }
  }
}

if (fs.existsSync(srcRoot)) walk(srcRoot);

if (importHits.length) {
  fail(
    `Banned sanitizer/DOM imports found:\n  - ${importHits.join("\n  - ")}\nUse "@/lib/rich-text" (sanitize-html) instead.`,
  );
}

console.log("[check-banned-deps] OK (no jsdom / isomorphic-dompurify)");

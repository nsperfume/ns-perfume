/**
 * Runs `next dev` with Next dist/cache on the OS temp drive.
 * Use when project lives on a slow / network drive and you see:
 * "Slow filesystem detected" for `.next/dev`.
 *
 * Usage: pnpm dev:local-cache
 */
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";

process.env.NS_LOCAL_NEXT_DIST = "1";

const dist = path.join(os.tmpdir(), "ns-perfume-next");
console.log(`[ns-perfume] Next distDir → ${dist}`);

const child = spawn("pnpm", ["exec", "next", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));

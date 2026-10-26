import type { NextConfig } from "next";

/**
 * NEXT_DIST_DIR runs a second dev server beside `pnpm dev` (each needs its own
 * build folder). It must be relative: Turbopack only writes inside the project root.
 */
const distDir = process.env.NEXT_DIST_DIR?.trim() || ".next";
const isDev = process.env.NODE_ENV !== "production";

/**
 * Pin the project root. A stray lockfile higher up (e.g. ~/package-lock.json)
 * otherwise makes Next infer the wrong workspace root.
 */
const projectRoot = process.cwd();

/** Next inlines bootstrap scripts, so script-src keeps 'unsafe-inline' (no nonce setup). */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src https://www.openstreetmap.org",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  // react-pdf renders invoices on the server; keep it out of the bundle and ship its fonts.
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/orders/*/invoice": ["./src/lib/invoice/fonts/**/*"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Hide the floating Next.js "N" badge so it does not cover CTAs while developing.
  devIndicators: false,
  distDir,
  // Keep fewer idle entries resident on cold disks
  onDemandEntries: {
    maxInactiveAge: 30 * 1000,
    pagesBufferLength: 2,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 80, 85, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;

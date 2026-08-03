import type { NextConfig } from "next";
import path from "node:path";
import os from "node:os";

/**
 * Slow filesystem warning: .next/dev on a network or throttled disk (e.g. D:)
 * can lag Turbopack. Optional local-temp dist when NS_LOCAL_NEXT_DIST=1.
 * @see https://nextjs.org/docs/app/guides/local-development
 */
const useLocalDist = process.env.NS_LOCAL_NEXT_DIST === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  distDir: useLocalDist
    ? path.join(os.tmpdir(), "ns-perfume-next")
    : ".next",
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

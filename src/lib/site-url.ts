import { siteConfig } from "@/data/site";

/**
 * Public origin of the storefront, without a trailing slash.
 * NEXT_PUBLIC_SITE_URL lets previews and staging link to themselves;
 * production falls back to the canonical domain in siteConfig.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (fromEnv || siteConfig.url).replace(/\/+$/, "");
}

/** Absolute URL for a path or an already absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return siteUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

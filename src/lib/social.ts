/**
 * Social accounts the owner enters in Settings. Only accounts with a link show
 * in the footer, in emails and in the store's structured data.
 */
export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", hosts: ["instagram.com"], example: "https://www.instagram.com/yourpage" },
  { key: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com"], example: "https://www.facebook.com/yourpage" },
  { key: "tiktok", label: "TikTok", hosts: ["tiktok.com"], example: "https://www.tiktok.com/@yourpage" },
  { key: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"], example: "https://www.youtube.com/@yourpage" },
  { key: "x", label: "X", hosts: ["x.com", "twitter.com"], example: "https://x.com/yourpage" },
  { key: "pinterest", label: "Pinterest", hosts: ["pinterest.com", "pin.it"], example: "https://www.pinterest.com/yourpage" },
] as const;

export type SocialKey = (typeof SOCIAL_PLATFORMS)[number]["key"];
export type SocialLink = { key: SocialKey; label: string; href: string };

/**
 * Clean https link on the platform's own site, or null. Accepts a link pasted
 * without https://. Anything else (other sites, javascript: links) is refused,
 * because this value becomes a public link on every page.
 */
export function parseSocialUrl(key: SocialKey, raw: string): string | null {
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);
  const value = raw.trim();
  if (!platform || !value) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const onPlatform = platform.hosts.some((h) => host === h || host.endsWith(`.${h}`));
  if (!onPlatform || url.username || url.password || url.pathname.length < 2) return null;
  url.protocol = "https:";
  return url.href;
}

/** Valid accounts from stored settings, in display order. */
export function socialLinksFrom(stored: unknown): SocialLink[] {
  const urls = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  const links: SocialLink[] = [];
  for (const { key, label } of SOCIAL_PLATFORMS) {
    const value = urls[key];
    const href = typeof value === "string" ? parseSocialUrl(key, value) : null;
    if (href) links.push({ key, label, href });
  }
  return links;
}

/** Check the Settings form: empty hides that platform; a wrong link is an error, not silently dropped. */
export function parseSocialForm(input: unknown) {
  const form = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const urls: Partial<Record<SocialKey, string>> = {};
  const errors: Record<string, string> = {};
  for (const { key, label, example } of SOCIAL_PLATFORMS) {
    const raw = typeof form[key] === "string" ? (form[key] as string).trim() : "";
    if (!raw) continue;
    const href = parseSocialUrl(key, raw);
    if (href) urls[key] = href;
    else errors[`social.${key}`] = `Enter the full link to your ${label} page, like ${example}`;
  }
  return { urls, errors };
}

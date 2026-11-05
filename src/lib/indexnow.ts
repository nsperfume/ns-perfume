import { after } from "next/server";
import { siteConfig } from "@/data/site";

/** Public by design: search engines check it against the matching file in /public. */
const INDEXNOW_KEY = "0a3f8405871710ace837ba0c9b118328";

/**
 * Tells Bing, Yandex and other IndexNow engines that pages changed, so they crawl
 * them soon after a save. Google does not take part; it finds changes through the
 * sitemap, which updates at the same moment (see revalidateStorefront). Runs after
 * the response is sent and never fails the save that triggered it.
 */
export function announcePages(paths: string[]) {
  // Only the live site: previews and local runs must not announce the real domain.
  if (process.env.VERCEL_ENV !== "production" || !paths.length) return;
  after(async () => {
    try {
      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: new URL(siteConfig.url).host,
          key: INDEXNOW_KEY,
          urlList: [...new Set(paths)].map((path) => `${siteConfig.url}${path}`),
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) console.warn(`[indexnow] not accepted: ${res.status}`);
    } catch (e) {
      console.warn("[indexnow] not sent", e);
    }
  });
}

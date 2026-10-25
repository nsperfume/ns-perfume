/**
 * Browser-safe rich text helpers (no sanitize-html, which belongs on the server).
 * Output is plain text that React escapes, so no sanitizing is needed here.
 */

/** True when the string contains meaningful rich-text markup. */
export function isRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value || "");
}

/** Strip tags and decode common entities for excerpts and summaries. */
export function htmlToPlain(html: string): string {
  if (!html) return "";
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

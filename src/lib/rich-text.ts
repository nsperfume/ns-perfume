import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "hr",
  "h2",
  "h3",
  "h4",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class"];

/** Sanitize HTML from the TipTap editor for safe storage and render. */
export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  }).trim();
}

/** True when the string contains meaningful rich-text markup. */
export function isRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value || "");
}

/** Strip tags for validation / excerpts / search. */
export function richTextToPlain(html: string): string {
  if (!html) return "";
  const cleaned = sanitizeRichHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return cleaned;
}

/** Convert legacy paragraph arrays (or plain text) into editor HTML. */
export function toRichHtml(input: string | string[] | undefined | null): string {
  if (!input) return "";
  if (Array.isArray(input)) {
    return input
      .map((p) => String(p).trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeText(p)}</p>`)
      .join("");
  }
  const text = String(input).trim();
  if (!text) return "";
  if (isRichHtml(text)) return sanitizeRichHtml(text);
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeText(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

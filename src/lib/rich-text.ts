import sanitizeHtml from "sanitize-html";

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

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "target", "rel", "class"],
  p: ["class"],
  h2: ["class"],
  h3: ["class"],
  h4: ["class"],
  blockquote: ["class"],
  ul: ["class"],
  ol: ["class"],
  li: ["class"],
  strong: ["class"],
  em: ["class"],
  b: ["class"],
  i: ["class"],
  u: ["class"],
  s: ["class"],
};

/**
 * Sanitize HTML from TipTap for safe storage and render.
 * Uses sanitize-html (no jsdom) so Next.js/Vercel SSR stays ESM-safe.
 * Never throws: on failure we escape to plain paragraphs so SSR cannot 500.
 */
export function sanitizeRichHtml(html: string): string {
  if (!html) return "";
  try {
    return sanitizeHtml(html, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: ALLOWED_ATTR,
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: {
        a: (_tagName, attribs) => ({
          tagName: "a",
          attribs: {
            ...attribs,
            rel: "noopener noreferrer",
            ...(attribs.target ? { target: "_blank" } : {}),
          },
        }),
      },
    }).trim();
  } catch (err) {
    console.error("[rich-text] sanitize failed; falling back to plain text", err);
    return `<p>${escapeText(stripTagsFallback(html))}</p>`;
  }
}

function stripTagsFallback(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the string contains meaningful rich-text markup. */
export function isRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value || "");
}

/** Strip tags for validation / excerpts / search. */
export function richTextToPlain(html: string): string {
  if (!html) return "";
  try {
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
  } catch {
    return stripTagsFallback(html);
  }
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

import { siteConfig, socialLinks } from "@/data/site";
import { absoluteUrl, siteUrl } from "@/lib/site-url";

/**
 * Email HTML building blocks. Table layout + inline styles so Gmail, Outlook,
 * Apple Mail and mobile clients render the same. Every dynamic string goes
 * through `esc()`; helpers that take `SafeHtml` only accept output of other helpers.
 */

export const palette = {
  page: "#F5F2EC",
  card: "#FFFFFF",
  chrome: "#0B0B0B",
  ink: "#111111",
  text: "#3A3A3A",
  muted: "#6B6B6B",
  line: "#E8E0D0",
  soft: "#FAF7F1",
  gold: "#A9873C",
  goldText: "#7C5B2B",
  danger: "#8B4A45",
};

const FONT_SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_MONO = "'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace";

/** Branded string type so raw text can't be passed where markup is expected. */
export type SafeHtml = { readonly __html: string };
const safe = (html: string): SafeHtml => ({ __html: html });
const join = (parts: SafeHtml[]) => parts.map((p) => p.__html).join("");

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatPkr(amount: number): string {
  return `Rs ${Math.round(Number(amount) || 0).toLocaleString("en-US")}`;
}

export function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date(value));
}

/* ---------- blocks ---------- */

export function eyebrow(text: string): SafeHtml {
  return safe(
    `<p style="margin:0 0 10px;font-family:${FONT_SANS};font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:${palette.goldText};font-weight:600;">${esc(text)}</p>`,
  );
}

export function heading(text: string): SafeHtml {
  return safe(
    `<h1 style="margin:0 0 16px;font-family:${FONT_SERIF};font-size:28px;line-height:34px;font-weight:normal;color:${palette.ink};">${esc(text)}</h1>`,
  );
}

export function subheading(text: string): SafeHtml {
  return safe(
    `<h2 style="margin:28px 0 12px;font-family:${FONT_SANS};font-size:12px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${palette.ink};">${esc(text)}</h2>`,
  );
}

/** Paragraph from text segments; `{ strong }` segments render bold. */
export function p(...segments: Array<string | { strong: string }>): SafeHtml {
  const inner = segments
    .map((s) =>
      typeof s === "string"
        ? esc(s)
        : `<strong style="color:${palette.ink};">${esc(s.strong)}</strong>`,
    )
    .join("");
  return safe(
    `<p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:15px;line-height:24px;color:${palette.text};">${inner}</p>`,
  );
}

export function small(text: string): SafeHtml {
  return safe(
    `<p style="margin:0 0 12px;font-family:${FONT_SANS};font-size:13px;line-height:20px;color:${palette.muted};">${esc(text)}</p>`,
  );
}

/** Bulletproof button (works in Outlook without images or VML). */
export function button(label: string, href: string): SafeHtml {
  return safe(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
<tr><td bgcolor="${palette.chrome}" style="border-radius:2px;">
<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT_SANS};font-size:12px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:2px;">${esc(label)}</a>
</td></tr></table>`);
}

export function divider(): SafeHtml {
  return safe(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:8px 0 24px;"><div style="height:1px;line-height:1px;font-size:0;background:${palette.line};">&nbsp;</div></td></tr></table>`,
  );
}

/** Highlighted reference, e.g. the order number. */
export function referenceBadge(label: string, value: string): SafeHtml {
  return safe(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<tr><td style="padding:12px 18px;background:${palette.soft};border:1px solid ${palette.line};border-radius:2px;">
<span style="font-family:${FONT_SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${palette.muted};">${esc(label)}</span><br>
<span style="font-family:${FONT_MONO};font-size:18px;line-height:26px;font-weight:700;letter-spacing:1px;color:${palette.ink};">${esc(value)}</span>
</td></tr></table>`);
}

/** Label / value rows inside a soft panel. Optional title and accent bar. */
export function panel(
  rows: Array<[string, string]>,
  opts: { title?: string; accent?: boolean; note?: string } = {},
): SafeHtml {
  const body = rows
    .map(
      ([k, v]) => `<tr>
<td valign="top" style="padding:5px 12px 5px 0;font-family:${FONT_SANS};font-size:13px;line-height:20px;color:${palette.muted};white-space:nowrap;">${esc(k)}</td>
<td valign="top" style="padding:5px 0;font-family:${FONT_SANS};font-size:13px;line-height:20px;color:${palette.ink};font-weight:600;word-break:break-word;">${esc(v)}</td>
</tr>`,
    )
    .join("");
  const title = opts.title
    ? `<p style="margin:0 0 10px;font-family:${FONT_SANS};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${palette.ink};">${esc(opts.title)}</p>`
    : "";
  const note = opts.note
    ? `<p style="margin:10px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:20px;color:${palette.text};">${esc(opts.note)}</p>`
    : "";
  return safe(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<tr><td style="padding:18px 20px;background:${palette.soft};border:1px solid ${palette.line};${opts.accent ? `border-left:3px solid ${palette.gold};` : ""}border-radius:2px;">
${title}<table role="presentation" cellpadding="0" cellspacing="0" border="0">${body}</table>${note}
</td></tr></table>`);
}

export type EmailLine = {
  productHandle?: string;
  name: string;
  sizeMl?: number;
  quantity: number;
  unitPricePkr: number;
  image?: string;
  giftWrap?: boolean;
};

export function itemsTable(lines: EmailLine[]): SafeHtml {
  const rows = lines
    .map((l) => {
      const img = l.image
        ? `<img src="${esc(absoluteUrl(l.image))}" width="56" height="70" alt="" style="display:block;width:56px;height:70px;object-fit:cover;border:1px solid ${palette.line};border-radius:2px;">`
        : `<div style="width:56px;height:70px;background:${palette.soft};border:1px solid ${palette.line};"></div>`;
      const meta = [l.sizeMl ? `${l.sizeMl} ml` : "", `Qty ${l.quantity}`].filter(Boolean).join(" · ");
      return `<tr>
<td width="68" valign="top" style="padding:12px 12px 12px 0;border-bottom:1px solid ${palette.line};">${img}</td>
<td valign="top" style="padding:12px 0;border-bottom:1px solid ${palette.line};font-family:${FONT_SANS};">
<p style="margin:0 0 4px;font-size:14px;line-height:20px;color:${palette.ink};font-weight:600;">${esc(l.name)}</p>
<p style="margin:0;font-size:12px;line-height:18px;color:${palette.muted};">${esc(meta)}</p>
</td>
<td valign="top" align="right" style="padding:12px 0 12px 12px;border-bottom:1px solid ${palette.line};font-family:${FONT_SANS};font-size:14px;line-height:20px;color:${palette.ink};white-space:nowrap;">${esc(formatPkr(l.unitPricePkr * l.quantity))}</td>
</tr>`;
    })
    .join("");
  return safe(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;border-top:1px solid ${palette.line};">${rows}</table>`,
  );
}

export function totalsTable(
  rows: Array<[string, string]>,
  total: [string, string],
): SafeHtml {
  const body = rows
    .map(
      ([k, v]) => `<tr>
<td style="padding:4px 0;font-family:${FONT_SANS};font-size:14px;line-height:20px;color:${palette.muted};">${esc(k)}</td>
<td align="right" style="padding:4px 0;font-family:${FONT_SANS};font-size:14px;line-height:20px;color:${palette.ink};">${esc(v)}</td>
</tr>`,
    )
    .join("");
  return safe(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
${body}
<tr><td colspan="2" style="padding-top:10px;"><div style="height:1px;line-height:1px;font-size:0;background:${palette.line};">&nbsp;</div></td></tr>
<tr>
<td style="padding:10px 0 0;font-family:${FONT_SANS};font-size:15px;font-weight:700;color:${palette.ink};">${esc(total[0])}</td>
<td align="right" style="padding:10px 0 0;font-family:${FONT_SANS};font-size:18px;font-weight:700;color:${palette.ink};white-space:nowrap;">${esc(total[1])}</td>
</tr></table>`);
}

/** Two equal columns (stack on narrow screens via the .stack class). */
export function columns(left: SafeHtml, right: SafeHtml): SafeHtml {
  return safe(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
<tr>
<td class="stack" width="50%" valign="top" style="padding-right:12px;">${left.__html}</td>
<td class="stack" width="50%" valign="top" style="padding-left:12px;">${right.__html}</td>
</tr></table>`);
}

export function addressLines(title: string, lines: string[]): SafeHtml {
  return safe(
    `<p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${palette.ink};">${esc(title)}</p>` +
      `<p style="margin:0 0 16px;font-family:${FONT_SANS};font-size:14px;line-height:22px;color:${palette.text};">${lines.filter(Boolean).map(esc).join("<br>")}</p>`,
  );
}

/* ---------- document ---------- */

export type LayoutOptions = {
  /** Inbox preview line (hidden in the body). */
  preheader: string;
  /** Shown in the footer: why the recipient got this email. */
  reason: string;
  /** Internal alerts skip the marketing footer. */
  internal?: boolean;
};

export function renderLayout(blocks: SafeHtml[], opts: LayoutOptions): string {
  const base = siteUrl();
  const logo = absoluteUrl("/brand/email-logo.png");
  const year = new Date().getFullYear();
  const social = socialLinks
    .filter((s) => ["instagram", "facebook", "tiktok"].includes(s.slug))
    .map(
      (s) =>
        `<a href="${esc(s.href)}" style="color:${palette.muted};text-decoration:underline;">${esc(s.label)}</a>`,
    )
    .join(" &nbsp;·&nbsp; ");
  const footer = opts.internal
    ? `<p style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:18px;color:${palette.muted};">${esc(opts.reason)}</p>`
    : `<p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:12px;line-height:18px;color:${palette.muted};">
Questions? Reply to this email, write to <a href="mailto:${esc(siteConfig.email)}" style="color:${palette.muted};">${esc(siteConfig.email)}</a> or WhatsApp <a href="https://wa.me/92${esc(siteConfig.phone.replace(/^0/, ""))}" style="color:${palette.muted};">${esc(siteConfig.phone)}</a>.
</p>
<p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:12px;line-height:18px;color:${palette.muted};">${social}</p>
<p style="margin:0 0 8px;font-family:${FONT_SANS};font-size:12px;line-height:18px;color:${palette.muted};">${esc(opts.reason)}</p>
<p style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:18px;color:${palette.muted};">${esc(siteConfig.name)} · ${esc(siteConfig.location.label)}, ${esc(siteConfig.location.detail)}, Pakistan · © ${year}</p>`;

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(siteConfig.name)}</title>
<style>
  body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
  a { color:${palette.ink}; }
  @media only screen and (max-width:620px) {
    .container { width:100% !important; }
    .pad { padding-left:22px !important; padding-right:22px !important; }
    .stack { display:block !important; width:100% !important; padding-left:0 !important; padding-right:0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${palette.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(opts.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${palette.page}" style="background:${palette.page};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
<tr><td bgcolor="${palette.chrome}" align="center" style="background:${palette.chrome};padding:26px 24px;">
<a href="${esc(base)}" target="_blank"><img src="${esc(logo)}" width="220" height="40" alt="${esc(siteConfig.name)}" style="display:block;width:220px;height:40px;border:0;color:#FFFFFF;font-family:${FONT_SERIF};font-size:20px;"></a>
</td></tr>
<tr><td style="height:3px;line-height:3px;font-size:0;background:${palette.gold};">&nbsp;</td></tr>
<tr><td class="pad" bgcolor="${palette.card}" style="background:${palette.card};padding:40px 44px 24px;">
${join(blocks)}
</td></tr>
<tr><td class="pad" bgcolor="${palette.card}" style="background:${palette.card};padding:0 44px 36px;">
<div style="height:1px;line-height:1px;font-size:0;background:${palette.line};margin-bottom:20px;">&nbsp;</div>
${footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ---------- plain text ---------- */

/** Plain-text alternative. Pass lines; empty strings become blank lines. */
export function renderText(lines: Array<string | false | null | undefined>): string {
  const body = lines.filter((l) => l !== false && l !== null && l !== undefined).join("\n");
  return `${body}\n\n--\n${siteConfig.name} · ${siteUrl()}\n${siteConfig.email} · WhatsApp ${siteConfig.phone}\n`;
}

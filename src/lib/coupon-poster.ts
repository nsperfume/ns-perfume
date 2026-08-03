import { siteConfig } from "@/data/site";

export type CouponPosterInput = {
  code: string;
  label: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotalPkr?: number;
  usageLimit?: number | null;
  expiresAt?: string | Date | null;
  posterBgMode?: "color" | "image";
  posterBgColor?: string;
  posterImageUrl?: string;
  posterHeadline?: string;
  posterSubcopy?: string;
};

export type PosterFormat = "story" | "square" | "landscape";

export const POSTER_FORMATS: Record<
  PosterFormat,
  { label: string; width: number; height: number }
> = {
  story: { label: "Story / Reel (1080×1350)", width: 1080, height: 1350 },
  square: { label: "Square ad (1080×1080)", width: 1080, height: 1080 },
  landscape: { label: "Landscape (1350×1080)", width: 1350, height: 1080 },
};

export const POSTER_COLOR_PRESETS = [
  { label: "Ink", value: "#1c1917" },
  { label: "Brass night", value: "#2c2419" },
  { label: "Forest", value: "#1a2a24" },
  { label: "Rosewood", value: "#3d221f" },
  { label: "Stone", value: "#3f3a34" },
  { label: "Paper", value: "#f3efe6" },
] as const;

export function couponOfferHeadline(c: CouponPosterInput): string {
  if (c.posterHeadline?.trim()) return c.posterHeadline.trim();
  if (c.type === "percent") return `${c.value}% off`;
  if (c.type === "fixed") return `Rs ${c.value.toLocaleString("en-PK")} off`;
  return "Free shipping";
}

export function couponOfferDetail(c: CouponPosterInput): string {
  if (c.posterSubcopy?.trim()) return c.posterSubcopy.trim();
  if (c.type === "free_shipping") {
    return "Complimentary standard shipping on your order";
  }
  if (c.label?.trim() && c.label.trim().toUpperCase() !== c.code) {
    return c.label.trim();
  }
  if (c.type === "percent") return "Save at checkout with this private code";
  return "Fixed discount applied at checkout";
}

function formatExpiry(expiresAt?: string | Date | null): string | null {
  if (!expiresAt) return null;
  const d = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src.trim()) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitCover(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
): { dx: number; dy: number; dw: number; dh: number } {
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const dw = imgW * scale;
  const dh = imgH * scale;
  return {
    dx: (boxW - dw) / 2,
    dy: (boxH - dh) / 2,
    dw,
    dh,
  };
}

/** Track letter-spacing by measuring glyphs when browser spacing is unreliable. */
function fillTextSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterPx: number,
  align: CanvasTextAlign = "left",
) {
  if (letterPx <= 0) {
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    return;
  }
  const chars = [...text];
  let total = 0;
  for (let i = 0; i < chars.length; i++) {
    total += ctx.measureText(chars[i]).width;
    if (i < chars.length - 1) total += letterPx;
  }
  let cursor = x;
  if (align === "center") cursor = x - total / 2;
  if (align === "right") cursor = x - total;
  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursor, y);
    cursor += ctx.measureText(chars[i]).width + letterPx;
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) {
        line = "";
        break;
      }
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  // Ellipsis last line if overflow remains
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export type DrawPosterOptions = {
  coupon: CouponPosterInput;
  format?: PosterFormat;
  brandName?: string;
  shopUrl?: string;
  /**
   * Pixel density for canvas buffer. Export uses a fixed 2× for crisp PNGs.
   * Preview uses device ratio capped at 2.
   */
  pixelRatio?: number;
  /** When true, do not touch CSS display size (export canvas / offline). */
  forExport?: boolean;
};

/**
 * Renders a social-ready coupon poster onto a canvas.
 * Layout is bottom-anchored for the code block so all formats stay balanced.
 */
export async function drawCouponPoster(
  canvas: HTMLCanvasElement,
  options: DrawPosterOptions,
): Promise<void> {
  const format = options.format || "story";
  const { width, height } = POSTER_FORMATS[format];
  const brand = (options.brandName || siteConfig.name).toUpperCase();
  const shop =
    (options.shopUrl || siteConfig.url).replace(/^https?:\/\//, "") ||
    "nsperfume.com";

  const dpr =
    options.pixelRatio ??
    Math.min(
      2,
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 2,
    );

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  // Preview: CSS parent controls display size. Never force 1080px inline styles.
  if (!options.forExport) {
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.objectFit = "contain";
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const c = options.coupon;
  const mode =
    c.posterBgMode === "image" && c.posterImageUrl?.trim() ? "image" : "color";
  const bg = c.posterBgColor || "#1c1917";
  let light = mode === "color" ? isLightHex(bg) : false;

  // —— Background ——
  if (mode === "image") {
    const img = await loadImage(c.posterImageUrl || "");
    if (img) {
      const fit = fitCover(img.naturalWidth, img.naturalHeight, width, height);
      ctx.drawImage(img, fit.dx, fit.dy, fit.dw, fit.dh);
      const veil = ctx.createLinearGradient(0, 0, 0, height);
      veil.addColorStop(0, "rgba(10,9,8,0.52)");
      veil.addColorStop(0.5, "rgba(10,9,8,0.38)");
      veil.addColorStop(1, "rgba(10,9,8,0.72)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, width, height);
      light = false;
    } else {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      light = isLightHex(bg);
    }
  } else {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.4,
      Math.min(width, height) * 0.1,
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.9,
    );
    vig.addColorStop(
      0,
      light ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
    );
    vig.addColorStop(1, light ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.28)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  const ink = light ? "#1c1917" : "#f7f3eb";
  const muted = light ? "rgba(28,25,23,0.64)" : "rgba(247,243,235,0.66)";
  const accent = light ? "#8a6a3a" : "#c4a574";
  const rule = light ? "rgba(28,25,23,0.16)" : "rgba(247,243,235,0.16)";
  const panelFill = light ? "rgba(28,25,23,0.05)" : "rgba(255,255,255,0.07)";
  const panelStroke = light ? "rgba(28,25,23,0.2)" : "rgba(196,165,116,0.5)";

  // Unit = 1% of the shorter side (stable type scale across formats)
  const u = Math.min(width, height) / 100;
  const padX = Math.round(width * 0.085);
  const padY = Math.round(height * 0.065);
  const contentW = width - padX * 2;
  const isLandscape = width > height * 1.05;
  const isSquare = Math.abs(width - height) < 40;

  // —— Bottom block (code + meta + url): layout bottom-up so nothing clips ——
  const shopSize = Math.round(u * 2.8);
  const metaSize = Math.round(u * 2.35);
  const codeCaptionSize = Math.round(u * 2.1);
  const codeSize = Math.round(isLandscape ? u * 5.5 : u * 6.2);
  const codeBoxH = Math.round(
    Math.max(u * 13, codeCaptionSize + codeSize + u * 5.5),
  );
  const gapShop = Math.round(u * 2.2);
  const gapMeta = Math.round(u * 2.4);
  const gapAboveCode = Math.round(u * 4);

  const shopY = height - padY - shopSize;
  const metaY = shopY - gapShop - metaSize;
  const codeBoxY = metaY - gapMeta - codeBoxH;
  const topContentMaxY = codeBoxY - gapAboveCode;

  // —— Top block ——
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  let y = padY;

  // Brand
  const brandSize = Math.round(u * 2.55);
  ctx.fillStyle = muted;
  ctx.font = `500 ${brandSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  fillTextSpaced(ctx, brand, padX, y, brandSize * 0.18, "left");
  y += brandSize + Math.round(u * 2.4);

  // Hairline
  ctx.strokeStyle = rule;
  ctx.lineWidth = Math.max(1, u * 0.1);
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(padX + contentW, y);
  ctx.stroke();
  y += Math.round(u * (isLandscape ? 4.5 : isSquare ? 5.5 : 6.5));

  // Eyebrow
  const eyeSize = Math.round(u * 2.2);
  ctx.fillStyle = accent;
  ctx.font = `600 ${eyeSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  fillTextSpaced(ctx, "COUPON OFFER", padX, y, eyeSize * 0.2, "left");
  y += eyeSize + Math.round(u * 2.8);

  // Headline: fit available room between top and code box
  const headline = couponOfferHeadline(c);
  const roomForHeadAndDetail = Math.max(0, topContentMaxY - y);
  // Reserve ~30% for subcopy when present
  const detailText = couponOfferDetail(c);
  const hasDetail = Boolean(detailText.trim());
  let headMaxH = hasDetail
    ? roomForHeadAndDetail * 0.62
    : roomForHeadAndDetail * 0.78;

  let headSize = Math.round(
    isLandscape ? u * 7.5 : isSquare ? u * 8.5 : u * 9.2,
  );
  // Shrink headline until 1–2 lines fit in allotted height
  for (let attempt = 0; attempt < 10; attempt++) {
    ctx.font = `500 ${headSize}px Georgia, "Times New Roman", serif`;
    const lines = wrapText(ctx, headline, contentW, 2);
    const lineH = headSize * 1.12;
    if (lines.length * lineH <= headMaxH || headSize <= u * 4.5) break;
    headSize = Math.round(headSize * 0.92);
  }

  ctx.fillStyle = ink;
  ctx.font = `500 ${headSize}px Georgia, "Times New Roman", serif`;
  const headLines = wrapText(ctx, headline, contentW, 2);
  const headLineH = headSize * 1.12;
  for (const line of headLines) {
    ctx.fillText(line, padX, y);
    y += headLineH;
  }
  y += Math.round(u * 2.2);

  // Subcopy
  if (hasDetail && y < topContentMaxY - u * 3) {
    let detailSize = Math.round(u * 2.9);
    const room = topContentMaxY - y;
    ctx.font = `400 ${detailSize}px Georgia, "Times New Roman", serif`;
    let detLines = wrapText(ctx, detailText, contentW, 3);
    while (
      detLines.length * detailSize * 1.35 > room &&
      detailSize > u * 2.1
    ) {
      detailSize = Math.round(detailSize * 0.92);
      ctx.font = `400 ${detailSize}px Georgia, "Times New Roman", serif`;
      detLines = wrapText(ctx, detailText, contentW, 2);
    }
    ctx.fillStyle = muted;
    ctx.font = `400 ${detailSize}px Georgia, "Times New Roman", serif`;
    detLines = wrapText(ctx, detailText, contentW, 2);
    const detLineH = detailSize * 1.35;
    for (const line of detLines) {
      if (y + detLineH > topContentMaxY) break;
      ctx.fillText(line, padX, y);
      y += detLineH;
    }
  }

  // —— Code card ——
  ctx.fillStyle = panelFill;
  ctx.strokeStyle = panelStroke;
  ctx.lineWidth = Math.max(1.25, u * 0.12);
  roundRect(ctx, padX, codeBoxY, contentW, codeBoxH, Math.round(u * 1.4));
  ctx.fill();
  ctx.stroke();

  ctx.textBaseline = "middle";
  const codeCenterY = codeBoxY + codeBoxH / 2;
  ctx.fillStyle = muted;
  ctx.font = `600 ${codeCaptionSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  fillTextSpaced(
    ctx,
    "USE CODE",
    width / 2,
    codeCenterY - codeBoxH * 0.18,
    codeCaptionSize * 0.22,
    "center",
  );

  ctx.fillStyle = ink;
  ctx.font = `600 ${codeSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  // Scale code if very long
  let codeDrawSize = codeSize;
  let code = c.code.toUpperCase();
  while (
    ctx.measureText(code).width > contentW * 0.88 &&
    codeDrawSize > u * 3.5
  ) {
    codeDrawSize = Math.round(codeDrawSize * 0.92);
    ctx.font = `600 ${codeDrawSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  }
  ctx.fillText(code, width / 2, codeCenterY + codeBoxH * 0.14);

  // —— Footer meta + shop ——
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const meta: string[] = [];
  if (c.minSubtotalPkr && c.minSubtotalPkr > 0) {
    meta.push(`Min order Rs ${c.minSubtotalPkr.toLocaleString("en-PK")}`);
  }
  const exp = formatExpiry(c.expiresAt);
  if (exp) meta.push(`Ends ${exp}`);
  if (c.usageLimit && c.usageLimit > 0) {
    meta.push(`Limited · ${c.usageLimit} uses`);
  }
  const metaLine = meta.join("  ·  ") || "Valid at checkout";

  ctx.fillStyle = muted;
  ctx.font = `400 ${metaSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  // Truncate meta if needed
  let metaDraw = metaLine;
  while (
    ctx.measureText(metaDraw).width > contentW &&
    metaDraw.length > 12
  ) {
    metaDraw = `${metaDraw.slice(0, -2)}…`;
  }
  ctx.fillText(metaDraw, padX, metaY);

  ctx.fillStyle = accent;
  ctx.font = `500 ${shopSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillText(shop, padX, shopY);

  // Reset
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** High-res export that always matches the designed layout (independent of preview CSS). */
export async function exportCouponPosterPng(
  options: DrawPosterOptions,
): Promise<string> {
  const canvas = document.createElement("canvas");
  await drawCouponPoster(canvas, {
    ...options,
    forExport: true,
    pixelRatio: 2,
  });
  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/** @deprecated Prefer exportCouponPosterPng for downloads */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  downloadDataUrl(canvas.toDataURL("image/png"), filename);
}

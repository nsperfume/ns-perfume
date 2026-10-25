/**
 * Brand glyphs from Simple Icons (single-path SVGs). Named imports keep the
 * bundle to the icons actually used.
 */
import { siFacebook, siInstagram, siPinterest, siTiktok, siWhatsapp, siX, siYoutube } from "simple-icons";
import { cn } from "@/lib/cn";

const ICONS = {
  whatsapp: siWhatsapp,
  instagram: siInstagram,
  facebook: siFacebook,
  tiktok: siTiktok,
  pinterest: siPinterest,
  x: siX,
  youtube: siYoutube,
} as const;

export type BrandIconName = keyof typeof ICONS;

export function BrandIcon({
  name,
  size = 18,
  className,
  title,
}: {
  name: BrandIconName;
  size?: number;
  className?: string;
  /** Set when the icon stands alone; otherwise it is decorative. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path d={ICONS[name].path} />
    </svg>
  );
}

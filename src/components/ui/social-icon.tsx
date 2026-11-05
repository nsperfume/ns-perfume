import {
  siFacebook,
  siInstagram,
  siPinterest,
  siTiktok,
  siX,
  siYoutube,
  type SimpleIcon,
} from "simple-icons";
import { cn } from "@/lib/cn";
import type { SocialKey } from "@/lib/social";

const ICONS: Record<SocialKey, SimpleIcon> = {
  instagram: siInstagram,
  facebook: siFacebook,
  pinterest: siPinterest,
  tiktok: siTiktok,
  x: siX,
  youtube: siYoutube,
};

export function SocialIcon({ platform, className }: { platform: SocialKey; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5 fill-current", className)}
      aria-hidden
    >
      <path d={ICONS[platform].path} />
    </svg>
  );
}

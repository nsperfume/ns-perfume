import { siteConfig } from "@/data/site";

/** wa.me link for a Pakistani number (0300... or +92300...), with an optional prefilled message. */
export function whatsappUrl(phone: string = siteConfig.phone, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  else if (!digits.startsWith("92")) digits = `92${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

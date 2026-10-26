import { cache } from "react";
import { connectDB } from "@/lib/db";
import { SiteSettingsModel } from "@/models/SiteSettings";
import {
  DEFAULT_CHECKOUT_CONFIG,
  defaultAnnouncement,
  normalizeCheckoutConfig,
  type CheckoutConfig,
} from "@/lib/checkout-config";

export type SiteSettingsData = {
  topbarText: string;
  topbarEnabled: boolean;
  checkout: CheckoutConfig;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  topbarText: defaultAnnouncement(DEFAULT_CHECKOUT_CONFIG),
  topbarEnabled: true,
  checkout: DEFAULT_CHECKOUT_CONFIG,
};

/** Admin copy sometimes ends with a stray separator ("... Pakistan ·"); trim it. */
function cleanAnnouncement(text: unknown) {
  return typeof text === "string" ? text.trim().replace(/[\s·|,-]+$/, "") : "";
}

async function loadSiteSettings(): Promise<SiteSettingsData> {
  try {
    await connectDB();
    let doc = await SiteSettingsModel.findOne({ key: "main" }).lean<Record<string, unknown>>();
    if (!doc) {
      doc = (
        await SiteSettingsModel.create({
          key: "main",
          topbarText: DEFAULT_SITE_SETTINGS.topbarText,
          topbarEnabled: DEFAULT_SITE_SETTINGS.topbarEnabled,
        })
      ).toObject() as Record<string, unknown>;
    }
    const checkout = normalizeCheckoutConfig(doc.checkout);
    return {
      topbarText: cleanAnnouncement(doc.topbarText) || defaultAnnouncement(checkout),
      topbarEnabled:
        typeof doc.topbarEnabled === "boolean"
          ? doc.topbarEnabled
          : DEFAULT_SITE_SETTINGS.topbarEnabled,
      checkout,
    };
  } catch (e) {
    // In production, fail loudly so ISR keeps the last good page instead of
    // caching default charges; locally the defaults keep the site browsable.
    if (process.env.NODE_ENV === "production") throw e;
    console.warn("Site settings: database unavailable, using defaults.", e);
    return DEFAULT_SITE_SETTINGS;
  }
}

/** Store settings, deduplicated per request. */
export const getSiteSettings = cache(loadSiteSettings);

/** Current store charges. Always read fresh for pricing an order. */
export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  return (await loadSiteSettings()).checkout;
}

import { cache } from "react";
import { connectDB } from "@/lib/db";
import { SiteSettingsModel } from "@/models/SiteSettings";
import { siteConfig } from "@/data/site";
import {
  DEFAULT_CHECKOUT_CONFIG,
  normalizeCheckoutConfig,
  type CheckoutConfig,
} from "@/lib/checkout-config";

export type SiteSettingsData = {
  topbarText: string;
  topbarEnabled: boolean;
  checkout: CheckoutConfig;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  topbarText: siteConfig.announcement,
  topbarEnabled: true,
  checkout: DEFAULT_CHECKOUT_CONFIG,
};

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
    return {
      topbarText: (doc.topbarText as string) || DEFAULT_SITE_SETTINGS.topbarText,
      topbarEnabled:
        typeof doc.topbarEnabled === "boolean"
          ? doc.topbarEnabled
          : DEFAULT_SITE_SETTINGS.topbarEnabled,
      checkout: normalizeCheckoutConfig(doc.checkout),
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

/** Store settings, deduplicated per request. */
export const getSiteSettings = cache(loadSiteSettings);

/** Current store charges. Always read fresh for pricing an order. */
export async function getCheckoutConfig(): Promise<CheckoutConfig> {
  return (await loadSiteSettings()).checkout;
}

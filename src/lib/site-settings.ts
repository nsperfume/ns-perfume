import { connectDB } from "@/lib/db";
import { SiteSettingsModel } from "@/models/SiteSettings";
import { siteConfig } from "@/data/site";

export type SiteSettingsData = {
  topbarText: string;
  topbarEnabled: boolean;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  topbarText: siteConfig.announcement,
  topbarEnabled: true,
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    await connectDB();
    let doc = await SiteSettingsModel.findOne({ key: "main" }).lean();
    if (!doc) {
      doc = (
        await SiteSettingsModel.create({
          key: "main",
          ...DEFAULT_SITE_SETTINGS,
        })
      ).toObject();
    }
    return {
      topbarText: doc.topbarText || DEFAULT_SITE_SETTINGS.topbarText,
      topbarEnabled:
        typeof doc.topbarEnabled === "boolean"
          ? doc.topbarEnabled
          : DEFAULT_SITE_SETTINGS.topbarEnabled,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

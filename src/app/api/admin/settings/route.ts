import { NextRequest, NextResponse } from "next/server";
import { adminDenied, isSuperAdmin, requireAdmin, requireAdminWrite } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SiteSettingsModel } from "@/models/SiteSettings";
import { getSiteSettings } from "@/lib/site-settings";
import { jsonError } from "@/lib/api";
import { revalidateStorefront } from "@/lib/revalidate";
import { validationError } from "@/lib/validation/catalog";
import { checkoutConfigSchema } from "@/lib/validation/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getSiteSettings();
  return NextResponse.json({ ok: true, data });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdminWrite();
  if (!admin) return adminDenied();

  try {
    const body = (await req.json().catch(() => null)) as {
      topbarText?: string;
      topbarEnabled?: boolean;
      checkout?: unknown;
    } | null;
    if (!body) return jsonError("Invalid request", 400);

    // Partial update: only the sections that were sent are changed.
    const set: Record<string, unknown> = {};
    if (body.topbarText !== undefined) {
      const topbarText = String(body.topbarText).trim();
      if (!topbarText) return jsonError("Top bar text is required.", 400, { fieldErrors: { topbarText: "Required" } });
      if (topbarText.length > 220) {
        return jsonError("Top bar text must be 220 characters or fewer.", 400, {
          fieldErrors: { topbarText: "220 characters or fewer" },
        });
      }
      set.topbarText = topbarText;
    }
    if (typeof body.topbarEnabled === "boolean") set.topbarEnabled = body.topbarEnabled;
    if (body.checkout !== undefined) {
      // Prices customers pay: owner only. Editors can still change the announcement.
      if (!isSuperAdmin(admin)) return jsonError("Only the owner can change store charges.", 403);
      const parsed = checkoutConfigSchema.safeParse(body.checkout);
      if (!parsed.success) return validationError(parsed.error);
      set.checkout = parsed.data;
    }
    if (!Object.keys(set).length) return jsonError("Nothing to save", 400);

    await connectDB();
    await SiteSettingsModel.findOneAndUpdate(
      { key: "main" },
      { $set: { key: "main", ...set } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    // Prices and the announcement bar are baked into cached pages.
    revalidateStorefront();
    return NextResponse.json({ ok: true, data: await getSiteSettings() });
  } catch (e) {
    console.error(e);
    return jsonError("Could not save settings", 500);
  }
}

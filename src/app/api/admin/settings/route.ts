import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SiteSettingsModel } from "@/models/SiteSettings";
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
} from "@/lib/site-settings";

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
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      topbarText?: string;
      topbarEnabled?: boolean;
    };

    const topbarText = (body.topbarText ?? "").trim();
    if (!topbarText) {
      return NextResponse.json(
        { ok: false, error: "Top bar text is required." },
        { status: 400 },
      );
    }
    if (topbarText.length > 220) {
      return NextResponse.json(
        { ok: false, error: "Top bar text must be 220 characters or fewer." },
        { status: 400 },
      );
    }

    await connectDB();
    const doc = await SiteSettingsModel.findOneAndUpdate(
      { key: "main" },
      {
        key: "main",
        topbarText,
        topbarEnabled:
          typeof body.topbarEnabled === "boolean"
            ? body.topbarEnabled
            : DEFAULT_SITE_SETTINGS.topbarEnabled,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({
      ok: true,
      data: {
        topbarText: doc?.topbarText || topbarText,
        topbarEnabled: Boolean(doc?.topbarEnabled),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

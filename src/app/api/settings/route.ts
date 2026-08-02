import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

/** Public storefront settings (topbar copy, feature flags). */
export async function GET() {
  const data = await getSiteSettings();
  return NextResponse.json({ ok: true, data });
}

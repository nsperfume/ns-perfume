import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { absoluteUrl } from "@/lib/site-url";
import { hashLinkToken } from "@/lib/tokens";
import { NewsletterSubscriberModel } from "@/models/NewsletterSubscriber";

async function unsubscribe(token: string | null) {
  if (!token) return false;
  await connectDB();
  const res = await NewsletterSubscriberModel.updateOne(
    { unsubscribeTokenHash: hashLinkToken(token) },
    { $set: { status: "unsubscribed", unsubscribedAt: new Date() } },
  );
  return res.matchedCount > 0;
}

/** Link in the email footer: unsubscribe, then show a confirmation page. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const ok = await unsubscribe(token).catch(() => false);
  return NextResponse.redirect(absoluteUrl(`/newsletter/unsubscribed${ok ? "" : "?invalid=1"}`));
}

/** RFC 8058 one-click unsubscribe (Gmail / Apple Mail "Unsubscribe" button). */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const ok = await unsubscribe(token).catch(() => false);
  return new NextResponse(null, { status: ok ? 200 : 404 });
}

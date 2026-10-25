import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { limitByIp } from "@/lib/rate-limit";
import { notifyNewsletterWelcome } from "@/lib/email";
import { createLinkToken } from "@/lib/tokens";
import { NewsletterSubscriberModel } from "@/models/NewsletterSubscriber";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  source: z.string().trim().max(40).optional().default("footer"),
});

export async function POST(req: Request) {
  try {
    const limited = limitByIp(req, "newsletter", 5, 30 * 60_000);
    if (limited) return limited;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Enter a valid email", 400);
    }
    const { email, source } = parsed.data;

    await connectDB();
    const existing = await NewsletterSubscriberModel.findOne({ email })
      .select("status")
      .lean<{ status?: string }>();
    // Already subscribed: same answer, no second welcome email.
    if (existing?.status === "subscribed") {
      return jsonOk({ subscribed: true });
    }

    const unsubscribe = createLinkToken();
    await NewsletterSubscriberModel.updateOne(
      { email },
      {
        $set: {
          status: "subscribed",
          source,
          unsubscribeTokenHash: unsubscribe.hash,
          unsubscribedAt: null,
        },
      },
      { upsert: true },
    );
    notifyNewsletterWelcome(email, unsubscribe.token);
    return jsonOk({ subscribed: true }, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Could not subscribe right now. Please try again.", 500);
  }
}

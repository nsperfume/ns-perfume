import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { mailConfig } from "@/lib/email/config";
import { EMAIL_CATALOG } from "@/lib/email/catalog";
import { EmailLogModel } from "@/models/EmailLog";
import { NewsletterSubscriberModel } from "@/models/NewsletterSubscriber";

/** Email settings status, template list, delivery log and newsletter subscribers. */
export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();

    const status = new URL(req.url).searchParams.get("status");
    const logFilter = status && ["sent", "failed", "skipped"].includes(status) ? { status } : {};
    const cfg = mailConfig();

    const [logs, subscribed, unsubscribed, recentSubscribers] = await Promise.all([
      EmailLogModel.find(logFilter).sort({ createdAt: -1 }).limit(100).lean(),
      NewsletterSubscriberModel.countDocuments({ status: "subscribed" }),
      NewsletterSubscriberModel.countDocuments({ status: "unsubscribed" }),
      NewsletterSubscriberModel.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select("email status source createdAt")
        .lean(),
    ]);

    return jsonOk({
      configured: Boolean(cfg),
      from: cfg?.from || "",
      replyTo: cfg?.replyTo || "",
      adminRecipients: cfg?.adminRecipients || [],
      host: cfg ? `${cfg.host}:${cfg.port}` : "",
      templates: EMAIL_CATALOG.map((t, index) => ({
        index,
        id: t.id,
        label: t.label,
        audience: t.audience,
        trigger: t.trigger,
      })),
      logs: logs.map((l) => ({
        id: String(l._id),
        template: l.template,
        to: l.to,
        subject: l.subject,
        status: l.status,
        error: l.error || "",
        ref: l.ref || "",
        createdAt: l.createdAt,
      })),
      subscribers: {
        subscribed,
        unsubscribed,
        recent: recentSubscribers.map((s) => ({
          email: s.email,
          status: s.status,
          source: s.source,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (e) {
    console.error(e);
    return jsonError("Could not load email settings", 500);
  }
}

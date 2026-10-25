import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { catalogEntry } from "@/lib/email/catalog";
import { sendEmail } from "@/lib/email/send";

const schema = z.object({
  index: z.number().int().nonnegative(),
  to: z.string().trim().email("Enter a valid email").max(200),
});

/** Send a sample now (not queued) so the admin sees SMTP errors immediately. */
export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError("Only the store owner can send test emails", 403);
  const limited = rateLimit(`email-test:${admin.sub}`, 10, 10 * 60_000);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid request", 400);
  const entry = catalogEntry(parsed.data.index);
  if (!entry) return jsonError("Unknown template", 404);

  const email = entry.render();
  const result = await sendEmail({
    template: entry.id,
    to: parsed.data.to,
    email: { ...email, subject: `[Test] ${email.subject}` },
    ref: "test",
  });
  if (result.status !== "sent") {
    return jsonError(
      result.status === "skipped"
        ? "Email sending is not set up yet. Ask your developer to connect the store email account."
        : `Send failed: ${result.error}`,
      502,
    );
  }
  return jsonOk({ sent: true });
}

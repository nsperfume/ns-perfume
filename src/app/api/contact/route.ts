import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { ContactMessageModel } from "@/models/ContactMessage";
import { limitByIp } from "@/lib/rate-limit";
import { notifyContact } from "@/lib/email";
import { contactFieldErrors, contactSchema } from "@/lib/validation/contact";

const RECEIVED =
  "Thanks. Our team usually replies within one business day, Monday to Friday.";

export async function POST(req: Request) {
  try {
    const limited = limitByIp(req, "contact", 5, 30 * 60_000);
    if (limited) return limited;
    const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object") return jsonError("Invalid message", 400);

    // Honeypot: people never see this field, bots fill it. Pretend it worked.
    if (typeof raw.website === "string" && raw.website.trim()) {
      return jsonOk({ message: RECEIVED }, { status: 201 });
    }

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = contactFieldErrors(parsed.error);
      return jsonError(
        Object.values(fieldErrors)[0] || "Check the highlighted fields",
        400,
        { fieldErrors },
      );
    }
    const data = parsed.data;

    await connectDB();
    const created = await ContactMessageModel.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      topic: data.topic,
      orderNumber: data.orderNumber,
      message: data.message,
      status: "new",
    });
    notifyContact(data, String(created._id));

    return jsonOk({ message: RECEIVED }, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Could not send your message. Please try again or WhatsApp us.", 500);
  }
}

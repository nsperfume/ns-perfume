import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { ContactMessageModel } from "@/models/ContactMessage";
import { limitByIp } from "@/lib/rate-limit";
import { notifyContact } from "@/lib/email";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  topic: z
    .enum(["order", "product", "shipping", "general"])
    .optional()
    .default("general"),
  message: z
    .string()
    .trim()
    .min(10, "Add a few more details so we can help")
    .max(4000),
});

export async function POST(req: Request) {
  try {
    const limited = limitByIp(req, "contact", 5, 30 * 60_000);
    if (limited) return limited;
    const raw = await req.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message || "Invalid message",
        400,
      );
    }

    await connectDB();
    const created = await ContactMessageModel.create({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      topic: parsed.data.topic,
      message: parsed.data.message,
      status: "new",
    });
    notifyContact(
      {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        topic: parsed.data.topic,
        message: parsed.data.message,
      },
      String(created._id),
    );

    return jsonOk(
      {
        message:
          "Thanks. Care usually replies within one business day on Mon to Fri.",
      },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return jsonError("Could not send message", 500);
  }
}

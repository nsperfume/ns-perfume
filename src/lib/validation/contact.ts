import { z } from "zod";
import { CONTACT_MESSAGE_MAX, CONTACT_TOPICS, type ContactTopic } from "@/lib/contact-topics";

const TOPIC_VALUES = CONTACT_TOPICS.map((t) => t.value) as [ContactTopic, ...ContactTopic[]];

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().default("");

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Keep your name under 80 characters"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  phone: optionalText(20, "Enter a valid phone number").refine(
    (v) => !v || /^\+?\d{10,15}$/.test(v.replace(/[\s()-]/g, "")),
    "Enter a valid phone number, for example 0300 1234567",
  ),
  topic: z.enum(TOPIC_VALUES, { error: "Choose a topic" }).default("general"),
  orderNumber: optionalText(20, "Order numbers are short, like NS-7K4Q2M").transform((v) => v.toUpperCase()),
  message: z
    .string()
    .trim()
    .min(10, "Add a few more details so we can help")
    .max(CONTACT_MESSAGE_MAX, `Keep it under ${CONTACT_MESSAGE_MAX.toLocaleString("en-US")} characters`),
});

export type ContactData = z.output<typeof contactSchema>;

/** First message per field, for showing errors under each input. */
export function contactFieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

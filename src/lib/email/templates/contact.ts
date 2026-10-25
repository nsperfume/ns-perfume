import { siteConfig } from "@/data/site";
import { absoluteUrl } from "@/lib/site-url";
import {
  button,
  eyebrow,
  heading,
  p,
  panel,
  renderLayout,
  renderText,
  small,
} from "@/lib/email/layout";
import type { EmailContent } from "@/lib/email/types";

export type ContactEmailData = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

const TOPIC_LABEL: Record<string, string> = {
  order: "An order",
  product: "A fragrance",
  shipping: "Shipping and returns",
  general: "General question",
};

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

function excerpt(message: string, max = 600) {
  const clean = message.trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}...` : clean;
}

/** Auto-reply to the customer so they know the message arrived. */
export function contactReceivedEmail(data: ContactEmailData): EmailContent {
  const topic = TOPIC_LABEL[data.topic] || TOPIC_LABEL.general;
  return {
    subject: `We received your message | ${siteConfig.name}`,
    html: renderLayout(
      [
        eyebrow("Message received"),
        heading(`Thanks for writing, ${first(data.name)}`),
        p(
          "Your message is with our team. We reply within one business day, usually sooner. For anything urgent about a delivery, WhatsApp us on ",
          { strong: siteConfig.phone },
          ".",
        ),
        panel(
          [
            ["Topic", topic],
            ["Your message", excerpt(data.message)],
          ],
          { title: "What you sent", accent: true },
        ),
        small("Reply to this email if you want to add details or photos."),
        button("Browse the collection", absoluteUrl("/products")),
      ],
      {
        preheader: "Your message is with our team. We reply within one business day.",
        reason: `You are receiving this email because you contacted ${siteConfig.name}.`,
      },
    ),
    text: renderText([
      `Thanks for writing, ${first(data.name)}.`,
      "",
      "Your message is with our team. We reply within one business day.",
      `Urgent delivery questions: WhatsApp ${siteConfig.phone}`,
      "",
      `Topic: ${topic}`,
      "Your message:",
      excerpt(data.message),
    ]),
  };
}

/** Alert to the store inbox. Reply-To is set to the customer by the sender. */
export function adminNewContactEmail(data: ContactEmailData): EmailContent {
  const topic = TOPIC_LABEL[data.topic] || TOPIC_LABEL.general;
  return {
    subject: `New message: ${topic} from ${data.name}`,
    html: renderLayout(
      [
        eyebrow("New contact message"),
        heading(`${data.name} wrote about ${topic.toLowerCase()}`),
        panel(
          [
            ["Name", data.name],
            ["Email", data.email],
            ["Topic", topic],
          ],
          { accent: true },
        ),
        p(data.message),
        small("Reply to this email to answer the customer directly."),
        button("Open contacts in admin", absoluteUrl("/admin/contacts")),
      ],
      {
        preheader: excerpt(data.message, 120),
        reason: "Internal notification for the NS Perfume store team.",
        internal: true,
      },
    ),
    text: renderText([
      `New message from ${data.name} <${data.email}>`,
      `Topic: ${topic}`,
      "",
      data.message,
      "",
      `Admin: ${absoluteUrl("/admin/contacts")}`,
    ]),
  };
}

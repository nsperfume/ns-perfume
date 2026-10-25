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

export function newsletterWelcomeEmail(data: { unsubscribeUrl: string }): EmailContent {
  return {
    subject: `You are on the list | ${siteConfig.name}`,
    html: renderLayout(
      [
        eyebrow("Newsletter"),
        heading("Thank you for subscribing"),
        p(
          "We write rarely and only when there is something worth reading: new releases, restocks of limited bottles, and seasonal guides on wearing fragrance in Pakistani heat and winter.",
        ),
        panel(
          [
            ["New releases", "First look before they reach the shop"],
            ["Restocks", "Limited editions when they return"],
            ["Guides", "Notes, layering and seasonal wear"],
          ],
          { title: "What to expect", accent: true },
        ),
        button("Read the journal", absoluteUrl("/journal")),
        small("You can unsubscribe at any time with one click."),
      ],
      {
        preheader: "New releases, restocks and seasonal scent guides. Rarely, and only when useful.",
        reason: `You are receiving this email because this address subscribed to the ${siteConfig.name} newsletter. Unsubscribe: ${data.unsubscribeUrl}`,
      },
    ),
    text: renderText([
      "Thank you for subscribing.",
      "",
      "We write rarely: new releases, restocks of limited bottles and seasonal guides.",
      "",
      `Read the journal: ${absoluteUrl("/journal")}`,
      `Unsubscribe: ${data.unsubscribeUrl}`,
    ]),
  };
}

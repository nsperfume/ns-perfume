import { siteConfig } from "@/data/site";
import { absoluteUrl } from "@/lib/site-url";
import { Cta, EmailLayout, Eyebrow, P, Panel, Title } from "@/emails/components";
import type { EmailDefinition } from "@/emails/types";

export function NewsletterWelcomeEmail({ unsubscribeUrl }: { unsubscribeUrl: string }) {
  return (
    <EmailLayout
      preview="New releases, restocks and seasonal scent guides. Rarely, and only when useful."
      reason={`You are receiving this email because this address subscribed to the ${siteConfig.name} newsletter.`}
    >
      <Eyebrow>Newsletter</Eyebrow>
      <Title>Thank you for subscribing</Title>
      <P>
        We write rarely and only when there is something worth reading: new releases, restocks of limited bottles, and
        seasonal guides on wearing fragrance in Pakistani heat and winter.
      </P>
      <Panel
        title="What to expect"
        accent
        rows={[
          ["New releases", "First look before they reach the shop"],
          ["Restocks", "Limited editions when they return"],
          ["Guides", "Notes, layering and seasonal wear"],
        ]}
      />
      <Cta href={absoluteUrl("/journal")}>Read the journal</Cta>
      <P muted>
        Changed your mind? <a href={unsubscribeUrl} style={{ color: "#6B6B6B" }}>Unsubscribe with one click</a>.
      </P>
    </EmailLayout>
  );
}

export const newsletterWelcome = (data: { unsubscribeUrl: string }): EmailDefinition => ({
  subject: `You are on the list | ${siteConfig.name}`,
  element: <NewsletterWelcomeEmail {...data} />,
});

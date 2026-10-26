import { siteConfig } from "@/data/site";
import { absoluteUrl } from "@/lib/site-url";
import { Cta, EmailLayout, Eyebrow, P, Panel, Strong, Title } from "@/emails/components";
import type { EmailDefinition } from "@/emails/types";
import { contactTopicLabel as topicLabel } from "@/lib/contact-topics";

export type ContactEmailData = {
  name: string;
  email: string;
  topic: string;
  message: string;
  phone?: string;
  orderNumber?: string;
};

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

function excerpt(message: string, max = 600) {
  const clean = message.trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}...` : clean;
}

export function ContactReceivedEmail({ data }: { data: ContactEmailData }) {
  return (
    <EmailLayout
      preview="Your message is with our team. We reply within one business day."
      reason={`You are receiving this email because you contacted ${siteConfig.name}.`}
    >
      <Eyebrow>Message received</Eyebrow>
      <Title>Thanks for writing, {first(data.name)}</Title>
      <P>
        Your message is with our team. We reply within one business day, usually sooner. For anything urgent about a
        delivery, WhatsApp us on <Strong>{siteConfig.phone}</Strong>.
      </P>
      <Panel
        title="What you sent"
        accent
        rows={[
          ["Topic", topicLabel(data.topic)],
          ...(data.orderNumber ? ([["Order number", data.orderNumber]] as Array<[string, string]>) : []),
          ["Your message", excerpt(data.message)],
        ]}
      />
      <P muted>Reply to this email if you want to add details or photos.</P>
      <Cta href={absoluteUrl("/products")}>Browse the collection</Cta>
    </EmailLayout>
  );
}

export const contactReceived = (data: ContactEmailData): EmailDefinition => ({
  subject: `We received your message | ${siteConfig.name}`,
  element: <ContactReceivedEmail data={data} />,
});

export function AdminNewContactEmail({ data }: { data: ContactEmailData }) {
  return (
    <EmailLayout internal preview={excerpt(data.message, 120)} reason="Internal notification for the NS Perfume store team.">
      <Eyebrow>New contact message</Eyebrow>
      <Title>Message from {data.name}</Title>
      <Panel
        accent
        rows={[
          ["Topic", topicLabel(data.topic)],
          ["Name", data.name],
          ["Email", data.email],
          ...(data.phone ? ([["Phone", data.phone]] as Array<[string, string]>) : []),
          ...(data.orderNumber ? ([["Order number", data.orderNumber]] as Array<[string, string]>) : []),
        ]}
      />
      <P>{data.message}</P>
      <P muted>Reply to this email to answer the customer directly.</P>
      <Cta href={absoluteUrl("/admin/contacts")}>Open contacts in admin</Cta>
    </EmailLayout>
  );
}

export const adminNewContact = (data: ContactEmailData): EmailDefinition => ({
  subject: `New message: ${topicLabel(data.topic)} from ${data.name}`,
  element: <AdminNewContactEmail data={data} />,
});

/**
 * Transactional email triggers. Route handlers call these after a successful
 * write; each one renders the template and queues it to send after the response.
 *
 *   order placed          → customer confirmation + store alert
 *   order status changed  → confirmed / shipped / delivered / cancelled
 *   account created       → welcome (with email confirmation link for password accounts)
 *   verification resent   → confirm email
 *   password reset        → reset link, then "password changed" notice
 *   contact form          → customer auto-reply + store alert (Reply-To = customer)
 *   newsletter signup     → welcome with one-click unsubscribe
 */
import { absoluteUrl } from "@/lib/site-url";
import { queueEmails } from "@/lib/email/send";
import {
  adminNewOrderEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  toOrderEmailData,
} from "@/lib/email/templates/orders";
import {
  passwordChangedEmail,
  passwordResetEmail,
  verifyEmailEmail,
  welcomeEmail,
} from "@/lib/email/templates/account";
import {
  adminNewContactEmail,
  contactReceivedEmail,
  type ContactEmailData,
} from "@/lib/email/templates/contact";
import { newsletterWelcomeEmail } from "@/lib/email/templates/newsletter";
import type { EmailTemplateId } from "@/lib/email/types";

export { sendEmail, queueEmails } from "@/lib/email/send";
export { emailConfigured } from "@/lib/email/config";

export function notifyOrderPlaced(order: Record<string, unknown>) {
  const data = toOrderEmailData(order);
  queueEmails(
    {
      template: "order-confirmation",
      to: data.email,
      content: orderConfirmationEmail(data),
      ref: data.orderNumber,
    },
    {
      template: "admin-new-order",
      to: "admin",
      content: adminNewOrderEmail(data),
      replyTo: data.email,
      ref: data.orderNumber,
    },
  );
}

/** Only call when the status actually changed. Pending has no email. */
export function notifyOrderStatus(order: Record<string, unknown>, status: string) {
  const data = toOrderEmailData(order);
  const content = orderStatusEmail(data, status);
  if (!content) return;
  queueEmails({
    template: `order-${status}` as EmailTemplateId,
    to: data.email,
    content,
    ref: data.orderNumber,
  });
}

export function verifyEmailUrl(token: string) {
  return absoluteUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function notifyWelcome(customer: { email: string; name: string }, verifyToken?: string) {
  queueEmails({
    template: "welcome",
    to: customer.email,
    content: welcomeEmail({
      name: customer.name,
      verifyUrl: verifyToken ? verifyEmailUrl(verifyToken) : undefined,
    }),
  });
}

export function notifyVerifyEmail(customer: { email: string; name: string }, verifyToken: string) {
  queueEmails({
    template: "verify-email",
    to: customer.email,
    content: verifyEmailEmail({ name: customer.name, verifyUrl: verifyEmailUrl(verifyToken) }),
  });
}

export function notifyPasswordReset(customer: { email: string; name: string }, resetToken: string) {
  queueEmails({
    template: "password-reset",
    to: customer.email,
    content: passwordResetEmail({
      name: customer.name,
      resetUrl: absoluteUrl(`/account/reset-password?token=${encodeURIComponent(resetToken)}`),
    }),
  });
}

export function notifyPasswordChanged(customer: { email: string; name: string }) {
  queueEmails({
    template: "password-changed",
    to: customer.email,
    content: passwordChangedEmail({ name: customer.name }),
  });
}

export function notifyContact(data: ContactEmailData, ref?: string) {
  queueEmails(
    { template: "contact-received", to: data.email, content: contactReceivedEmail(data), ref },
    {
      template: "admin-new-contact",
      to: "admin",
      content: adminNewContactEmail(data),
      replyTo: data.email,
      ref,
    },
  );
}

export function notifyNewsletterWelcome(email: string, unsubscribeToken: string) {
  const unsubscribeUrl = absoluteUrl(
    `/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
  );
  queueEmails({
    template: "newsletter-welcome",
    to: email,
    content: newsletterWelcomeEmail({ unsubscribeUrl }),
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

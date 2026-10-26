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
import { toOrderEmailData } from "@/emails/order-data";
import { adminNewOrder, orderConfirmation, orderStatus } from "@/emails/orders";
import { passwordChanged, passwordReset, verifyEmail, welcome } from "@/emails/account";
import { adminNewContact, contactReceived, type ContactEmailData } from "@/emails/contact";
import { newsletterWelcome } from "@/emails/newsletter";
import { adminInvite, adminPasswordChanged, adminPasswordReset } from "@/emails/team";
import type { EmailTemplateId } from "@/lib/email/types";

export { sendEmail, queueEmails, renderEmail } from "@/lib/email/send";
export { emailConfigured } from "@/lib/email/config";

export function notifyOrderPlaced(order: Record<string, unknown>) {
  const data = toOrderEmailData(order);
  queueEmails(
    { template: "order-confirmation", to: data.email, email: orderConfirmation(data), ref: data.orderNumber },
    { template: "admin-new-order", to: "admin", email: adminNewOrder(data), replyTo: data.email, ref: data.orderNumber },
  );
}

/** Only call when the status actually changed. Pending has no email. */
export function notifyOrderStatus(order: Record<string, unknown>, status: string) {
  const data = toOrderEmailData(order);
  const email = orderStatus(data, status);
  if (!email) return;
  queueEmails({ template: `order-${status}` as EmailTemplateId, to: data.email, email, ref: data.orderNumber });
}

export function verifyEmailUrl(token: string) {
  return absoluteUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function notifyWelcome(customer: { email: string; name: string }, verifyToken?: string) {
  queueEmails({
    template: "welcome",
    to: customer.email,
    email: welcome({ name: customer.name, verifyUrl: verifyToken ? verifyEmailUrl(verifyToken) : undefined }),
  });
}

export function notifyVerifyEmail(customer: { email: string; name: string }, verifyToken: string) {
  queueEmails({
    template: "verify-email",
    to: customer.email,
    email: verifyEmail({ name: customer.name, verifyUrl: verifyEmailUrl(verifyToken) }),
  });
}

export function notifyPasswordReset(customer: { email: string; name: string }, resetToken: string) {
  queueEmails({
    template: "password-reset",
    to: customer.email,
    email: passwordReset({
      name: customer.name,
      resetUrl: absoluteUrl(`/account/reset-password?token=${encodeURIComponent(resetToken)}`),
    }),
  });
}

export function notifyPasswordChanged(customer: { email: string; name: string }) {
  queueEmails({ template: "password-changed", to: customer.email, email: passwordChanged({ name: customer.name }) });
}

export function notifyContact(data: ContactEmailData, ref?: string) {
  queueEmails(
    { template: "contact-received", to: data.email, email: contactReceived(data), ref },
    { template: "admin-new-contact", to: "admin", email: adminNewContact(data), replyTo: data.email, ref },
  );
}

export function notifyNewsletterWelcome(email: string, unsubscribeToken: string) {
  const unsubscribeUrl = absoluteUrl(`/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`);
  queueEmails({
    template: "newsletter-welcome",
    to: email,
    email: newsletterWelcome({ unsubscribeUrl }),
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

/* ---------- admin team ---------- */

export function notifyAdminPasswordReset(user: { email: string; name: string }, resetToken: string) {
  queueEmails({
    template: "admin-password-reset",
    to: user.email,
    email: adminPasswordReset({
      name: user.name,
      resetUrl: absoluteUrl(`/admin/reset-password?token=${encodeURIComponent(resetToken)}`),
    }),
  });
}

export function notifyAdminPasswordChanged(user: { email: string; name: string }) {
  queueEmails({ template: "admin-password-changed", to: user.email, email: adminPasswordChanged({ name: user.name }) });
}

export function notifyAdminInvite(
  user: { email: string; name: string },
  details: { invitedBy: string; roleLabel: string; access: string },
) {
  queueEmails({ template: "admin-invite", to: user.email, email: adminInvite({ name: user.name, ...details }) });
}

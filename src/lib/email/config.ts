import { siteConfig } from "@/data/site";

/**
 * Mail settings from the environment.
 *
 * Gmail (default): SMTP_USER = the Gmail / Workspace address the app password belongs to,
 * SMTP_PASS (or APP_PASSWORD) = the 16 character app password.
 * Any other SMTP provider works by setting SMTP_HOST / SMTP_PORT as well.
 */
export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo: string;
  /** Store inboxes that receive new order / contact alerts. */
  adminRecipients: string[];
};

export function mailConfig(): MailConfig | null {
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = (process.env.SMTP_PASS || process.env.APP_PASSWORD || "").replace(/\s+/g, "");
  if (!user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);
  const fromAddress = process.env.MAIL_FROM_ADDRESS?.trim() || user;
  const fromName = process.env.MAIL_FROM_NAME?.trim() || siteConfig.name;
  const replyTo = process.env.MAIL_REPLY_TO?.trim() || siteConfig.email;
  const adminRecipients = (process.env.MAIL_ADMIN_TO || user)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    user,
    pass,
    from: `"${fromName}" <${fromAddress}>`,
    replyTo,
    adminRecipients,
  };
}

export function emailConfigured(): boolean {
  return mailConfig() !== null;
}

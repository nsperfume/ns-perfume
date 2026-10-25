import nodemailer, { type Transporter } from "nodemailer";
import { after } from "next/server";
import { render } from "react-email";
import { connectDB } from "@/lib/db";
import { mailConfig, type MailConfig } from "@/lib/email/config";
import type { EmailContent, EmailTemplateId } from "@/lib/email/types";
import type { EmailDefinition } from "@/emails/types";
import { EmailLogModel } from "@/models/EmailLog";

/** "admin" sends to MAIL_ADMIN_TO (the store inbox). */
export type Recipient = string | "admin";

export type OutgoingEmail = {
  template: EmailTemplateId;
  to: Recipient;
  /** React Email template; rendered to HTML + plain text at send time. */
  email: EmailDefinition;
  replyTo?: string;
  /** Order number, contact id, etc. Stored in the log. */
  ref?: string;
  headers?: Record<string, string>;
};

export type SendResult = { status: "sent" | "failed" | "skipped"; error?: string };

let transport: Transporter | null = null;
let transportKey = "";

function getTransport(cfg: MailConfig) {
  const key = `${cfg.host}:${cfg.port}:${cfg.user}`;
  if (!transport || key !== transportKey) {
    // No pooling: serverless functions don't keep sockets alive between requests.
    transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    transportKey = key;
  }
  return transport;
}

async function log(entry: {
  template: string;
  to: string;
  subject: string;
  status: SendResult["status"];
  error?: string;
  messageId?: string;
  ref?: string;
}) {
  try {
    await connectDB();
    await EmailLogModel.create(entry);
  } catch (e) {
    console.error("[email] could not write log", e);
  }
}

/** Plain-text alternative: readable key/value tables, no image or logo-link noise. */
const PLAIN_TEXT = {
  wordwrap: 90,
  selectors: [
    { selector: "table.kv", format: "dataTable", options: { colSpacing: 3, uppercaseHeaderCells: false } },
    { selector: "img", format: "skip" },
    { selector: "a.logo", format: "skip" },
    { selector: "h1", options: { uppercase: false } },
    { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
  ],
};

/** Render a React Email definition to subject, HTML and plain text. */
export async function renderEmail(email: EmailDefinition): Promise<EmailContent> {
  const [html, text] = await Promise.all([
    render(email.element),
    render(email.element, { plainText: true, htmlToTextOptions: PLAIN_TEXT }),
  ]);
  return { subject: email.subject, html, text };
}

/** Send one email now. Never throws; failures are logged and returned. */
export async function sendEmail(msg: OutgoingEmail): Promise<SendResult> {
  const cfg = mailConfig();
  const to = msg.to === "admin" ? (cfg?.adminRecipients ?? []).join(", ") : msg.to;
  const base = { template: msg.template, to: to || String(msg.to), subject: msg.email.subject, ref: msg.ref || "" };

  if (!cfg || !to) {
    console.warn(`[email] skipped "${msg.template}": SMTP_USER and SMTP_PASS (or APP_PASSWORD) are not set`);
    await log({ ...base, status: "skipped", error: "Email is not configured" });
    return { status: "skipped", error: "Email is not configured" };
  }

  try {
    const content = await renderEmail(msg.email);
    const info = await getTransport(cfg).sendMail({
      from: cfg.from,
      to,
      replyTo: msg.replyTo || cfg.replyTo,
      subject: content.subject,
      html: content.html,
      text: content.text,
      headers: msg.headers,
    });
    await log({ ...base, status: "sent", messageId: info.messageId });
    return { status: "sent" };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[email] "${msg.template}" to ${to} failed:`, error);
    await log({ ...base, status: "failed", error: error.slice(0, 500) });
    return { status: "failed", error };
  }
}

/**
 * Send after the HTTP response is finished (Vercel keeps the function alive via waitUntil),
 * so customers never wait on SMTP and a mail outage never fails an order.
 */
export function queueEmails(...messages: OutgoingEmail[]) {
  const run = async () => {
    for (const m of messages) await sendEmail(m);
  };
  try {
    after(run);
  } catch {
    // Outside a request scope (scripts, tests): send inline.
    void run();
  }
}

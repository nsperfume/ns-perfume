import { siteConfig } from "@/data/site";
import { absoluteUrl } from "@/lib/site-url";
import {
  button,
  divider,
  eyebrow,
  heading,
  p,
  panel,
  renderLayout,
  renderText,
  small,
} from "@/lib/email/layout";
import type { EmailContent } from "@/lib/email/types";

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

/** Sent once when an account is created. Includes the verify link for password accounts. */
export function welcomeEmail(data: { name: string; verifyUrl?: string }): EmailContent {
  const name = first(data.name);
  const blocks = [
    eyebrow("Welcome"),
    heading(`Welcome to ${siteConfig.name}, ${name}`),
    p(
      "Your account is ready. Every bottle on the site lists its top, heart and base notes with honest sillage and longevity ratings, so you can choose for the weather and the hours you actually wear it.",
    ),
  ];
  const text: Array<string | false> = [
    `Welcome to ${siteConfig.name}, ${name}.`,
    "",
    "Your account is ready. Every bottle lists its top, heart and base notes with honest sillage and longevity ratings.",
  ];
  if (data.verifyUrl) {
    blocks.push(
      p("Please confirm your email address. It lets us link past orders placed with this address to your account and keeps your account secure."),
      button("Confirm email address", data.verifyUrl),
      small("This link expires in 48 hours. If you did not create this account, you can ignore this email."),
    );
    text.push("", `Confirm your email address (link expires in 48 hours): ${data.verifyUrl}`);
  }
  blocks.push(
    divider(),
    panel(
      [
        ["Find your scent", "A short guide that matches notes to your taste"],
        ["Track orders", "Order history and delivery status in one place"],
        ["Wishlist", "Save bottles to compare later"],
      ],
      { title: "Your account" },
    ),
    button(data.verifyUrl ? "Visit the shop" : "Start exploring", absoluteUrl("/find-your-scent")),
  );
  text.push("", `Find your scent: ${absoluteUrl("/find-your-scent")}`);
  return {
    subject: `Welcome to ${siteConfig.name}`,
    html: renderLayout(blocks, {
      preheader: data.verifyUrl
        ? "Confirm your email address to finish setting up your account."
        : "Your account is ready. Here is where to start.",
      reason: `You are receiving this email because an account was created at ${siteConfig.name} with this address.`,
    }),
    text: renderText(text),
  };
}

export function verifyEmailEmail(data: { name: string; verifyUrl: string }): EmailContent {
  const name = first(data.name);
  return {
    subject: `Confirm your email address | ${siteConfig.name}`,
    html: renderLayout(
      [
        eyebrow("Confirm your email"),
        heading(`One quick step, ${name}`),
        p("Confirm this address to link your past orders to your account and to receive order updates here."),
        button("Confirm email address", data.verifyUrl),
        small("This link expires in 48 hours. If you did not ask for it, you can ignore this email."),
      ],
      {
        preheader: "Confirm your email address for your NS Perfume account.",
        reason: `You are receiving this email because a confirmation link was requested for your ${siteConfig.name} account.`,
      },
    ),
    text: renderText([
      `Hi ${name},`,
      "",
      "Confirm your email address (link expires in 48 hours):",
      data.verifyUrl,
    ]),
  };
}

export function passwordResetEmail(data: { name: string; resetUrl: string }): EmailContent {
  const name = first(data.name);
  return {
    subject: `Reset your password | ${siteConfig.name}`,
    html: renderLayout(
      [
        eyebrow("Password reset"),
        heading(`Reset your password, ${name}`),
        p("We received a request to reset the password for your account. Use the button below to choose a new one."),
        button("Choose a new password", data.resetUrl),
        small("This link expires in 1 hour and can be used once. If you did not request a reset, ignore this email and your password will stay the same."),
      ],
      {
        preheader: "Use this link within 1 hour to choose a new password.",
        reason: `You are receiving this email because a password reset was requested for your ${siteConfig.name} account.`,
      },
    ),
    text: renderText([
      `Hi ${name},`,
      "",
      "Choose a new password using this link (expires in 1 hour, single use):",
      data.resetUrl,
      "",
      "If you did not request a reset, ignore this email.",
    ]),
  };
}

export function passwordChangedEmail(data: { name: string }): EmailContent {
  const name = first(data.name);
  return {
    subject: `Your password was changed | ${siteConfig.name}`,
    html: renderLayout(
      [
        eyebrow("Security notice"),
        heading(`Your password was changed, ${name}`),
        p("The password for your account was just changed. You can now sign in with the new one."),
        p(
          "If this was not you, reset your password straight away and contact us at ",
          { strong: siteConfig.email },
          ".",
        ),
        button("Sign in", absoluteUrl("/account")),
      ],
      {
        preheader: "The password for your account was just changed.",
        reason: `Security notice for your ${siteConfig.name} account.`,
      },
    ),
    text: renderText([
      `Hi ${name},`,
      "",
      "The password for your account was just changed.",
      `If this was not you, reset your password and contact ${siteConfig.email}.`,
    ]),
  };
}

import { siteConfig } from "@/data/site";
import { absoluteUrl } from "@/lib/site-url";
import { Cta, Divider, EmailLayout, Eyebrow, P, Panel, Strong, Title } from "@/emails/components";
import type { EmailDefinition } from "@/emails/types";

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

export function WelcomeEmail({ name, verifyUrl }: { name: string; verifyUrl?: string }) {
  return (
    <EmailLayout
      preview={verifyUrl ? "Confirm your email address to finish setting up your account." : "Your account is ready. Here is where to start."}
      reason={`You are receiving this email because an account was created at ${siteConfig.name} with this address.`}
    >
      <Eyebrow>Welcome</Eyebrow>
      <Title>
        Welcome to {siteConfig.name}, {first(name)}
      </Title>
      <P>
        Your account is ready. Every bottle on the site lists its top, heart and base notes with honest sillage and
        longevity ratings, so you can choose for the weather and the hours you actually wear it.
      </P>
      {verifyUrl ? (
        <>
          <P>
            Please confirm your email address. It links past orders placed with this address to your account and keeps
            your account secure.
          </P>
          <Cta href={verifyUrl}>Confirm email address</Cta>
          <P muted>This link expires in 48 hours. If you did not create this account, you can ignore this email.</P>
        </>
      ) : null}
      <Divider />
      <Panel
        title="Your account"
        rows={[
          ["Find your scent", "A short guide that matches notes to your taste"],
          ["Track orders", "Order history and delivery status in one place"],
          ["Wishlist", "Save bottles to compare later"],
        ]}
      />
      <Cta href={absoluteUrl("/find-your-scent")}>Find your scent</Cta>
    </EmailLayout>
  );
}

export const welcome = (data: { name: string; verifyUrl?: string }): EmailDefinition => ({
  subject: `Welcome to ${siteConfig.name}`,
  element: <WelcomeEmail {...data} />,
});

export function VerifyEmail({ name, verifyUrl }: { name: string; verifyUrl: string }) {
  return (
    <EmailLayout
      preview="Confirm your email address for your NS Perfume account."
      reason={`You are receiving this email because a confirmation link was requested for your ${siteConfig.name} account.`}
    >
      <Eyebrow>Confirm your email</Eyebrow>
      <Title>One quick step, {first(name)}</Title>
      <P>Confirm this address to link your past orders to your account and to receive order updates here.</P>
      <Cta href={verifyUrl}>Confirm email address</Cta>
      <P muted>This link expires in 48 hours. If you did not ask for it, you can ignore this email.</P>
    </EmailLayout>
  );
}

export const verifyEmail = (data: { name: string; verifyUrl: string }): EmailDefinition => ({
  subject: `Confirm your email address | ${siteConfig.name}`,
  element: <VerifyEmail {...data} />,
});

export function PasswordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return (
    <EmailLayout
      preview="Use this link within 1 hour to choose a new password."
      reason={`You are receiving this email because a password reset was requested for your ${siteConfig.name} account.`}
    >
      <Eyebrow>Password reset</Eyebrow>
      <Title>Reset your password, {first(name)}</Title>
      <P>We received a request to reset the password for your account. Use the button below to choose a new one.</P>
      <Cta href={resetUrl}>Choose a new password</Cta>
      <P muted>
        This link expires in 1 hour and can be used once. If you did not request a reset, ignore this email and your
        password will stay the same.
      </P>
    </EmailLayout>
  );
}

export const passwordReset = (data: { name: string; resetUrl: string }): EmailDefinition => ({
  subject: `Reset your password | ${siteConfig.name}`,
  element: <PasswordResetEmail {...data} />,
});

export function PasswordChangedEmail({ name }: { name: string }) {
  return (
    <EmailLayout preview="The password for your account was just changed." reason={`Security notice for your ${siteConfig.name} account.`}>
      <Eyebrow>Security notice</Eyebrow>
      <Title>Your password was changed, {first(name)}</Title>
      <P>The password for your account was just changed. You can now sign in with the new one.</P>
      <P>
        If this was not you, reset your password straight away and contact us at <Strong>{siteConfig.email}</Strong>.
      </P>
      <Cta href={absoluteUrl("/account")}>Sign in</Cta>
    </EmailLayout>
  );
}

export const passwordChanged = (data: { name: string }): EmailDefinition => ({
  subject: `Your password was changed | ${siteConfig.name}`,
  element: <PasswordChangedEmail {...data} />,
});

import { siteConfig } from "@/data/site";
import { absoluteUrl } from "@/lib/site-url";
import { Cta, EmailLayout, Eyebrow, P, Panel, Strong, Title } from "@/emails/components";
import type { EmailDefinition } from "@/emails/types";

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";
const REASON = `Security email for your ${siteConfig.name} admin account.`;

/* ---------- admin: password reset link ---------- */

export function AdminPasswordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return (
    <EmailLayout internal preview="Use this link within 1 hour to choose a new admin password." reason={REASON}>
      <Eyebrow>Admin password reset</Eyebrow>
      <Title>Reset your admin password, {first(name)}</Title>
      <P>We received a request to reset the password for your {siteConfig.name} admin account.</P>
      <Cta href={resetUrl}>Choose a new password</Cta>
      <P muted>
        The link works once and expires in 1 hour. If you did not ask for this, ignore this email and your password stays
        the same. Signing in again with your current password keeps working.
      </P>
    </EmailLayout>
  );
}

export const adminPasswordReset = (data: { name: string; resetUrl: string }): EmailDefinition => ({
  subject: `Reset your admin password | ${siteConfig.name}`,
  element: <AdminPasswordResetEmail {...data} />,
});

/* ---------- admin: password changed notice ---------- */

export function AdminPasswordChangedEmail({ name }: { name: string }) {
  return (
    <EmailLayout internal preview="Your admin password was just changed and other sessions were signed out." reason={REASON}>
      <Eyebrow>Security notice</Eyebrow>
      <Title>Your admin password was changed, {first(name)}</Title>
      <P>
        The password for your {siteConfig.name} admin account was just changed, and every other signed-in device was
        signed out.
      </P>
      <P>
        If this was not you, reset your password straight away from the sign-in page and tell the store owner.
      </P>
      <Cta href={absoluteUrl("/admin/login")}>Open admin sign-in</Cta>
    </EmailLayout>
  );
}

export const adminPasswordChanged = (data: { name: string }): EmailDefinition => ({
  subject: `Your admin password was changed | ${siteConfig.name}`,
  element: <AdminPasswordChangedEmail {...data} />,
});

/* ---------- admin: added to the team ---------- */

export function AdminInviteEmail({
  name,
  invitedBy,
  roleLabel,
  access,
}: {
  name: string;
  invitedBy: string;
  roleLabel: string;
  access: string;
}) {
  return (
    <EmailLayout internal preview={`${invitedBy} added you to the ${siteConfig.name} admin as ${roleLabel}.`} reason={REASON}>
      <Eyebrow>Team access</Eyebrow>
      <Title>Welcome to the team, {first(name)}</Title>
      <P>
        <Strong>{invitedBy}</Strong> added you to the {siteConfig.name} admin.
      </P>
      <Panel
        accent
        rows={[
          ["Role", roleLabel],
          ["Access", access],
          ["Sign in at", absoluteUrl("/admin/login")],
        ]}
        note="Use the temporary password the owner shared with you. You will be asked to choose your own password when you first sign in."
      />
      <Cta href={absoluteUrl("/admin/login")}>Sign in to the admin</Cta>
    </EmailLayout>
  );
}

export const adminInvite = (data: {
  name: string;
  invitedBy: string;
  roleLabel: string;
  access: string;
}): EmailDefinition => ({
  subject: `You have been added to the ${siteConfig.name} admin`,
  element: <AdminInviteEmail {...data} />,
});

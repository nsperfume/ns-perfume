/**
 * Shared React Email building blocks for every NS Perfume email.
 * Table-based output from react-email + inline styles, so Gmail, Outlook,
 * Apple Mail and mobile clients render consistently.
 */
import type { CSSProperties, ReactNode } from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "react-email";
import { siteConfig, socialLinks } from "@/data/site";
import { absoluteUrl, siteUrl } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/whatsapp";

export const colors = {
  page: "#F5F2EC",
  card: "#FFFFFF",
  chrome: "#0B0B0B",
  ink: "#111111",
  text: "#3A3A3A",
  muted: "#6B6B6B",
  line: "#E8E0D0",
  soft: "#FAF7F1",
  brass: "#A9873C",
  brassText: "#7C5B2B",
};

const sans = "Manrope, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";

export function formatPkr(amount: number) {
  return `Rs ${Math.round(Number(amount) || 0).toLocaleString("en-US")}`;
}

export function formatDate(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date(value));
}

/* ---------- layout ---------- */

export function EmailLayout({
  preview,
  reason,
  internal = false,
  children,
}: {
  preview: string;
  /** Footer line: why the recipient got this email. */
  reason: string;
  /** Store-team alerts skip the customer footer. */
  internal?: boolean;
  children: ReactNode;
}) {
  const whatsapp = whatsappUrl(siteConfig.phone);
  // Brand icons (Simple Icons, pre-rendered PNG: Gmail and Outlook do not show SVG).
  const social = [
    ...socialLinks
      .filter((s) => ["instagram", "facebook", "tiktok"].includes(s.slug))
      .map((s) => ({ key: s.slug, label: s.label, href: s.href })),
    { key: "whatsapp", label: "WhatsApp", href: whatsapp },
  ];
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <Font
          fontFamily="Manrope"
          fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
          webFont={{ url: absoluteUrl("/fonts/manrope-latin-400-normal.woff2"), format: "woff2" }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Manrope"
          fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
          webFont={{ url: absoluteUrl("/fonts/manrope-latin-600-normal.woff2"), format: "woff2" }}
          fontWeight={600}
          fontStyle="normal"
        />
        {/* <Font> also sets a global font-family, so the serif is declared as a plain
            @font-face and only applied to headings. */}
        <style>{`@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:600;src:url(${absoluteUrl("/fonts/cormorant-garamond-latin-600-normal.woff2")}) format('woff2');}`}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "32px 12px", backgroundColor: colors.page, fontFamily: sans }}>
        <Container style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
          <Section style={{ backgroundColor: colors.chrome, padding: "26px 24px", textAlign: "center" }}>
            <Link href={siteUrl()} className="logo">
              <Img
                src={absoluteUrl("/brand/email-logo.png")}
                width="240"
                height="38"
                alt={siteConfig.name}
                style={{ display: "block", margin: "0 auto", border: 0, color: "#FFFFFF", fontFamily: serif, fontSize: 22 }}
              />
            </Link>
          </Section>
          <Section style={{ backgroundColor: colors.brass, height: 3, lineHeight: "3px", fontSize: 0 }}>&nbsp;</Section>
          <Section style={{ backgroundColor: colors.card, padding: "40px 44px 8px" }}>{children}</Section>
          <Section style={{ backgroundColor: colors.card, padding: "0 44px 36px" }}>
            <Hr style={{ borderColor: colors.line, margin: "0 0 20px" }} />
            {internal ? (
              <Text style={footerText}>{reason}</Text>
            ) : (
              <>
                <Text style={footerText}>
                  Questions? Reply to this email, write to{" "}
                  <Link href={`mailto:${siteConfig.email}`} style={footerLink}>
                    {siteConfig.email}
                  </Link>{" "}
                  or WhatsApp{" "}
                  <Link href={whatsapp} style={footerLink}>
                    {siteConfig.phoneDisplay}
                  </Link>
                  .
                </Text>
                <table role="presentation" className="social" cellPadding={0} cellSpacing={0} style={{ margin: "6px 0 14px" }}>
                  <tbody>
                    <tr>
                      {social.map((s) => (
                        <td key={s.key} style={{ paddingRight: 10 }}>
                          <Link href={s.href} title={s.label}>
                            <Img
                              src={absoluteUrl(`/brand/social/${s.key}.png`)}
                              width="30"
                              height="30"
                              alt={s.label}
                              style={{ display: "block", border: 0, fontSize: 11, color: colors.muted }}
                            />
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <Text style={footerText}>{reason}</Text>
                <Text style={{ ...footerText, margin: 0 }}>
                  {siteConfig.name} · {siteConfig.location.label}, {siteConfig.location.detail}, Pakistan ·{" "}
                  {new Date().getFullYear()}
                </Text>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const footerText: CSSProperties = { margin: "0 0 8px", fontSize: 12, lineHeight: "18px", color: colors.muted };
const footerLink: CSSProperties = { color: colors.muted, textDecoration: "underline" };

/* ---------- typography ---------- */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 10px",
        fontSize: 11,
        lineHeight: "16px",
        letterSpacing: "2px",
        textTransform: "uppercase",
        fontWeight: 600,
        color: colors.brassText,
      }}
    >
      {children}
    </Text>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h1"
      style={{ margin: "0 0 16px", fontFamily: serif, fontSize: 32, lineHeight: "38px", fontWeight: 600, color: colors.ink }}
    >
      {children}
    </Heading>
  );
}

export function Subtitle({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h2"
      style={{
        margin: "28px 0 12px",
        fontSize: 12,
        lineHeight: "16px",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        fontWeight: 700,
        color: colors.ink,
      }}
    >
      {children}
    </Heading>
  );
}

export function P({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontSize: muted ? 13 : 15,
        lineHeight: muted ? "20px" : "24px",
        color: muted ? colors.muted : colors.text,
      }}
    >
      {children}
    </Text>
  );
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong style={{ color: colors.ink, fontWeight: 600 }}>{children}</strong>;
}

/* ---------- blocks ---------- */

export function Cta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "8px 0 24px" }}>
      <Button
        href={href}
        style={{
          backgroundColor: colors.chrome,
          color: "#FFFFFF",
          padding: "14px 28px",
          fontSize: 12,
          lineHeight: "16px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontWeight: 700,
          borderRadius: 2,
          textDecoration: "none",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function Divider() {
  return <Hr style={{ borderColor: colors.line, margin: "8px 0 24px" }} />;
}

export function ReferenceBadge({ label, value }: { label: string; value: string }) {
  return (
    <Section style={{ margin: "0 0 24px" }}>
      <table role="presentation" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td style={{ padding: "12px 18px", backgroundColor: colors.soft, border: `1px solid ${colors.line}`, borderRadius: 2 }}>
              <span style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: colors.muted }}>{label}</span>
              <br />
              <span style={{ fontFamily: sans, fontSize: 18, lineHeight: "26px", fontWeight: 700, letterSpacing: "1px", color: colors.ink }}>
                {value}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

/** Label / value rows in a soft panel with an optional brass accent bar. */
export function Panel({
  title,
  rows,
  note,
  accent = false,
}: {
  title?: string;
  rows: Array<[string, string]>;
  note?: string;
  accent?: boolean;
}) {
  return (
    <Section
      style={{
        margin: "0 0 24px",
        padding: "18px 20px",
        backgroundColor: colors.soft,
        border: `1px solid ${colors.line}`,
        borderLeft: accent ? `3px solid ${colors.brass}` : `1px solid ${colors.line}`,
        borderRadius: 2,
      }}
    >
      {title ? (
        <Text style={{ margin: "0 0 10px", fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, color: colors.ink }}>
          {title}
        </Text>
      ) : null}
      <table role="presentation" className="kv" cellPadding={0} cellSpacing={0}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: "5px 14px 5px 0", fontSize: 13, lineHeight: "20px", color: colors.muted, whiteSpace: "nowrap", verticalAlign: "top" }}>
                {k}
              </td>
              <td style={{ padding: "5px 0", fontSize: 13, lineHeight: "20px", color: colors.ink, fontWeight: 600, verticalAlign: "top", wordBreak: "break-word" }}>
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {note ? <Text style={{ margin: "10px 0 0", fontSize: 13, lineHeight: "20px", color: colors.text }}>{note}</Text> : null}
    </Section>
  );
}

export type EmailLine = {
  productHandle?: string;
  name: string;
  sizeMl?: number;
  quantity: number;
  unitPricePkr: number;
  image?: string;
  giftMessage?: string;
};

export function LineItems({ lines }: { lines: EmailLine[] }) {
  return (
    <Section style={{ borderTop: `1px solid ${colors.line}`, margin: "0 0 8px" }}>
      {lines.map((l, i) => (
        <Row key={`${l.name}-${i}`} style={{ borderBottom: `1px solid ${colors.line}` }}>
          <Column style={{ width: 68, padding: "12px 12px 12px 0", verticalAlign: "top" }}>
            {l.image ? (
              <Img
                src={absoluteUrl(l.image)}
                width="56"
                height="70"
                alt=""
                style={{ display: "block", objectFit: "cover", border: `1px solid ${colors.line}`, borderRadius: 2 }}
              />
            ) : null}
          </Column>
          <Column style={{ padding: "12px 0", verticalAlign: "top" }}>
            <Text style={{ margin: "0 0 4px", fontSize: 14, lineHeight: "20px", fontWeight: 600, color: colors.ink }}>{l.name}</Text>
            <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: colors.muted }}>
              {[l.sizeMl ? `${l.sizeMl} ml` : "", `Qty ${l.quantity}`].filter(Boolean).join(" · ")}
            </Text>
            {l.giftMessage ? (
              <Text style={{ margin: "6px 0 0", fontSize: 12, lineHeight: "18px", color: colors.text, fontStyle: "italic" }}>
                Gift message: “{l.giftMessage}”
              </Text>
            ) : null}
          </Column>
          <Column align="right" style={{ padding: "12px 0 12px 12px", verticalAlign: "top", whiteSpace: "nowrap" }}>
            <Text style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: colors.ink }}>
              {formatPkr(l.unitPricePkr * l.quantity)}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

export function Totals({ rows, total }: { rows: Array<[string, string]>; total: [string, string] }) {
  const cell: CSSProperties = { padding: "4px 0", fontSize: 14, lineHeight: "20px" };
  return (
    <Section style={{ margin: "8px 0 24px" }}>
      <table role="presentation" className="kv" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ ...cell, color: colors.muted }}>{k}</td>
              <td align="right" style={{ ...cell, color: colors.ink }}>
                {v}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={{ padding: "10px 0 0" }}>
              <div style={{ height: 1, lineHeight: "1px", fontSize: 0, backgroundColor: colors.line }}>&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px 0 0", fontSize: 15, fontWeight: 700, color: colors.ink }}>{total[0]}</td>
            <td align="right" style={{ padding: "10px 0 0", fontSize: 18, fontWeight: 700, color: colors.ink, whiteSpace: "nowrap" }}>
              {total[1]}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function TwoColumns({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <Row style={{ margin: "0 0 8px" }}>
      <Column style={{ width: "50%", paddingRight: 12, verticalAlign: "top" }}>{left}</Column>
      <Column style={{ width: "50%", paddingLeft: 12, verticalAlign: "top" }}>{right}</Column>
    </Row>
  );
}

export function AddressBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <>
      <Text style={{ margin: "0 0 8px", fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, color: colors.ink }}>
        {title}
      </Text>
      <Text style={{ margin: "0 0 16px", fontSize: 14, lineHeight: "22px", color: colors.text }}>
        {lines.filter(Boolean).map((l, i) => (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {l}
          </span>
        ))}
      </Text>
    </>
  );
}

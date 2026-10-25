import path from "node:path";
import {
  Document,
  Font,
  G,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { siteConfig } from "@/data/site";
import { HORIZONTAL, MONOGRAM } from "@/components/brand/paths";
import { siteUrl } from "@/lib/site-url";
import type { OrderEmailData } from "@/emails/order-data";

/* Fonts ship with the repo (see outputFileTracingIncludes in next.config.ts). */
const fontDir = path.join(process.cwd(), "src/lib/invoice/fonts");
Font.register({
  family: "Manrope",
  fonts: [
    { src: path.join(fontDir, "manrope-latin-400-normal.woff"), fontWeight: 400 },
    { src: path.join(fontDir, "manrope-latin-600-normal.woff"), fontWeight: 600 },
  ],
});
Font.register({ family: "Cormorant", src: path.join(fontDir, "cormorant-garamond-latin-600-normal.woff"), fontWeight: 600 });
Font.register({ family: "PlexMono", src: path.join(fontDir, "ibm-plex-mono-latin-500-normal.woff"), fontWeight: 500 });
Font.registerHyphenationCallback((word) => [word]);

const C = { ink: "#111111", text: "#3A3A3A", muted: "#6B6B6B", line: "#E8E0D0", soft: "#FAF7F1", brass: "#A9873C" };

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 64, paddingHorizontal: 48, fontFamily: "Manrope", fontSize: 9.5, color: C.text, lineHeight: 1.45 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontFamily: "Cormorant", fontSize: 30, color: C.ink, textAlign: "right", lineHeight: 1 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  metaLabel: { color: C.muted, width: 70, textAlign: "right", marginRight: 8 },
  metaValue: { fontFamily: "PlexMono", color: C.ink, minWidth: 92, textAlign: "right" },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 22 },
  brassRule: { height: 2, backgroundColor: C.brass, marginTop: 20 },
  cols: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  label: { fontSize: 7.5, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, color: C.muted, marginBottom: 6 },
  strong: { fontWeight: 600, color: C.ink },
  th: { fontSize: 7.5, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, color: C.muted },
  tr: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: "flex-start" },
  cItem: { flex: 1, paddingRight: 8 },
  cSize: { width: 52, textAlign: "right" },
  cQty: { width: 36, textAlign: "right" },
  cPrice: { width: 78, textAlign: "right" },
  cAmount: { width: 84, textAlign: "right" },
  num: { fontFamily: "PlexMono", color: C.ink },
  totals: { marginLeft: "auto", width: 240, marginTop: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 9, marginTop: 6, borderTopWidth: 1, borderTopColor: C.ink },
  panel: { backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, borderLeftWidth: 3, borderLeftColor: C.brass, padding: 14, marginTop: 24 },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.muted },
});

function formatPkr(n: number) {
  return `Rs ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
}

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" }).format(new Date(d));
}

export function paymentStatus(o: Pick<OrderEmailData, "status" | "paymentMethod">) {
  if (o.status === "cancelled") return "Cancelled";
  if (o.status === "delivered") return "Paid";
  return o.paymentMethod === "bank" ? "Due by bank transfer" : "Due on delivery";
}

function LogoLockup() {
  const w = 168;
  const h = (w * HORIZONTAL.height) / HORIZONTAL.width;
  return (
    <Svg viewBox={`0 0 ${HORIZONTAL.width} ${HORIZONTAL.height}`} width={w} height={h}>
      <G transform={`scale(${HORIZONTAL.monogramScale})`}>
        <Path d={MONOGRAM.d} fill={C.brass} />
      </G>
      <Rect x={HORIZONTAL.rule.x} y={HORIZONTAL.rule.y} width={HORIZONTAL.rule.width} height={HORIZONTAL.rule.height} fill={C.brass} />
      <Path d={HORIZONTAL.wordmark} fill={C.ink} />
    </Svg>
  );
}

export function InvoiceDocument({ order: o }: { order: OrderEmailData }) {
  const a = o.shippingAddress;
  const status = paymentStatus(o);
  const domain = siteUrl().replace(/^https?:\/\//, "");
  return (
    <Document title={`Invoice ${o.orderNumber}`} author={siteConfig.name} subject={`${siteConfig.name} invoice`} creator={siteConfig.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <LogoLockup />
            <View style={{ marginTop: 14 }}>
              <Text style={s.strong}>{siteConfig.name}</Text>
              <Text>
                {siteConfig.location.label}, {siteConfig.location.detail}
              </Text>
              <Text>Punjab, Pakistan</Text>
              <Text>
                {siteConfig.phone} · {siteConfig.email}
              </Text>
              <Text>{domain}</Text>
            </View>
          </View>
          <View>
            <Text style={s.title}>Invoice</Text>
            <View style={[s.metaRow, { marginTop: 14 }]}>
              <Text style={s.metaLabel}>Invoice no.</Text>
              <Text style={s.metaValue}>{o.orderNumber.replace(/^NS-/, "INV-")}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Order no.</Text>
              <Text style={s.metaValue}>{o.orderNumber}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{formatDate(o.createdAt)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Payment</Text>
              <Text style={[s.metaValue, { fontFamily: "Manrope", fontWeight: 600 }]}>{status}</Text>
            </View>
          </View>
        </View>

        <View style={s.brassRule} />
        <View style={[s.cols, { marginTop: 20 }]}>
          <View style={s.col}>
            <Text style={s.label}>Billed to</Text>
            <Text style={s.strong}>{o.customerName || [a.firstName, a.lastName].filter(Boolean).join(" ")}</Text>
            <Text>{o.email}</Text>
            {o.phone || a.phone ? <Text>{o.phone || a.phone}</Text> : null}
          </View>
          <View style={s.col}>
            <Text style={s.label}>Ship to</Text>
            <Text style={s.strong}>{[a.firstName, a.lastName].filter(Boolean).join(" ")}</Text>
            {a.address1 ? <Text>{a.address1}</Text> : null}
            {a.address2 ? <Text>{a.address2}</Text> : null}
            <Text>{[a.city, a.province, a.postalCode].filter(Boolean).join(", ")}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.label}>Shipping</Text>
            <Text style={s.strong}>{o.shippingMethod?.title || "Standard"}</Text>
            {o.shippingMethod?.description ? <Text>{o.shippingMethod.description}</Text> : null}
            {o.carrier ? <Text>Courier: {o.carrier}</Text> : null}
            {o.trackingNumber ? <Text>Tracking: {o.trackingNumber}</Text> : null}
          </View>
        </View>

        <View style={[s.tr, { marginTop: 26, borderBottomColor: C.ink }]}>
          <Text style={[s.th, s.cItem]}>Item</Text>
          <Text style={[s.th, s.cSize]}>Size</Text>
          <Text style={[s.th, s.cQty]}>Qty</Text>
          <Text style={[s.th, s.cPrice]}>Unit price</Text>
          <Text style={[s.th, s.cAmount]}>Amount</Text>
        </View>
        {o.lines.map((l, i) => (
          <View key={`${l.name}-${i}`} style={s.tr} wrap={false}>
            <Text style={[s.cItem, s.strong]}>{l.name}</Text>
            <Text style={[s.cSize, s.num]}>{l.sizeMl ? `${l.sizeMl} ml` : ""}</Text>
            <Text style={[s.cQty, s.num]}>{l.quantity}</Text>
            <Text style={[s.cPrice, s.num]}>{formatPkr(l.unitPricePkr)}</Text>
            <Text style={[s.cAmount, s.num]}>{formatPkr(l.unitPricePkr * l.quantity)}</Text>
          </View>
        ))}

        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}>
            <Text>Subtotal</Text>
            <Text style={s.num}>{formatPkr(o.subtotalPkr)}</Text>
          </View>
          {o.discountPkr > 0 ? (
            <View style={s.totalRow}>
              <Text>Discount{o.discountCode ? ` (${o.discountCode})` : ""}</Text>
              <Text style={s.num}>- {formatPkr(o.discountPkr)}</Text>
            </View>
          ) : null}
          <View style={s.totalRow}>
            <Text>Shipping</Text>
            <Text style={s.num}>{o.shippingPkr > 0 ? formatPkr(o.shippingPkr) : "Free"}</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={[s.strong, { fontSize: 11 }]}>Total (PKR)</Text>
            <Text style={[s.num, { fontSize: 12 }]}>{formatPkr(o.totalPkr)}</Text>
          </View>
        </View>

        {o.paymentMethod === "bank" && status !== "Paid" && status !== "Cancelled" ? (
          <View style={s.panel} wrap={false}>
            <Text style={s.label}>Pay by bank transfer or wallet</Text>
            <Text>
              {siteConfig.bankTransfer.bankName} · {siteConfig.bankTransfer.accountTitle} · A/C {siteConfig.bankTransfer.accountNumber}
            </Text>
            <Text>IBAN {siteConfig.bankTransfer.iban}</Text>
            <Text>
              JazzCash / Easypaisa {siteConfig.wallets.jazzcash}. Use {o.orderNumber} as the reference and send the receipt on WhatsApp.
            </Text>
          </View>
        ) : null}
        {o.paymentMethod === "cod" && status === "Due on delivery" ? (
          <View style={s.panel} wrap={false}>
            <Text style={s.label}>Cash on delivery</Text>
            <Text>Please pay {formatPkr(o.totalPkr)} in cash to the courier when the parcel arrives.</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 28 }}>
          <Text style={s.strong}>Thank you for choosing {siteConfig.name}.</Text>
          <Text style={{ color: C.muted, marginTop: 4 }}>
            Questions about this invoice or a return: {siteConfig.email} or WhatsApp {siteConfig.phone}, quoting {o.orderNumber}. Returns follow
            the policy at {domain}/policies/refund.
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text>
            {siteConfig.name} · {domain} · Computer-generated invoice, no signature required.
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

import { absoluteUrl } from "@/lib/site-url";
import type { OrderEmailData } from "@/emails/order-data";
import { adminNewOrder, orderConfirmation, orderStatus } from "@/emails/orders";
import { passwordChanged, passwordReset, verifyEmail, welcome } from "@/emails/account";
import { adminNewContact, contactReceived } from "@/emails/contact";
import { newsletterWelcome } from "@/emails/newsletter";
import type { EmailDefinition } from "@/emails/types";
import type { EmailTemplateId } from "@/lib/email/types";

/** Realistic sample data so previews and test sends look like production mail. */
function sampleOrder(overrides: Partial<OrderEmailData> = {}): OrderEmailData {
  const now = Date.now();
  return {
    orderNumber: "NS-7K4Q2M",
    email: "ayesha.khan@example.com",
    customerName: "Ayesha Khan",
    phone: "03001234567",
    createdAt: new Date(now),
    status: "confirmed",
    lines: [
      { productHandle: "amber-noir-edp", name: "Amber Noir", sizeMl: 50, quantity: 1, unitPricePkr: 12400, image: "/assets/hero-image.webp" },
      { productHandle: "iris-solstice-edp", name: "Iris Solstice (Gift Wrap)", sizeMl: 30, quantity: 1, unitPricePkr: 9100, image: "/assets/sbc-for-her.webp" },
    ],
    subtotalPkr: 21500,
    discountPkr: 2150,
    discountCode: "WELCOME10",
    shippingPkr: 0,
    totalPkr: 19350,
    paymentMethod: "cod",
    shippingMethod: { title: "Standard", description: "3 to 5 business days" },
    shippingAddress: {
      firstName: "Ayesha",
      lastName: "Khan",
      address1: "House 12, Street 4, Model Town",
      city: "Lahore",
      province: "Punjab",
      postalCode: "54700",
      phone: "03001234567",
    },
    notes: "Please call before delivery.",
    estimatedDeliveryFrom: new Date(now + 3 * 86_400_000),
    estimatedDeliveryTo: new Date(now + 5 * 86_400_000),
    carrier: "TCS",
    trackingNumber: "TCS1234567890",
    trackingUrl: "",
    ...overrides,
  };
}

const contact = {
  name: "Ayesha Khan",
  email: "ayesha.khan@example.com",
  topic: "product",
  phone: "0300 1234567",
  message: "I wear Amber Noir in winter. Is there something lighter from your line for Lahore summers that still lasts through a work day?",
};

export type EmailCatalogEntry = {
  id: EmailTemplateId;
  label: string;
  audience: "Customer" | "Store team";
  trigger: string;
  render: () => EmailDefinition;
};

export const EMAIL_CATALOG: EmailCatalogEntry[] = [
  { id: "order-confirmation", label: "Order received (cash on delivery)", audience: "Customer", trigger: "Checkout completes", render: () => orderConfirmation(sampleOrder()) },
  { id: "order-confirmation", label: "Order received (bank transfer)", audience: "Customer", trigger: "Checkout completes with bank / wallet payment", render: () => orderConfirmation(sampleOrder({ paymentMethod: "bank" })) },
  { id: "order-confirmed", label: "Order confirmed", audience: "Customer", trigger: "Admin moves order to Confirmed", render: () => orderStatus(sampleOrder(), "confirmed")! },
  { id: "order-shipped", label: "Order shipped", audience: "Customer", trigger: "Admin moves order to Shipped", render: () => orderStatus(sampleOrder({ status: "shipped" }), "shipped")! },
  { id: "order-delivered", label: "Order delivered (review request)", audience: "Customer", trigger: "Admin moves order to Delivered", render: () => orderStatus(sampleOrder({ status: "delivered" }), "delivered")! },
  { id: "order-cancelled", label: "Order cancelled", audience: "Customer", trigger: "Admin cancels the order", render: () => orderStatus(sampleOrder({ status: "cancelled" }), "cancelled")! },
  { id: "admin-new-order", label: "New order alert", audience: "Store team", trigger: "Checkout completes", render: () => adminNewOrder(sampleOrder()) },
  { id: "welcome", label: "Welcome + confirm email", audience: "Customer", trigger: "Account created with email and password", render: () => welcome({ name: "Ayesha Khan", verifyUrl: absoluteUrl("/api/auth/verify-email?token=sample") }) },
  { id: "welcome", label: "Welcome (Google sign-in)", audience: "Customer", trigger: "First Google sign-in", render: () => welcome({ name: "Ayesha Khan" }) },
  { id: "verify-email", label: "Confirm email address", audience: "Customer", trigger: "Customer asks for a new confirmation link", render: () => verifyEmail({ name: "Ayesha Khan", verifyUrl: absoluteUrl("/api/auth/verify-email?token=sample") }) },
  { id: "password-reset", label: "Password reset", audience: "Customer", trigger: "Forgot password form", render: () => passwordReset({ name: "Ayesha Khan", resetUrl: absoluteUrl("/account/reset-password?token=sample") }) },
  { id: "password-changed", label: "Password changed", audience: "Customer", trigger: "Password reset completes", render: () => passwordChanged({ name: "Ayesha Khan" }) },
  { id: "contact-received", label: "Contact auto-reply", audience: "Customer", trigger: "Contact form submitted", render: () => contactReceived(contact) },
  { id: "admin-new-contact", label: "New message alert", audience: "Store team", trigger: "Contact form submitted", render: () => adminNewContact(contact) },
  { id: "newsletter-welcome", label: "Newsletter welcome", audience: "Customer", trigger: "Footer newsletter signup", render: () => newsletterWelcome({ unsubscribeUrl: absoluteUrl("/api/newsletter/unsubscribe?token=sample") }) },
];

export function catalogEntry(index: number) {
  return EMAIL_CATALOG[index] ?? null;
}

import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customer-auth";
import { invoiceToken, verifyInvoiceToken } from "@/lib/invoice/token";
import { CustomerModel } from "@/models/Customer";

/**
 * Who may download an invoice: the store team, the signed-in customer who owns
 * the order (by account, or by a verified email), or anyone holding the signed
 * link from the order emails / thank-you page.
 */
export async function canViewInvoice(
  order: { orderNumber: string; email: string; customerId?: string },
  token: string | null,
) {
  if (token && verifyInvoiceToken(order.orderNumber, token)) return true;
  if (await requireAdmin()) return true;

  const session = await getCustomerSession();
  if (!session) return false;
  if (order.customerId && order.customerId === session.sub) return true;
  if (order.email.toLowerCase() !== session.email.toLowerCase()) return false;
  await connectDB();
  const customer = await CustomerModel.findById(session.sub)
    .select("emailVerified")
    .lean<{ emailVerified?: boolean }>();
  return Boolean(customer?.emailVerified);
}

/** Relative URL of the signed invoice download for an order. */
export function invoicePath(orderNumber: string) {
  return `/api/orders/${encodeURIComponent(orderNumber)}/invoice?t=${invoiceToken(orderNumber)}`;
}

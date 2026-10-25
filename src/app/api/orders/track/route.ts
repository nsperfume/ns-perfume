import { siteConfig } from "@/data/site";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { OrderModel } from "@/models/Order";
import { limitByIp } from "@/lib/rate-limit";
import {
  buildTimeline,
  estimateDeliveryRange,
  resolveMapCoords,
  statusHeadline,
  statusSubcopy,
  type OrderStatus,
} from "@/lib/order-status";
import { invoicePath } from "@/lib/invoice/access";

function normalizeOrderNumber(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function POST(req: Request) {
  try {
    const limited = limitByIp(req, "track", 20, 10 * 60_000);
    if (limited) return limited;
    await connectDB();
    const body = await req.json();
    const orderNumber = normalizeOrderNumber(String(body.orderNumber || ""));
    const email = String(body.email || "").toLowerCase().trim();
    if (!orderNumber || !email) {
      return jsonError("Order number and email are required");
    }

    // Accept "NS-4821", "NS4821", "#4821" or "4821" (stored as NS-XXXX; legacy NS772829567).
    const core = orderNumber.replace(/^#/, "").replace(/^NS-?/, "");
    const variants = [orderNumber, `NS-${core}`, `NS${core}`];

    const order = await OrderModel.findOne({
      email,
      orderNumber: { $in: [...new Set(variants)] },
    }).lean();

    if (!order) {
      return jsonError(
        `We couldn't find an order with that number and email. Check both and try again, or email ${siteConfig.email}.`,
        404,
      );
    }

    const status = (order.status || "pending") as OrderStatus;
    const addr = (order.shippingAddress || {}) as {
      firstName?: string;
      lastName?: string;
      address1?: string;
      address2?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
      phone?: string;
      line1?: string;
    };

    const map = resolveMapCoords({
      address1: addr.address1 || addr.line1,
      city: addr.city,
      province: addr.province,
      country: addr.country,
    });

    const eta =
      order.estimatedDeliveryFrom && order.estimatedDeliveryTo
        ? {
            from: new Date(order.estimatedDeliveryFrom).toISOString(),
            to: new Date(order.estimatedDeliveryTo).toISOString(),
          }
        : estimateDeliveryRange(
            order.createdAt || new Date(),
            order.shippingMethod?.id,
          );

    const timeline = buildTimeline(status, {
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    });

    return jsonOk({
      orderNumber: order.orderNumber,
      invoiceUrl: invoicePath(String(order.orderNumber)),
      status,
      headline: statusHeadline(status),
      subcopy: statusSubcopy(status),
      timeline,
      map,
      email: order.email,
      phone: order.phone,
      customerName: order.customerName,
      currency: order.currency || "PKR",
      subtotalPkr: order.subtotalPkr,
      discountPkr: order.discountPkr || 0,
      discountCode: order.discountCode || "",
      shippingPkr: order.shippingPkr,
      taxPkr: order.taxPkr || 0,
      codFeePkr: order.codFeePkr || 0,
      taxIncludedPkr: order.taxIncludedPkr || 0,
      taxLabel: order.taxLabel || "",
      totalPkr: order.totalPkr,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      shippingAddress: {
        firstName: addr.firstName || "",
        lastName: addr.lastName || "",
        address1: addr.address1 || addr.line1 || "",
        address2: addr.address2 || "",
        city: addr.city || "",
        province: addr.province || "",
        postalCode: addr.postalCode || "",
        country: addr.country || "PK",
        phone: addr.phone || order.phone || "",
      },
      lines: order.lines || [],
      carrier: order.carrier || "",
      trackingNumber: order.trackingNumber || "",
      trackingUrl: order.trackingUrl || "",
      estimatedDelivery: eta,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Lookup failed", 500);
  }
}

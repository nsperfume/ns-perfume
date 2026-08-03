import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { OrderModel } from "@/models/Order";
import {
  buildTimeline,
  estimateDeliveryRange,
  resolveMapCoords,
  statusHeadline,
  statusSubcopy,
  type OrderStatus,
} from "@/lib/order-status";

function normalizeOrderNumber(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const orderNumber = normalizeOrderNumber(String(body.orderNumber || ""));
    const email = String(body.email || "").toLowerCase().trim();
    if (!orderNumber || !email) {
      return jsonError("Order number and email are required");
    }

    // Allow NS- prefix or plain digits
    const variants = [
      orderNumber,
      orderNumber.replace(/^#/, ""),
      orderNumber.startsWith("NS") ? orderNumber : `NS${orderNumber}`,
      orderNumber.replace(/^NS-?/, "NS"),
    ];

    const order = await OrderModel.findOne({
      email,
      orderNumber: { $in: [...new Set(variants)] },
    }).lean();

    if (!order) {
      return jsonError(
        "We couldn’t find an order with that number and email. Check both and try again, or email care@nsperfume.com.",
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

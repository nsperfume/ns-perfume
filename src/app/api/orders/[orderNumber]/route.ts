import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { OrderModel } from "@/models/Order";
import { estimateDeliveryRange } from "@/lib/order-status";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
});

type Params = { params: Promise<{ orderNumber: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);

    const { orderNumber: raw } = await params;
    const orderNumber = decodeURIComponent(raw).trim();

    await connectDB();
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonError("Invalid payload", 400, parsed.error.flatten());
    }

    const { status, carrier, trackingNumber, trackingUrl } = parsed.data;
    const order = await OrderModel.findOne({ orderNumber });
    if (!order) return jsonError("Order not found", 404);

    const now = new Date();
    order.status = status;

    if (status === "confirmed" && !order.confirmedAt) {
      order.confirmedAt = now;
    }
    if (status === "shipped") {
      if (!order.shippedAt) order.shippedAt = now;
      if (!order.confirmedAt) order.confirmedAt = now;
      if (carrier !== undefined) order.carrier = carrier;
      if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
      if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
      if (!order.trackingNumber) {
        order.trackingNumber = `TRK${Date.now().toString().slice(-10)}`;
      }
      if (!order.carrier) order.carrier = "NS Express";
      if (!order.trackingUrl) {
        order.trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://nsperfume.com"}/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`;
      }
    }
    if (status === "delivered") {
      if (!order.deliveredAt) order.deliveredAt = now;
      if (!order.shippedAt) order.shippedAt = now;
      if (!order.confirmedAt) order.confirmedAt = now;
    }
    if (status === "cancelled") {
      order.cancelledAt = now;
    }

    if (!order.estimatedDeliveryFrom || !order.estimatedDeliveryTo) {
      const eta = estimateDeliveryRange(
        order.createdAt || now,
        order.shippingMethod?.id,
      );
      order.estimatedDeliveryFrom = new Date(eta.from);
      order.estimatedDeliveryTo = new Date(eta.to);
    }

    await order.save();

    return jsonOk({
      orderNumber: order.orderNumber,
      status: order.status,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update order", 500);
  }
}

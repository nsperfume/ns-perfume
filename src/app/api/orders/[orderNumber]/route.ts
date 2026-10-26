import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, requireAdminWrite, adminDenied } from "@/lib/auth";
import { OrderModel } from "@/models/Order";
import {
  canTransitionOrderStatus,
  estimateDeliveryRange,
} from "@/lib/order-status";
import { releaseCoupon } from "@/lib/coupons";
import { notifyOrderStatus } from "@/lib/email";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  // Fulfillment details are stored exactly as the admin sends them.
  // Omitted = unchanged, empty string = cleared. Never auto-filled.
  carrier: z.string().trim().max(80).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
  trackingUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "Tracking link must start with http:// or https://",
    )
    .optional(),
});

type Params = { params: Promise<{ orderNumber: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);

    const { orderNumber: raw } = await params;
    const orderNumber = decodeURIComponent(raw).trim();
    if (!orderNumber) return jsonError("Order number required");

    await connectDB();
    const order = await OrderModel.findOne({ orderNumber }).lean();
    if (!order) return jsonError("Order not found", 404);

    return jsonOk(order);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load order", 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdminWrite();
    if (!admin) return adminDenied();

    const { orderNumber: raw } = await params;
    const orderNumber = decodeURIComponent(raw).trim();

    await connectDB();
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message || "Invalid payload",
        400,
        parsed.error.flatten(),
      );
    }

    const { status, carrier, trackingNumber, trackingUrl } = parsed.data;
    const order = await OrderModel.findOne({ orderNumber }).lean();
    if (!order) return jsonError("Order not found", 404);

    const from = String(order.status || "");
    if (!canTransitionOrderStatus(from, status)) {
      return jsonError(
        from === "cancelled"
          ? "Cancelled orders cannot be reopened. Ask the customer to place a new order."
          : `A ${from} order cannot be moved back to ${status}.`,
        409,
      );
    }

    const now = new Date();
    const set: Record<string, unknown> = { status };

    if (status === "confirmed" && !order.confirmedAt) {
      set.confirmedAt = now;
    }
    if (status === "shipped") {
      if (!order.shippedAt) set.shippedAt = now;
      if (!order.confirmedAt) set.confirmedAt = now;
    }
    if (status === "delivered") {
      if (!order.deliveredAt) set.deliveredAt = now;
      if (!order.shippedAt) set.shippedAt = now;
      if (!order.confirmedAt) set.confirmedAt = now;
    }
    const cancelling = status === "cancelled" && from !== "cancelled";
    if (cancelling) set.cancelledAt = now;

    if (carrier !== undefined) set.carrier = carrier;
    if (trackingNumber !== undefined) set.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) set.trackingUrl = trackingUrl;

    if (!order.estimatedDeliveryFrom || !order.estimatedDeliveryTo) {
      const eta = estimateDeliveryRange(
        order.createdAt || now,
        order.shippingMethod?.id,
        order.shippingMethod?.description,
      );
      set.estimatedDeliveryFrom = new Date(eta.from);
      set.estimatedDeliveryTo = new Date(eta.to);
    }

    // Compare-and-set on the status we validated, so two admins (or a double
    // click) cannot both cancel and release the coupon twice.
    const updated = await OrderModel.findOneAndUpdate(
      { _id: order._id, status: order.status },
      { $set: set },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!updated) {
      return jsonError(
        "This order was just updated elsewhere. Reload and try again.",
        409,
      );
    }

    // Give the coupon use back exactly once, on the move into cancelled.
    if (cancelling && updated.discountCode) {
      await releaseCoupon(String(updated.discountCode));
    }

    // Customer email only when the status really changed (not for tracking-only saves).
    if (from !== status) notifyOrderStatus(updated, status);

    return jsonOk({
      orderNumber: updated.orderNumber,
      status: updated.status,
      carrier: updated.carrier || "",
      trackingNumber: updated.trackingNumber || "",
      trackingUrl: updated.trackingUrl || "",
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update order", 500);
  }
}

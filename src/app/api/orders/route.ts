import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customer-auth";
import { OrderModel } from "@/models/Order";
import {
  FREE_SHIPPING_THRESHOLD_PKR,
  shippingPricePkr,
  type ShippingMethodId,
} from "@/lib/checkout";
import { redeemCoupon, releaseCoupon, resolveDiscount } from "@/lib/coupons";
import { estimateDeliveryRange } from "@/lib/order-status";
import {
  generateOrderNumber,
  generateOrderNumberFallback,
} from "@/lib/order-number";

const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional().default(""),
  address1: z.string().min(1),
  address2: z.string().optional().default(""),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().optional().default(""),
  country: z.string().min(2).default("PK"),
  phone: z.string().optional().default(""),
});

const lineSchema = z.object({
  productHandle: z.string().min(1),
  name: z.string().min(1),
  sizeMl: z.number().nonnegative(),
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPricePkr: z.number().nonnegative(),
  image: z.string().optional().default(""),
  isGift: z.boolean().optional(),
  giftMessage: z.string().optional(),
  giftWrap: z.boolean().optional(),
});

const createOrderSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional().default(""),
  lines: z.array(lineSchema).min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  billingSameAsShipping: z.boolean().optional().default(true),
  shippingMethodId: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["cod", "card", "bank"]),
  discountCode: z.string().optional().default(""),
  marketingOptIn: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
  currency: z.string().optional().default("PKR"),
  cardLast4: z.string().optional().default(""),
});

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const orders = await OrderModel.find().sort({ createdAt: -1 }).limit(100).lean();
    return jsonOk(orders);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load orders", 500);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getCustomerSession();
    const customerId = session?.sub || "";
    const raw = await req.json();
    const parsed = createOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError("Invalid order payload", 400, parsed.error.flatten());
    }

    const body = parsed.data;
    const subtotalPkr = body.lines.reduce(
      (sum, l) => sum + l.unitPricePkr * l.quantity,
      0,
    );

    const discount = body.discountCode
      ? await resolveDiscount(body.discountCode, subtotalPkr)
      : null;
    const discountPkr = discount?.amountPkr ?? 0;
    const afterDiscount = Math.max(0, subtotalPkr - discountPkr);

    const freeShipPromo = Boolean(discount?.freeShipping);
    let shippingPkr = shippingPricePkr(
      body.shippingMethodId as ShippingMethodId,
      afterDiscount,
    );
    if (freeShipPromo && body.shippingMethodId === "standard") {
      shippingPkr = 0;
    }
    if (
      body.shippingMethodId === "standard" &&
      afterDiscount >= FREE_SHIPPING_THRESHOLD_PKR
    ) {
      shippingPkr = 0;
    }

    const taxPkr = 0;
    const totalPkr = afterDiscount + shippingPkr + taxPkr;

    const shippingTitles: Record<string, string> = {
      standard: "Standard",
      express: "Express",
    };
    const shippingDescriptions: Record<string, string> = {
      standard: "3 to 5 business days",
      express: "1 to 2 business days",
    };

    const customerName = [
      body.shippingAddress.firstName,
      body.shippingAddress.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    let orderNumber = generateOrderNumber();
    for (let attempt = 0; attempt < 12; attempt++) {
      const taken = await OrderModel.exists({ orderNumber });
      if (!taken) break;
      orderNumber =
        attempt < 8 ? generateOrderNumber() : generateOrderNumberFallback();
    }

    const status =
      body.paymentMethod === "cod" || body.paymentMethod === "bank"
        ? "confirmed"
        : "pending";

    const billing =
      body.billingSameAsShipping || !body.billingAddress
        ? body.shippingAddress
        : body.billingAddress;

    const now = new Date();
    const eta = estimateDeliveryRange(now, body.shippingMethodId);

    if (body.discountCode?.trim() && !discount) {
      return jsonError("Discount code is invalid or no longer available", 400);
    }

    // Reserve a use before creating the order (atomic usageLimit check).
    let reservedCode: string | null = null;
    if (discount?.code) {
      const reserved = await redeemCoupon(discount.code);
      if (!reserved) {
        return jsonError(
          "This discount code has reached its usage limit or is no longer available",
          400,
        );
      }
      reservedCode = discount.code;
    }

    try {
      const created = await OrderModel.create({
        orderNumber,
        email: body.email.toLowerCase().trim(),
        phone: body.phone || body.shippingAddress.phone || "",
        customerName,
        customerId: customerId || "",
        status,
        currency: body.currency || "PKR",
        subtotalPkr,
        discountPkr,
        discountCode: discount?.code || "",
        shippingPkr,
        taxPkr,
        totalPkr,
        lines: body.lines.map((l) => ({
          productHandle: l.productHandle,
          name: l.name,
          sizeMl: l.sizeMl,
          sku: l.sku,
          quantity: l.quantity,
          unitPricePkr: l.unitPricePkr,
          image: l.image,
          isGift: l.isGift ?? false,
          giftMessage: l.giftMessage || "",
          giftWrap: l.giftWrap ?? false,
        })),
        shippingAddress: {
          ...body.shippingAddress,
          line1: body.shippingAddress.address1,
        },
        billingAddress: {
          ...billing,
          line1: billing.address1,
        },
        billingSameAsShipping: body.billingSameAsShipping !== false,
        shippingMethod: {
          id: body.shippingMethodId,
          title: shippingTitles[body.shippingMethodId],
          description: shippingDescriptions[body.shippingMethodId],
        },
        paymentMethod: body.paymentMethod,
        cardLast4: body.cardLast4?.slice(-4) || "",
        marketingOptIn: body.marketingOptIn ?? false,
        notes: body.notes || "",
        estimatedDeliveryFrom: new Date(eta.from),
        estimatedDeliveryTo: new Date(eta.to),
        confirmedAt: status === "confirmed" ? now : null,
      });

      return jsonOk(
        {
          orderNumber: created.orderNumber,
          email: created.email,
          status: created.status,
          totalPkr: created.totalPkr,
          subtotalPkr: created.subtotalPkr,
          shippingPkr: created.shippingPkr,
          discountPkr: created.discountPkr,
          discountCode: created.discountCode,
          currency: created.currency,
          paymentMethod: created.paymentMethod,
          shippingMethod: created.shippingMethod,
          shippingAddress: created.shippingAddress,
          lines: created.lines,
          customerName: created.customerName,
          phone: created.phone,
          createdAt: created.createdAt,
        },
        { status: 201 },
      );
    } catch (createErr) {
      if (reservedCode) await releaseCoupon(reservedCode);
      throw createErr;
    }
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create order", 500);
  }
}

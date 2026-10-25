import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customer-auth";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { GIFT_WRAP_FEE_PKR } from "@/lib/types";
import { limitByIp } from "@/lib/rate-limit";
import { emailConfigured, notifyOrderPlaced } from "@/lib/email";
import {
  FREE_SHIPPING_THRESHOLD_PKR,
  shippingPricePkr,
  type ShippingMethodId,
} from "@/lib/checkout";
import { redeemCoupon, releaseCoupon, resolveDiscount } from "@/lib/coupons";
import { estimateDeliveryRange } from "@/lib/order-status";
import { generateOrderNumber } from "@/lib/order-number";
import { invoicePath } from "@/lib/invoice/access";

const field = (max = 200) => z.string().max(max);

const addressSchema = z.object({
  firstName: field(80).min(1),
  lastName: field(80).min(1),
  company: field(120).optional().default(""),
  address1: field().min(1),
  address2: field().optional().default(""),
  city: field(80).min(1),
  province: field(80).min(1),
  postalCode: field(20).optional().default(""),
  country: field(2).min(2).default("PK"),
  phone: field(30).optional().default(""),
});

/**
 * Client lines identify what to buy. Name, price and size are re-read from the
 * catalog; `unitPricePkr` is only the price the shopper saw, used to detect changes.
 */
const lineSchema = z.object({
  productHandle: field(120).min(1),
  name: field().min(1),
  sizeMl: z.number().nonnegative(),
  sku: field(80).min(1),
  quantity: z.number().int().positive().max(20),
  unitPricePkr: z.number().nonnegative(),
  image: field(500).optional().default(""),
  isGift: z.boolean().optional(),
  giftMessage: field(300).optional(),
  giftWrap: z.boolean().optional(),
});

type ProductForPricing = {
  handle: string;
  name: string;
  inStock?: boolean;
  imagePrimary?: string;
  sizes: { ml: number; pricePkr: number; sku: string }[];
};

/** Re-price cart lines from the catalog. Returns an error message for the shopper on mismatch. */
async function priceLines(lines: z.infer<typeof lineSchema>[]) {
  const handles = [...new Set(lines.map((l) => l.productHandle))];
  const products = await ProductModel.find({
    handle: { $in: handles },
    status: "active",
  })
    .select("handle name inStock imagePrimary sizes")
    .lean<ProductForPricing[]>();
  const byHandle = new Map(products.map((p) => [p.handle, p]));

  const priced = [];
  for (const l of lines) {
    const product = byHandle.get(l.productHandle);
    const baseSku = l.sku.replace(/-GIFT$/, "");
    const size =
      product?.sizes.find((s) => s.sku === baseSku) ??
      product?.sizes.find((s) => s.ml === l.sizeMl);
    if (!product || !size) {
      return { error: `${l.name} is no longer available. Remove it from your bag to continue.` };
    }
    if (product.inStock === false) {
      return { error: `${product.name} is out of stock. Remove it from your bag to continue.` };
    }
    const wrap = Boolean(l.isGift && l.giftWrap);
    const unitPricePkr = size.pricePkr + (wrap ? GIFT_WRAP_FEE_PKR : 0);
    // Never charge more than the shopper was shown. A lower catalog price is honored.
    if (unitPricePkr > l.unitPricePkr) {
      return {
        error: `The price of ${product.name} ${size.ml}ml changed since it was added. Remove it and add it again to see the current price.`,
      };
    }
    priced.push({
      productHandle: product.handle,
      name: wrap ? `${product.name} (Gift Wrap)` : product.name,
      sizeMl: size.ml,
      sku: wrap ? `${size.sku}-GIFT` : size.sku,
      quantity: l.quantity,
      unitPricePkr,
      image: product.imagePrimary || "",
      isGift: l.isGift ?? false,
      giftMessage: l.giftMessage || "",
      giftWrap: wrap,
    });
  }
  return { lines: priced };
}

const createOrderSchema = z.object({
  email: z.string().email().max(200),
  phone: field(30).optional().default(""),
  lines: z.array(lineSchema).min(1).max(30),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  billingSameAsShipping: z.boolean().optional().default(true),
  shippingMethodId: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["cod", "card", "bank"]),
  discountCode: field(40).optional().default(""),
  marketingOptIn: z.boolean().optional().default(false),
  notes: field(1000).optional().default(""),
  currency: field(3).optional().default("PKR"),
  cardLast4: field(4).optional().default(""),
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
    const limited = limitByIp(req, "orders", 10, 10 * 60_000);
    if (limited) return limited;
    await connectDB();
    const session = await getCustomerSession();
    const customerId = session?.sub || "";
    const raw = await req.json();
    const parsed = createOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError("Invalid order payload", 400, parsed.error.flatten());
    }

    const body = parsed.data;
    if (body.paymentMethod === "card") {
      return jsonError("Card payments are not available yet. Choose cash on delivery or bank transfer.", 400);
    }

    const pricing = await priceLines(body.lines);
    if ("error" in pricing) return jsonError(pricing.error ?? "Cart error", 409);
    const lines = pricing.lines;

    const subtotalPkr = lines.reduce(
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
    for (let attempt = 0; attempt < 5; attempt++) {
      const taken = await OrderModel.exists({ orderNumber });
      if (!taken) break;
      orderNumber = generateOrderNumber();
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
        lines,
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
        cardLast4: "",
        marketingOptIn: body.marketingOptIn ?? false,
        notes: body.notes || "",
        estimatedDeliveryFrom: new Date(eta.from),
        estimatedDeliveryTo: new Date(eta.to),
        confirmedAt: status === "confirmed" ? now : null,
      });

      notifyOrderPlaced(created.toObject());

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
          confirmationEmail: emailConfigured(),
          invoiceUrl: invoicePath(created.orderNumber),
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

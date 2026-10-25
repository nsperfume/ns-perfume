import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireCustomer } from "@/lib/customer-auth";
import { OrderModel } from "@/models/Order";
import { CustomerModel } from "@/models/Customer";

export async function GET() {
  try {
    const session = await requireCustomer();
    if (!session) return jsonError("Sign in to view your orders", 401);

    await connectDB();
    // Guest orders are matched by email only once that email is proven (Google sign-in).
    // Otherwise anyone could register someone else's address and read their orders.
    const customer = await CustomerModel.findById(session.sub)
      .select("emailVerified")
      .lean<{ emailVerified?: boolean }>();
    const owned: Record<string, string>[] = [{ customerId: session.sub }];
    if (customer?.emailVerified) owned.push({ email: session.email.toLowerCase() });
    const orders = await OrderModel.find({ $or: owned })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    return jsonOk(
      orders.map((o) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        status: o.status,
        totalPkr: o.totalPkr,
        currency: o.currency || "PKR",
        createdAt: o.createdAt,
        lines: ((o.lines || []) as Array<{
          productHandle?: string;
          name?: string;
          sizeMl?: number;
          sku?: string;
          quantity?: number;
          unitPricePkr?: number;
          image?: string;
          isGift?: boolean;
          giftMessage?: string;
          giftWrap?: boolean;
        }>).map((l) => ({
          productHandle: l.productHandle || "",
          name: l.name || "",
          sizeMl: l.sizeMl || 0,
          sku: l.sku || "",
          quantity: l.quantity || 1,
          unitPricePkr: l.unitPricePkr || 0,
          image: l.image || "",
          isGift: Boolean(l.isGift),
          giftMessage: l.giftMessage || "",
          giftWrap: Boolean(l.giftWrap),
        })),
      })),
    );
  } catch (e) {
    console.error(e);
    return jsonError("Could not load orders", 500);
  }
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { OrderModel } from "@/models/Order";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const orderNumber = String(body.orderNumber || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    if (!orderNumber || !email) {
      return jsonError("orderNumber and email required");
    }
    const order = await OrderModel.findOne({ orderNumber, email }).lean();
    if (!order) {
      return jsonError(
        "No order found for that number and email. Check spelling or email care@nsperfume.com.",
        404,
      );
    }
    return jsonOk({
      orderNumber: order.orderNumber,
      status: order.status,
      totalPkr: order.totalPkr,
      currency: order.currency,
      lines: order.lines,
      createdAt: order.createdAt,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Lookup failed", 500);
  }
}

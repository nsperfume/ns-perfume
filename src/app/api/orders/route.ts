import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { OrderModel } from "@/models/Order";

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
    const body = await req.json();
    const orderNumber = `NS-${Date.now().toString().slice(-8)}`;
    const created = await OrderModel.create({
      ...body,
      orderNumber,
      status: body.status || "pending",
    });
    return jsonOk(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create order", 500);
  }
}

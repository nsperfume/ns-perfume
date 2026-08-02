import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ProductModel } from "@/models/Product";
import { OrderModel } from "@/models/Order";
import { CollectionModel } from "@/models/Collection";
import { ReviewModel } from "@/models/Review";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();
    const [products, orders, collections, pendingReviews] = await Promise.all([
      ProductModel.countDocuments({ status: "active" }),
      OrderModel.countDocuments(),
      CollectionModel.countDocuments({ status: "active" }),
      ReviewModel.countDocuments({ status: "pending" }),
    ]);
    const recentOrders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    return jsonOk({
      products,
      orders,
      collections,
      pendingReviews,
      recentOrders,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load dashboard", 500);
  }
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, canViewRevenue } from "@/lib/auth";
import { ProductModel } from "@/models/Product";
import { OrderModel } from "@/models/Order";
import { CollectionModel } from "@/models/Collection";
import { ReviewModel } from "@/models/Review";
import { ContactMessageModel } from "@/models/ContactMessage";
import { countCrmPeople, countRegisteredAccounts } from "@/lib/admin-customers";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKeyLocal(d: Date) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();

    const now = new Date();
    const days = 14;
    const rangeStart = startOfDay(new Date(now));
    rangeStart.setDate(rangeStart.getDate() - (days - 1));

    const prevStart = new Date(rangeStart);
    prevStart.setDate(prevStart.getDate() - days);

    const paidFilter = { status: { $nin: ["cancelled"] } };

    const [
      products,
      draftProducts,
      orders,
      collections,
      pendingReviews,
      revenueAgg,
      prevRevenueAgg,
      statusGroups,
      recentOrders,
      recentProducts,
      periodOrders,
      customers,
      registeredAccounts,
      newContacts,
    ] = await Promise.all([
      ProductModel.countDocuments({ status: "active" }),
      ProductModel.countDocuments({ status: "draft" }),
      OrderModel.countDocuments(),
      CollectionModel.countDocuments(),
      ReviewModel.countDocuments({ status: "pending" }),
      OrderModel.aggregate([
        { $match: { ...paidFilter, createdAt: { $gte: rangeStart } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPkr" },
            count: { $sum: 1 },
          },
        },
      ]),
      OrderModel.aggregate([
        {
          $match: {
            ...paidFilter,
            createdAt: { $gte: prevStart, $lt: rangeStart },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPkr" },
            count: { $sum: 1 },
          },
        },
      ]),
      OrderModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      OrderModel.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "orderNumber customerName email status totalPkr paymentMethod createdAt lines trackingNumber",
        )
        .lean(),
      ProductModel.find()
        .sort({ updatedAt: -1 })
        .limit(6)
        .select("handle name status sizes imagePrimary inStock")
        .lean(),
      OrderModel.find({
        ...paidFilter,
        createdAt: { $gte: rangeStart },
      })
        .select("createdAt totalPkr")
        .lean(),
      countCrmPeople(),
      countRegisteredAccounts(),
      ContactMessageModel.countDocuments({ status: "new" }),
    ]);

    const revenuePkr = revenueAgg[0]?.total ?? 0;
    const orderCountPeriod = revenueAgg[0]?.count ?? 0;
    const prevRevenuePkr = prevRevenueAgg[0]?.total ?? 0;
    const prevOrderCount = prevRevenueAgg[0]?.count ?? 0;

    const dayMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const key = dayKeyLocal(d);
      dayMap.set(key, { revenue: 0, orders: 0 });
    }
    for (const o of periodOrders) {
      const key = dayKeyLocal(new Date(o.createdAt as Date));
      const row = dayMap.get(key);
      if (row) {
        row.revenue += o.totalPkr || 0;
        row.orders += 1;
      }
    }
    const revenueSeries = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      label: date.slice(5).replace("-", "/"),
      revenue: v.revenue,
      orders: v.orders,
    }));

    const ordersByStatus: Record<string, number> = {};
    for (const g of statusGroups) {
      ordersByStatus[String(g._id)] = g.count;
    }

    const revenueChange =
      prevRevenuePkr > 0
        ? Math.round(((revenuePkr - prevRevenuePkr) / prevRevenuePkr) * 100)
        : revenuePkr > 0
          ? 100
          : 0;

    const showRevenue = canViewRevenue(admin);

    return jsonOk({
      products,
      draftProducts,
      orders,
      collections,
      pendingReviews,
      customers,
      registeredAccounts,
      newContacts,
      orderCountPeriod,
      prevOrderCount,
      ordersByStatus,
      recentOrders: recentOrders.map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        email: o.email,
        status: o.status,
        totalPkr: showRevenue ? o.totalPkr : undefined,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
      })),
      recentProducts: recentProducts.map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sizes = ((p as any).sizes || []) as {
          pricePkr?: number;
          price?: number;
        }[];
        const first = sizes[0];
        const price = first?.pricePkr ?? first?.price ?? 0;
        return {
          handle: p.handle,
          name: p.name,
          status: p.status || "active",
          price: showRevenue ? price : undefined,
          image: p.imagePrimary || "",
          inStock: p.inStock !== false,
        };
      }),
      periodDays: days,
      // Confidential for super_admin only
      canViewRevenue: showRevenue,
      revenuePkr: showRevenue ? revenuePkr : null,
      prevRevenuePkr: showRevenue ? prevRevenuePkr : null,
      revenueChange: showRevenue ? revenueChange : null,
      revenueSeries: showRevenue ? revenueSeries : [],
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load dashboard", 500);
  }
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin, canViewRevenue } from "@/lib/auth";
import { ProductModel } from "@/models/Product";
import { OrderModel } from "@/models/Order";
import { CollectionModel } from "@/models/Collection";
import { ReviewModel } from "@/models/Review";
import { ContactMessageModel } from "@/models/ContactMessage";
import { countCrmPeople, countRegisteredAccounts } from "@/lib/admin-customers";

/** Sales days follow the store's clock (Pakistan), not the server's. */
const STORE_TZ = "Asia/Karachi";

const zoneParts = new Intl.DateTimeFormat("en-US", {
  timeZone: STORE_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partsAt(d: Date) {
  const p: Record<string, number> = {};
  for (const x of zoneParts.formatToParts(d)) {
    if (x.type !== "literal") p[x.type] = Number(x.value);
  }
  return p;
}

/** YYYY-MM-DD of the store-time day that `d` falls on. */
function storeDayKey(d: Date) {
  const p = partsAt(d);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Calendar maths on a YYYY-MM-DD key (timezone free). */
function addDaysToKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The instant store-time midnight starts on the day `key`. */
function storeMidnight(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const p = partsAt(new Date(guess));
  const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return new Date(guess - (shown - guess));
}

/** "25 Oct", the short date style used across the admin. */
function dayLabel(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();

    const now = new Date();
    const days = 14;
    const todayKey = storeDayKey(now);
    const firstKey = addDaysToKey(todayKey, -(days - 1));
    const rangeStart = storeMidnight(firstKey);
    const prevStart = storeMidnight(addDaysToKey(firstKey, -days));

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
      dayMap.set(addDaysToKey(firstKey, i), { revenue: 0, orders: 0 });
    }
    for (const o of periodOrders) {
      const key = storeDayKey(new Date(o.createdAt as Date));
      const row = dayMap.get(key);
      if (row) {
        row.revenue += o.totalPkr || 0;
        row.orders += 1;
      }
    }
    const revenueSeries = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      label: dayLabel(date),
      revenue: v.revenue,
      orders: v.orders,
    }));

    const ordersByStatus: Record<string, number> = {};
    for (const g of statusGroups) {
      ordersByStatus[String(g._id)] = g.count;
    }

    // No percentage when the previous period had no sales (it would read "up 100%").
    const revenueChange =
      prevRevenuePkr > 0
        ? Math.round(((revenuePkr - prevRevenuePkr) / prevRevenuePkr) * 100)
        : null;

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

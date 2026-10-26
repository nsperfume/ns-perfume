import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { OrderModel } from "@/models/Order";
import { ORDER_STATUS_VALUES } from "@/lib/order-status";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/** Only what the orders list shows (no addresses or line items). */
const LIST_FIELDS =
  "orderNumber email customerName phone status totalPkr paymentMethod cardLast4 discountCode carrier trackingNumber trackingUrl createdAt";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function positiveInt(raw: string | null, fallback: number) {
  const n = Number.parseInt(raw || "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Search by order number (with or without the NS- prefix), customer name,
 * email or phone (digits match whatever spacing was stored).
 */
function searchFilter(raw: string) {
  const term = raw.trim().slice(0, 100);
  if (!term) return {};
  const text = new RegExp(escapeRegex(term), "i");
  const or: Record<string, unknown>[] = [
    { orderNumber: text },
    { customerName: text },
    { email: text },
  ];
  const core = term.replace(/^ns-?/i, "");
  if (core && core !== term) {
    or.push({ orderNumber: new RegExp(escapeRegex(core), "i") });
  }
  const digits = term.replace(/\D/g, "");
  if (digits.length >= 4 && digits.length >= term.replace(/[\s+()-]/g, "").length) {
    const variants = new Set([digits]);
    if (digits.startsWith("0")) variants.add(`92${digits.slice(1)}`);
    if (digits.startsWith("92")) variants.add(`0${digits.slice(2)}`);
    for (const v of variants) {
      const loose = new RegExp(v.split("").join("\\D*"));
      or.push({ phone: loose }, { "shippingAddress.phone": loose });
    }
  }
  return { $or: or };
}

/**
 * Admin orders list: newest first, server-side pages, search and status
 * filter. `counts` has the number of matching orders per status (and `all`)
 * so the filter chips stay accurate however many orders there are.
 *
 *   GET /api/admin/orders?page=1&pageSize=25&status=pending&q=ayesha
 */
export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      positiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    );
    const statusParam = searchParams.get("status") || "all";
    const status = (ORDER_STATUS_VALUES as readonly string[]).includes(statusParam)
      ? statusParam
      : "all";
    const search = searchFilter(searchParams.get("q") || "");
    const match = status === "all" ? search : { ...search, status };

    const grouped = await OrderModel.aggregate<{ _id: string | null; count: number }>([
      { $match: search },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = { all: 0 };
    for (const g of grouped) {
      const key = String(g._id ?? "");
      counts[key] = (counts[key] || 0) + g.count;
      counts.all += g.count;
    }

    const total = status === "all" ? counts.all : counts[status] || 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    // A page past the end (e.g. after a filter change) shows the last page.
    const page = Math.min(positiveInt(searchParams.get("page"), 1), pageCount);

    const rows = total
      ? await OrderModel.find(match)
          .sort({ createdAt: -1, _id: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .select(LIST_FIELDS)
          .lean()
      : [];

    return jsonOk({ rows, total, page, pageSize, pageCount, counts });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load orders", 500);
  }
}

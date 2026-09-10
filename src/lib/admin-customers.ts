import { connectDB } from "@/lib/db";
import { OrderModel } from "@/models/Order";
import { CustomerModel } from "@/models/Customer";
import { ContactMessageModel } from "@/models/ContactMessage";

export type CustomerListRow = {
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  lifetimeSpendPkr: number;
  lastOrderAt: string | null;
  firstOrderAt: string | null;
  account: "registered" | "guest";
  customerId: string | null;
  messageCount: number;
  cities: string[];
};

export type ProductBought = {
  productHandle: string;
  name: string;
  orderCount: number;
  totalQuantity: number;
};

export type CustomerDetail = CustomerListRow & {
  orders: {
    orderNumber: string;
    status: string;
    totalPkr: number;
    paymentMethod?: string;
    createdAt?: string;
    lines: {
      productHandle?: string;
      name?: string;
      sizeMl?: number;
      quantity?: number;
      unitPricePkr?: number;
    }[];
  }[];
  products: ProductBought[];
  messages: {
    id: string;
    topic: string;
    status: string;
    message: string;
    name: string;
    createdAt?: string;
  }[];
};

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

type Acc = {
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  lifetimeSpendPkr: number;
  lastOrderAt: Date | null;
  firstOrderAt: Date | null;
  account: "registered" | "guest";
  customerId: string | null;
  messageCount: number;
  cities: Set<string>;
};

function emptyAcc(email: string): Acc {
  return {
    email,
    name: "",
    phone: "",
    orderCount: 0,
    lifetimeSpendPkr: 0,
    lastOrderAt: null,
    firstOrderAt: null,
    account: "guest",
    customerId: null,
    messageCount: 0,
    cities: new Set(),
  };
}

function toRow(a: Acc): CustomerListRow {
  return {
    email: a.email,
    name: a.name,
    phone: a.phone,
    orderCount: a.orderCount,
    lifetimeSpendPkr: a.lifetimeSpendPkr,
    lastOrderAt: a.lastOrderAt ? a.lastOrderAt.toISOString() : null,
    firstOrderAt: a.firstOrderAt ? a.firstOrderAt.toISOString() : null,
    account: a.account,
    customerId: a.customerId,
    messageCount: a.messageCount,
    cities: Array.from(a.cities).sort(),
  };
}

/**
 * Build CRM customer directory by email from orders, accounts, and contacts.
 */
export async function listAdminCustomers(opts?: {
  q?: string;
  sort?: "lastOrder" | "spend" | "orders";
}): Promise<CustomerListRow[]> {
  await connectDB();
  const map = new Map<string, Acc>();

  const [orders, accounts, messages] = await Promise.all([
    OrderModel.find()
      .select(
        "email phone customerName customerId status totalPkr createdAt shippingAddress",
      )
      .lean(),
    CustomerModel.find().select("email name phone").lean(),
    ContactMessageModel.find().select("email name").lean(),
  ]);

  for (const o of orders) {
    const email = normEmail(String(o.email || ""));
    if (!email) continue;
    const acc = map.get(email) || emptyAcc(email);
    acc.orderCount += 1;
    if (o.status !== "cancelled") {
      acc.lifetimeSpendPkr += Number(o.totalPkr) || 0;
    }
    const created = o.createdAt ? new Date(o.createdAt as Date) : null;
    if (created) {
      if (!acc.lastOrderAt || created > acc.lastOrderAt) {
        acc.lastOrderAt = created;
      }
      if (!acc.firstOrderAt || created < acc.firstOrderAt) {
        acc.firstOrderAt = created;
      }
    }
    if (o.customerName && !acc.name) acc.name = String(o.customerName);
    const phone = o.phone || (o.shippingAddress as { phone?: string } | undefined)?.phone;
    if (phone && !acc.phone) acc.phone = String(phone);
    if (o.customerId) {
      acc.customerId = String(o.customerId);
      acc.account = "registered";
    }
    const city = (o.shippingAddress as { city?: string } | undefined)?.city?.trim();
    if (city) acc.cities.add(city);
    map.set(email, acc);
  }

  for (const c of accounts) {
    const email = normEmail(String(c.email || ""));
    if (!email) continue;
    const acc = map.get(email) || emptyAcc(email);
    acc.account = "registered";
    acc.customerId = String(c._id);
    if (c.name) acc.name = String(c.name);
    if (c.phone) acc.phone = String(c.phone);
    map.set(email, acc);
  }

  for (const m of messages) {
    const email = normEmail(String(m.email || ""));
    if (!email) continue;
    const acc = map.get(email) || emptyAcc(email);
    acc.messageCount += 1;
    if (m.name && !acc.name) acc.name = String(m.name);
    map.set(email, acc);
  }

  let rows = Array.from(map.values()).map(toRow);

  const q = opts?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.email.includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
    );
  }

  const sort = opts?.sort || "lastOrder";
  rows.sort((a, b) => {
    if (sort === "spend") return b.lifetimeSpendPkr - a.lifetimeSpendPkr;
    if (sort === "orders") return b.orderCount - a.orderCount;
    const at = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
    const bt = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
    return bt - at;
  });

  return rows;
}

export async function getAdminCustomerDetail(
  rawEmail: string,
): Promise<CustomerDetail | null> {
  const email = normEmail(rawEmail);
  if (!email) return null;

  await connectDB();

  const [orders, account, messages] = await Promise.all([
    OrderModel.find({ email: new RegExp(`^${escapeRegex(email)}$`, "i") })
      .sort({ createdAt: -1 })
      .lean(),
    CustomerModel.findOne({ email }).lean(),
    ContactMessageModel.find({
      email: new RegExp(`^${escapeRegex(email)}$`, "i"),
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  if (!orders.length && !account && !messages.length) return null;

  const acc = emptyAcc(email);
  if (account) {
    acc.account = "registered";
    acc.customerId = String(account._id);
    acc.name = account.name || "";
    acc.phone = account.phone || "";
  }

  const productMap = new Map<string, ProductBought>();

  for (const o of orders) {
    acc.orderCount += 1;
    if (o.status !== "cancelled") {
      acc.lifetimeSpendPkr += Number(o.totalPkr) || 0;
    }
    const created = o.createdAt ? new Date(o.createdAt as Date) : null;
    if (created) {
      if (!acc.lastOrderAt || created > acc.lastOrderAt) acc.lastOrderAt = created;
      if (!acc.firstOrderAt || created < acc.firstOrderAt)
        acc.firstOrderAt = created;
    }
    if (o.customerName && !acc.name) acc.name = String(o.customerName);
    const phone =
      o.phone || (o.shippingAddress as { phone?: string } | undefined)?.phone;
    if (phone && !acc.phone) acc.phone = String(phone);
    if (o.customerId) {
      acc.customerId = String(o.customerId);
      acc.account = "registered";
    }
    const city = (o.shippingAddress as { city?: string } | undefined)?.city?.trim();
    if (city) acc.cities.add(city);

    if (o.status !== "cancelled") {
      for (const line of o.lines || []) {
        const handle = String(line.productHandle || "").trim();
        if (!handle) continue;
        const existing = productMap.get(handle) || {
          productHandle: handle,
          name: String(line.name || handle),
          orderCount: 0,
          totalQuantity: 0,
        };
        existing.orderCount += 1;
        existing.totalQuantity += Number(line.quantity) || 0;
        if (line.name) existing.name = String(line.name);
        productMap.set(handle, existing);
      }
    }
  }

  acc.messageCount = messages.length;
  for (const m of messages) {
    if (m.name && !acc.name) acc.name = String(m.name);
  }

  return {
    ...toRow(acc),
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      totalPkr: o.totalPkr,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt
        ? new Date(o.createdAt as Date).toISOString()
        : undefined,
      lines: (
        (o.lines || []) as {
          productHandle?: string;
          name?: string;
          sizeMl?: number;
          quantity?: number;
          unitPricePkr?: number;
        }[]
      ).map((l) => ({
        productHandle: l.productHandle,
        name: l.name,
        sizeMl: l.sizeMl,
        quantity: l.quantity,
        unitPricePkr: l.unitPricePkr,
      })),
    })),
    products: Array.from(productMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity,
    ),
    messages: messages.map((m) => ({
      id: String(m._id),
      topic: m.topic || "general",
      status: m.status || "new",
      message: m.message,
      name: m.name,
      createdAt: m.createdAt
        ? new Date(m.createdAt as Date).toISOString()
        : undefined,
    })),
  };
}

export async function countCrmPeople() {
  await connectDB();
  const rows = await listAdminCustomers();
  return rows.length;
}

/** Accounts that signed up (email/password or Google), not guest checkouts. */
export async function countRegisteredAccounts() {
  await connectDB();
  return CustomerModel.countDocuments();
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

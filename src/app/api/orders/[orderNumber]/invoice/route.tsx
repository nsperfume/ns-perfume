import { renderToBuffer } from "@react-pdf/renderer";
import { connectDB } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { canViewInvoice } from "@/lib/invoice/access";
import { InvoiceDocument } from "@/lib/invoice/document";
import { toOrderEmailData } from "@/emails/order-data";
import { OrderModel } from "@/models/Order";

type Params = { params: Promise<{ orderNumber: string }> };

/** PDF invoice download. `?inline=1` opens it in the browser instead of saving. */
export async function GET(req: Request, { params }: Params) {
  try {
    const orderNumber = decodeURIComponent((await params).orderNumber).trim().toUpperCase();
    const url = new URL(req.url);

    await connectDB();
    const order = await OrderModel.findOne({ orderNumber }).lean<Record<string, unknown>>();
    if (!order) return jsonError("Invoice not found", 404);

    const allowed = await canViewInvoice(
      {
        orderNumber: String(order.orderNumber),
        email: String(order.email),
        customerId: String(order.customerId || ""),
      },
      url.searchParams.get("t"),
    );
    // Same response as a missing order, so order numbers can't be probed.
    if (!allowed) return jsonError("Invoice not found", 404);

    const pdf = await renderToBuffer(<InvoiceDocument order={toOrderEmailData(order)} />);
    const filename = `NS-Perfume-Invoice-${orderNumber}.pdf`;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${url.searchParams.get("inline") === "1" ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (e) {
    console.error(e);
    return jsonError("Could not create the invoice", 500);
  }
}

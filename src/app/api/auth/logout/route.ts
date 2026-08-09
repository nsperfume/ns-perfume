import { jsonOk } from "@/lib/api";
import { clearCustomerSessionCookie } from "@/lib/customer-auth";

export async function POST() {
  await clearCustomerSessionCookie();
  return jsonOk({ ok: true });
}

export async function DELETE() {
  await clearCustomerSessionCookie();
  return jsonOk({ ok: true });
}

import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { getCustomerSession } from "@/lib/customer-auth";
import { rateLimit } from "@/lib/rate-limit";
import { notifyVerifyEmail } from "@/lib/email";
import { createLinkToken } from "@/lib/tokens";
import { CustomerModel } from "@/models/Customer";

export async function POST() {
  try {
    const session = await getCustomerSession();
    if (!session) return jsonError("Sign in first", 401);
    const limited = rateLimit(`verify-resend:${session.sub}`, 3, 60 * 60_000);
    if (limited) return limited;

    await connectDB();
    const customer = await CustomerModel.findById(session.sub);
    if (!customer) return jsonError("Account not found", 404);
    if (customer.emailVerified) return jsonOk({ alreadyVerified: true });

    const verify = createLinkToken();
    customer.emailVerifyTokenHash = verify.hash;
    customer.emailVerifyExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await customer.save();
    notifyVerifyEmail({ email: customer.email, name: customer.name || "" }, verify.token);
    return jsonOk({ sent: true });
  } catch (e) {
    console.error(e);
    return jsonError("Could not send the email. Please try again.", 500);
  }
}

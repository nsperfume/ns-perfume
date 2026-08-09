import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  createCustomerToken,
  setCustomerSessionCookie,
  verifyPassword,
} from "@/lib/customer-auth";
import { CustomerModel } from "@/models/Customer";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message || "Invalid details",
        400,
      );
    }

    await connectDB();
    const email = parsed.data.email.toLowerCase();
    const customer = await CustomerModel.findOne({ email });
    if (!customer?.passwordHash) {
      return jsonError(
        customer?.googleId
          ? "This email uses Google sign-in. Continue with Google."
          : "Email or password is incorrect.",
        401,
      );
    }

    const ok = await verifyPassword(
      parsed.data.password,
      customer.passwordHash,
    );
    if (!ok) return jsonError("Email or password is incorrect.", 401);

    const token = await createCustomerToken({
      sub: String(customer._id),
      email: customer.email,
      name: customer.name || "",
    });
    await setCustomerSessionCookie(token);

    return jsonOk({
      id: String(customer._id),
      email: customer.email,
      name: customer.name || "",
      phone: customer.phone || "",
    });
  } catch (e) {
    console.error(e);
    return jsonError("Could not sign in", 500);
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import {
  createCustomerToken,
  googleOAuthConfigured,
  googleRedirectUri,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";
import { CustomerModel } from "@/models/Customer";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleProfile = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/account?authError=${encodeURIComponent(oauthError)}`, origin),
    );
  }

  if (!googleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/account?authError=google_not_configured", origin),
    );
  }

  const jar = await cookies();
  const savedState = jar.get("ns_google_oauth_state")?.value;
  jar.delete("ns_google_oauth_state");

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL("/account?authError=google_state", origin),
    );
  }

  try {
    const redirectUri = googleRedirectUri(origin);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenJson.access_token) {
      return NextResponse.redirect(
        new URL("/account?authError=google_token", origin),
      );
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      },
    );
    const profile = (await profileRes.json()) as GoogleProfile;
    const email = String(profile.email || "")
      .toLowerCase()
      .trim();
    const googleId = String(profile.sub || profile.id || "").trim();
    if (!email || !googleId) {
      return NextResponse.redirect(
        new URL("/account?authError=google_profile", origin),
      );
    }

    await connectDB();
    let customer = await CustomerModel.findOne({
      $or: [{ googleId }, { email }],
    });

    if (!customer) {
      customer = await CustomerModel.create({
        email,
        name: profile.name || email.split("@")[0],
        googleId,
        avatarUrl: profile.picture || "",
        emailVerified: true,
      });
    } else {
      customer.googleId = customer.googleId || googleId;
      customer.emailVerified = true;
      if (profile.name && !customer.name) customer.name = profile.name;
      if (profile.picture) customer.avatarUrl = profile.picture;
      await customer.save();
    }

    const token = await createCustomerToken({
      sub: String(customer._id),
      email: customer.email,
      name: customer.name || "",
    });
    await setCustomerSessionCookie(token);

    return NextResponse.redirect(new URL("/account", origin));
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(
      new URL("/account?authError=google_failed", origin),
    );
  }
}

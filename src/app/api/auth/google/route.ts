import { NextResponse } from "next/server";
import {
  googleOAuthConfigured,
  googleRedirectUri,
} from "@/lib/customer-auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  if (!googleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/account?authError=google_not_configured", origin),
    );
  }

  const redirectUri = googleRedirectUri(origin);
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  res.cookies.set("ns_google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}

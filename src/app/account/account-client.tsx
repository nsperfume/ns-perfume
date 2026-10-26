"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart";
import { useCurrency } from "@/context/currency";
import { useCustomer } from "@/context/customer";
import { useUi } from "@/context/ui";
import { cn } from "@/lib/cn";
import { BrandLoader, BrandLoaderBlock } from "@/components/brand/brand-loader";
import { lineDisplayName } from "@/lib/checkout";

/** Where to return after Google sign-in, which always lands back on /account. */
const NEXT_KEY = "ns-auth-next";
const NEXT_TTL_MS = 15 * 60_000;

/**
 * `next` from the URL, accepted only as a same-origin path ("/checkout"), never
 * "//evil.com", "https://..." or another account page.
 */
function safeNext(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return null;
  }
  try {
    const base = "https://store.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base || url.pathname.startsWith("/account")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function rememberNext(path: string | null) {
  if (!path) return;
  try {
    sessionStorage.setItem(NEXT_KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

function readRememberedNext(): string | null {
  try {
    const raw = sessionStorage.getItem(NEXT_KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw) as { path?: string; at?: number };
    if (!at || Date.now() - at > NEXT_TTL_MS) {
      sessionStorage.removeItem(NEXT_KEY);
      return null;
    }
    return safeNext(path);
  } catch {
    return null;
  }
}

function forgetNext() {
  try {
    sessionStorage.removeItem(NEXT_KEY);
  } catch {
    /* ignore */
  }
}

type OrderLine = {
  productHandle: string;
  name: string;
  sizeMl: number;
  sku: string;
  quantity: number;
  unitPricePkr: number;
  image: string;
  isGift?: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
};

type AccountOrder = {
  id: string;
  orderNumber: string;
  /** Signed PDF invoice URL from /api/account/orders. */
  invoiceUrl?: string;
  status: string;
  totalPkr: number;
  currency: string;
  createdAt: string;
  lines: OrderLine[];
};

function authErrorMessage(code: string | null) {
  switch (code) {
    case "google_not_configured":
      return "Google sign-in is not available right now. Sign in with email instead.";
    case "google_state":
    case "google_token":
    case "google_profile":
    case "google_failed":
      return "Google sign-in did not finish. Try again, or use email instead.";
    case "access_denied":
      return "Google sign-in was cancelled.";
    default:
      return code ? "Could not complete sign-in. Try again." : "";
  }
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static brand mark; avoid Image optimizer on tiny SVG
    <img
      src="/icons/google.svg"
      alt=""
      width={20}
      height={20}
      className={cn("h-5 w-5 shrink-0", className)}
      draggable={false}
    />
  );
}

function AuthPanel({ next }: { next: string | null }) {
  const search = useSearchParams();
  const { refresh, googleEnabled } = useCustomer();
  const [mode, setMode] = useState<"signin" | "register" | "forgot">("signin");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const code = search.get("authError");
    if (code) setError(authErrorMessage(code));
  }, [search]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/password/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (json.ok) setNotice(json.data.message);
        else setError(json.error || "Something went wrong");
        return;
      }
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body =
        mode === "register"
          ? { name, email, password }
          : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Something went wrong");
        return;
      }
      await refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
      <div>
        <p className="mb-2 text-eyebrow text-taupe">
          Account
        </p>
        {/* Page H1 is server-rendered in app/account/page.tsx */}
        <h2 className="text-display-lg text-balance text-ink">
          Sign in without the fuss
        </h2>
        <p className="mt-4 max-w-md text-body-lg text-taupe">
          One place for order history, repeat orders, and a saved profile.
          Guest checkout still works if you prefer.
        </p>
        <ul className="mt-8 space-y-3 border-t border-hairline pt-6 text-body text-ink/80">
          <li>See past orders by the email you used</li>
          <li>Reorder a past order in one tap</li>
          <li>Track parcels without digging through inbox threads</li>
        </ul>
      </div>

      <div className="border border-hairline bg-paper p-6 sm:p-10">
        <div className="mb-6 flex w-full gap-1 border-b border-hairline pb-1">
          {(
            [
              ["signin", "Sign in"],
              ["register", "Create account"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setError("");
                setNotice("");
              }}
              className={cn(
                "min-h-12 flex-1 cursor-pointer border-b-2 px-2 pb-3 pt-2 text-center text-eyebrow transition-colors sm:px-3",
                mode === id || (mode === "forgot" && id === "signin")
                  ? "border-ink text-ink"
                  : "border-transparent text-taupe hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {googleEnabled && mode !== "forgot" ? (
          <>
            <a
              href="/api/auth/google"
              onClick={() => rememberNext(next)}
              className="mb-5 flex min-h-12 w-full items-center justify-center gap-3 rounded-xs border border-[#d6cfbf] bg-paper px-4 text-label text-ink transition-colors hover:border-ink/50"
            >
              <GoogleIcon className="h-6 w-6" />
              Continue with Google
            </a>

            <div className="relative mb-5 text-center">
              <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
              <span className="relative bg-paper px-3 text-eyebrow text-taupe">
                Or email
              </span>
            </div>
          </>
        ) : null}

        <form className="space-y-4" onSubmit={submit} noValidate>
          {mode === "register" ? (
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          ) : null}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {mode === "forgot" ? (
            <p className="text-body-sm text-taupe">
              Enter the email on your account and we will send a link to choose
              a new password.
            </p>
          ) : (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              hint={mode === "register" ? "Use at least 8 characters" : undefined}
              required
            />
          )}
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError("");
                setNotice("");
              }}
              className="ml-auto flex min-h-10 cursor-pointer items-center text-body-sm text-taupe underline underline-offset-4 hover:text-ink"
            >
              Forgot your password?
            </button>
          ) : null}
          {mode === "register" ? (
            <p className="text-body-sm text-taupe">
              By creating an account you agree to our{" "}
              <Link
                href="/policies/terms"
                className="text-ink underline underline-offset-4 hover:text-brass-ink"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/policies/privacy"
                className="text-ink underline underline-offset-4 hover:text-brass-ink"
              >
                Privacy policy
              </Link>
              .
            </p>
          ) : null}
          {error ? (
            <p className="text-body-sm text-rosewood" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="text-body-sm text-ink" role="status">
              {notice}
            </p>
          ) : null}
          <Button type="submit" disabled={saving} className="w-full sm:w-full">
            {saving
              ? "Please wait…"
              : mode === "register"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Sign in"}
          </Button>
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
                setNotice("");
              }}
              className="min-h-11 w-full cursor-pointer text-body-sm text-taupe underline underline-offset-4 hover:text-ink"
            >
              Back to sign in
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function VerifyEmailBanner() {
  const search = useSearchParams();
  const { user } = useCustomer();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const verify = search.get("verify");

  if (verify === "done") {
    return (
      <p className="mb-8 border border-hairline bg-muted px-4 py-3 text-body text-ink" role="status">
        Your email is confirmed. Orders placed with this address now appear below.
      </p>
    );
  }
  if (!user || user.emailVerified) return null;

  async function resend() {
    setState("sending");
    try {
      const res = await fetch("/api/auth/verify-email/resend", { method: "POST" });
      const json = await res.json();
      setState(json.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mb-8 flex flex-col gap-3 border border-hairline bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="status">
      <p className="text-body text-ink">
        {verify === "invalid"
          ? "That confirmation link is invalid or has expired."
          : "Confirm your email to see orders you placed as a guest with this address."}
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={state === "sending" || state === "sent"}
        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center text-label text-ink underline underline-offset-4 hover:text-brass-ink disabled:cursor-default disabled:no-underline disabled:opacity-70"
      >
        {state === "sent"
          ? "Link sent. Check your inbox"
          : state === "sending"
            ? "Sending…"
            : state === "error"
              ? "Try again"
              : "Send confirmation link"}
      </button>
    </div>
  );
}

function ProfilePanel() {
  const { user, logout, refresh } = useCustomer();
  const { addItems } = useCart();
  const { format } = useCurrency();
  const { showToast } = useUi();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [repeating, setRepeating] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setOrders(j.data);
      })
      .finally(() => setLoadingOrders(false));
  }, []);

  const greeting = useMemo(() => {
    const first = (user?.name || "").trim().split(/\s+/)[0];
    return first || "there";
  }, [user?.name]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const json = await res.json();
      if (json.ok) {
        await refresh();
        showToast("Profile updated", "info");
      } else {
        showToast(json.error || "Could not save", "info");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  function repeatOrder(order: AccountOrder) {
    setRepeating(order.orderNumber);
    addItems(
      order.lines.map((l) => ({
        productHandle: l.productHandle,
        name: l.name,
        sizeMl: l.sizeMl,
        sku: l.sku,
        price: l.unitPricePkr,
        image: l.image || "/products/placeholder-lifestyle.svg",
        quantity: l.quantity,
        isGift: l.isGift,
        giftMessage: l.giftMessage,
        giftWrap: l.giftWrap,
      })),
    );
    showToast(`Order ${order.orderNumber} added to your cart`, "cart");
    setRepeating(null);
  }

  return (
    <div className="container-ns">
      <header className="mb-10 flex flex-col gap-4 border-b border-hairline pb-8 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-eyebrow text-taupe">
            Your account
          </p>
          <h2 className="text-display-lg text-ink">Hello, {greeting}</h2>
          <p className="mt-2 text-body text-taupe">
            {user?.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/track-order" variant="secondary">
            Track an order
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await logout();
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <VerifyEmailBanner />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
        <form
          onSubmit={saveProfile}
          className="h-fit space-y-4 border border-hairline bg-paper p-6 sm:p-7"
        >
          <p className="text-eyebrow text-taupe">
            Profile
          </p>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
          <Input label="Email" value={user?.email || ""} disabled />
          <Button type="submit" disabled={savingProfile} className="w-full">
            {savingProfile ? "Saving…" : "Save profile"}
          </Button>
        </form>

        <section>
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-eyebrow text-taupe">
                Orders
              </p>
              <h2 className="text-display-sm text-ink">
                Recent purchases
              </h2>
            </div>
          </div>

          {loadingOrders ? (
            <div className="flex justify-center py-10">
              <BrandLoader size={64} label="Loading orders" />
            </div>
          ) : null}

          {!loadingOrders && !orders.length ? (
            <div className="border border-dashed border-hairline bg-muted/40 p-8">
              <p className="text-body-lg text-ink/80">
                No orders on this account yet.
              </p>
              <p className="mt-2 text-body text-taupe">
                When you place an order while signed in, it shows up here. You
                can also track a guest order anytime.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/products">Shop bottles</Button>
                <Button href="/track-order" variant="secondary">
                  Track guest order
                </Button>
              </div>
            </div>
          ) : null}

          <ul className="space-y-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="border border-hairline bg-paper p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-sans tabular-nums text-base font-medium text-ink">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-caption capitalize text-taupe">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {order.status}
                    </p>
                    <p className="mt-3 font-sans tabular-nums text-lg font-medium text-ink">
                      {format(order.totalPkr)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-body-sm text-taupe">
                      {order.lines
                        .map((l) => `${lineDisplayName(l.name)}${l.isGift ? " (gift)" : ""} × ${l.quantity}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => repeatOrder(order)}
                      disabled={repeating === order.orderNumber}
                    >
                      {repeating === order.orderNumber
                        ? "Adding…"
                        : "Repeat order"}
                    </Button>
                    <div className="flex flex-wrap items-center gap-x-5">
                      <Link
                        href={`/track-order?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(user?.email || "")}`}
                        className="inline-flex min-h-11 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:text-brass-ink hover:decoration-brass"
                      >
                        Track
                      </Link>
                      {order.invoiceUrl ? (
                        <a
                          href={order.invoiceUrl}
                          download={`${order.orderNumber}-invoice.pdf`}
                          className="inline-flex min-h-11 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:text-brass-ink hover:decoration-brass"
                        >
                          Download invoice
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Visible from the first paint: the caption shows while the animated mark loads. */
export function AccountLoading({ caption = "Loading your account" }: { caption?: string }) {
  return <BrandLoaderBlock label={caption} caption={caption} />;
}

export default function AccountPage() {
  const { user, loading } = useCustomer();
  const search = useSearchParams();
  const router = useRouter();
  const urlNext = safeNext(search.get("next"));
  const [rememberedNext, setRememberedNext] = useState<string | null>(null);

  useEffect(() => {
    setRememberedNext(readRememberedNext());
  }, []);

  const next = urlNext ?? rememberedNext;
  const returning = Boolean(user && next);

  // Signed in (email, new account, or back from Google): return to where they came from.
  useEffect(() => {
    if (!user || !next) return;
    forgetNext();
    router.replace(next);
  }, [user, next, router]);

  return (
    <section className="bg-canvas section-y">
      {loading || returning ? (
        <AccountLoading
          caption={
            !returning
              ? undefined
              : next?.startsWith("/checkout")
                ? "Signed in. Taking you back to checkout"
                : "Signed in. Taking you back"
          }
        />
      ) : user ? (
        <ProfilePanel />
      ) : (
        <div className="container-ns">
          <AuthPanel next={next} />
        </div>
      )}
    </section>
  );
}

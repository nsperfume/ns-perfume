"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart";
import { useCurrency } from "@/context/currency";
import { useCustomer } from "@/context/customer";
import { useUi } from "@/context/ui";
import { cn } from "@/lib/cn";

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
  status: string;
  totalPkr: number;
  currency: string;
  createdAt: string;
  lines: OrderLine[];
};

function authErrorMessage(code: string | null) {
  switch (code) {
    case "google_not_configured":
      return "Google sign-in is ready in the product. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.";
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

function AuthPanel() {
  const search = useSearchParams();
  const { refresh, googleEnabled } = useCustomer();
  const [mode, setMode] = useState<"signin" | "register">("signin");
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
    setSaving(true);
    try {
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
        <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
          Account
        </p>
        <h1 className="text-display-lg text-balance text-ink">
          Sign in without the fuss
        </h1>
        <p className="mt-4 max-w-md font-serif text-[1.1rem] leading-relaxed text-taupe">
          One place for order history, repeat orders, and a saved profile.
          Guest checkout still works if you prefer.
        </p>
        <ul className="mt-8 space-y-3 border-t border-hairline pt-6 font-serif text-[1.05rem] text-ink/80">
          <li>See past orders by the email you used</li>
          <li>Repeat an order into your bag in one tap</li>
          <li>Track parcels without digging through inbox threads</li>
        </ul>
      </div>

      <div className="border border-hairline bg-paper p-6 sm:p-8">
        <div className="mb-6 flex gap-2 border-b border-hairline pb-1">
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
              }}
              className={cn(
                "cursor-pointer border-b-2 px-3 pb-3 font-display text-[12px] font-medium uppercase tracking-[0.12em] transition-colors",
                mode === id
                  ? "border-ink text-ink"
                  : "border-transparent text-taupe hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <a
          href="/api/auth/google"
          className="mb-5 flex min-h-12 w-full items-center justify-center gap-3 border border-hairline bg-canvas px-4 font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink/40"
        >
          <GoogleIcon className="h-6 w-6" />
          Continue with Google
        </a>
        {!googleEnabled ? (
          <p className="mb-5 font-serif text-[0.95rem] text-taupe">
            Google button is live. Connect your Google OAuth keys when you are
            ready.
          </p>
        ) : null}

        <div className="relative mb-5 text-center">
          <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
          <span className="relative bg-paper px-3 font-display text-[10px] uppercase tracking-[0.14em] text-taupe">
            Or email
          </span>
        </div>

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
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            required
          />
          {mode === "register" ? (
            <p className="font-serif text-[0.9rem] text-taupe">
              Use at least 8 characters. That is all.
            </p>
          ) : null}
          {error ? (
            <p className="font-serif text-[0.95rem] text-rosewood">{error}</p>
          ) : null}
          <Button type="submit" disabled={saving} className="w-full">
            {saving
              ? "Please wait…"
              : mode === "register"
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>
      </div>
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
    showToast(`Order ${order.orderNumber} added to bag`, "cart");
    setRepeating(null);
  }

  return (
    <div className="container-ns">
      <header className="mb-10 flex flex-col gap-4 border-b border-hairline pb-8 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
            Your account
          </p>
          <h1 className="text-display-lg text-ink">Hello, {greeting}</h1>
          <p className="mt-2 font-serif text-[1.05rem] text-taupe">
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

      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-12">
        <form
          onSubmit={saveProfile}
          className="h-fit space-y-4 border border-hairline bg-paper p-6 sm:p-7"
        >
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
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
              <p className="mb-1 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                Orders
              </p>
              <h2 className="font-display text-[1.35rem] font-medium text-ink">
                Recent purchases
              </h2>
            </div>
          </div>

          {loadingOrders ? (
            <p className="font-serif text-taupe">Loading orders…</p>
          ) : null}

          {!loadingOrders && !orders.length ? (
            <div className="border border-dashed border-hairline bg-muted/40 p-8">
              <p className="font-serif text-[1.1rem] text-ink/80">
                No orders on this account yet.
              </p>
              <p className="mt-2 font-serif text-[1rem] text-taupe">
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
                    <p className="font-display text-[0.95rem] font-medium text-ink">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-taupe">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {order.status}
                    </p>
                    <p className="mt-3 font-serif text-[1.05rem] text-ink">
                      {format(order.totalPkr)}
                    </p>
                    <p className="mt-2 line-clamp-2 font-serif text-[0.95rem] text-taupe">
                      {order.lines
                        .map((l) => `${l.name} × ${l.quantity}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button
                      type="button"
                      onClick={() => repeatOrder(order)}
                      disabled={repeating === order.orderNumber}
                    >
                      {repeating === order.orderNumber
                        ? "Adding…"
                        : "Repeat order"}
                    </Button>
                    <Link
                      href={`/track-order?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(user?.email || "")}`}
                      className="font-display text-[11px] font-medium uppercase tracking-[0.12em] text-brass"
                    >
                      Track
                    </Link>
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

export default function AccountPage() {
  const { user, loading } = useCustomer();

  return (
    <section className="bg-canvas section-y">
      {loading ? (
        <div className="container-ns max-w-lg">
          <p className="font-serif text-taupe">Loading your account…</p>
        </div>
      ) : user ? (
        <ProfilePanel />
      ) : (
        <div className="container-ns">
          <AuthPanel />
        </div>
      )}
    </section>
  );
}

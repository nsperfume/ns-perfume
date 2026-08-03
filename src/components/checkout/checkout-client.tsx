"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/cart";
import { useCurrency } from "@/context/currency";
import {
  CHECKOUT_ORDER_STORAGE_KEY,
  emptyAddress,
  PAYMENT_METHODS,
  PK_PROVINCES,
  SHIPPING_METHODS,
  shippingPricePkr,
  type CheckoutAddress,
  type CompletedOrderSnapshot,
  type PaymentMethodId,
  type ShippingMethodId,
} from "@/lib/checkout";
import { cn } from "@/lib/cn";
import {
  CheckoutCheckbox,
  CheckoutError,
  CheckoutField,
  CheckoutSelect,
} from "@/components/checkout/fields";
import { CheckoutOrderSummary } from "@/components/checkout/order-summary";
import { siteConfig } from "@/data/site";

type Step = "information" | "shipping" | "payment";

type FieldErrors = Record<string, string>;

function breadcrumbs(
  step: Step,
  onGo: (s: Step) => void,
) {
  const items: { id: Step | "cart"; label: string; href?: string }[] = [
    { id: "cart", label: "Cart", href: "/cart" },
    { id: "information", label: "Information" },
    { id: "shipping", label: "Shipping" },
    { id: "payment", label: "Payment" },
  ];
  const order = ["cart", "information", "shipping", "payment"] as const;
  const currentIdx = order.indexOf(step);
  return (
    <nav aria-label="Checkout steps" className="mb-6 font-display text-sm text-taupe">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => {
          const active = item.id === step;
          const pastIdx = order.indexOf(item.id as (typeof order)[number]);
          const canNavigate =
            item.id !== "cart" &&
            pastIdx >= 0 &&
            pastIdx < currentIdx &&
            (item.id as Step);
          return (
            <li key={item.id} className="flex items-center gap-1.5">
              {i > 0 ? <span className="text-hairline-dark/30">›</span> : null}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-brass hover:underline"
                >
                  {item.label}
                </Link>
              ) : canNavigate ? (
                <button
                  type="button"
                  className="cursor-pointer text-brass hover:underline"
                  onClick={() => onGo(item.id as Step)}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={cn(active && "font-medium text-ink")}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function CheckoutClient() {
  const router = useRouter();
  const { lines, subtotal, clearCart, closeCart } = useCart();
  const { currency } = useCurrency();

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>("information");
  const [email, setEmail] = useState("");
  const [marketing, setMarketing] = useState(true);
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const [shippingMethodId, setShippingMethodId] =
    useState<ShippingMethodId>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("cod");
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<CheckoutAddress>(emptyAddress);
  const [discountCode, setDiscountCode] = useState("");
  const [discountPkr, setDiscountPkr] = useState(0);
  const [freeShipPromo, setFreeShipPromo] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [notes, setNotes] = useState("");
  const [card, setCard] = useState({
    number: "",
    name: "",
    exp: "",
    cvc: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    closeCart();
    setHydrated(true);
    try {
      const saved = localStorage.getItem("ns-checkout-draft");
      if (saved) {
        const d = JSON.parse(saved) as {
          email?: string;
          address?: CheckoutAddress;
          marketing?: boolean;
        };
        if (d.email) setEmail(d.email);
        if (d.address) setAddress({ ...emptyAddress(), ...d.address });
        if (typeof d.marketing === "boolean") setMarketing(d.marketing);
      }
    } catch {
      /* ignore */
    }
  }, [closeCart]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "ns-checkout-draft",
        JSON.stringify({ email, address, marketing }),
      );
    } catch {
      /* ignore */
    }
  }, [email, address, marketing, hydrated]);

  const afterDiscount = Math.max(0, subtotal - discountPkr);
  const shippingPkr = useMemo(() => {
    if (step === "information") return null;
    let price = shippingPricePkr(shippingMethodId, afterDiscount);
    if (freeShipPromo && shippingMethodId === "standard") price = 0;
    return price;
  }, [step, shippingMethodId, afterDiscount, freeShipPromo]);

  const totalPkr =
    afterDiscount + (shippingPkr === null ? 0 : shippingPkr);

  const shippingLabel = SHIPPING_METHODS.find(
    (m) => m.id === shippingMethodId,
  )?.title;

  const setAddr =
    (setter: typeof setAddress) =>
    (key: keyof CheckoutAddress, value: string) => {
      setter((prev) => ({ ...prev, [key]: value }));
    };

  const applyDiscount = async (code: string): Promise<string | null> => {
    if (!code.trim()) return "Enter a discount code";
    try {
      const res = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(code.trim())}&subtotal=${subtotal}`,
      );
      const json = await res.json();
      if (!json.ok || !json.data) {
        return json.error || "Enter a valid discount code or gift card";
      }
      setDiscountCode(json.data.code);
      setDiscountPkr(json.data.amountPkr || 0);
      setFreeShipPromo(Boolean(json.data.freeShipping));
      return null;
    } catch {
      return "Could not validate discount code";
    }
  };

  const validateInformation = (): boolean => {
    const next: FieldErrors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email";
    }
    if (!address.firstName.trim()) next.firstName = "Enter a first name";
    if (!address.lastName.trim()) next.lastName = "Enter a last name";
    if (!address.address1.trim()) next.address1 = "Enter an address";
    if (!address.city.trim()) next.city = "Enter a city";
    if (!address.province.trim()) next.province = "Select a province";
    if (!address.phone.trim() && !email) {
      next.phone = "Enter a phone number";
    }
    if (!address.phone.trim()) next.phone = "Enter a phone number for delivery";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validatePayment = (): boolean => {
    const next: FieldErrors = {};
    if (paymentMethod === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (digits.length < 13) next.cardNumber = "Enter a valid card number";
      if (!card.name.trim()) next.cardName = "Enter the name on the card";
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.exp.trim())) {
        next.cardExp = "Enter a valid expiry (MM / YY)";
      }
      if (!/^\d{3,4}$/.test(card.cvc.trim())) next.cardCvc = "Enter CVV";
    }
    if (!billingSame) {
      if (!billing.firstName.trim()) next.bfirstName = "Enter a first name";
      if (!billing.lastName.trim()) next.blastName = "Enter a last name";
      if (!billing.address1.trim()) next.baddress1 = "Enter an address";
      if (!billing.city.trim()) next.bcity = "Enter a city";
      if (!billing.province.trim()) next.bprovince = "Select a province";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goToStep = (next: Step) => {
    if (next === "shipping" || next === "payment") {
      if (!validateInformation()) {
        setStep("information");
        return;
      }
    }
    setFormError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitOrder = async () => {
    if (!validatePayment()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: address.phone,
          lines: lines.map((l) => ({
            productHandle: l.productHandle,
            name: l.name,
            sizeMl: l.sizeMl,
            sku: l.sku,
            quantity: l.quantity,
            unitPricePkr: l.price,
            image: l.image,
            isGift: l.isGift,
            giftMessage: l.giftMessage,
            giftWrap: l.giftWrap,
          })),
          shippingAddress: address,
          billingAddress: billingSame ? undefined : billing,
          billingSameAsShipping: billingSame,
          shippingMethodId,
          paymentMethod,
          discountCode,
          marketingOptIn: marketing,
          notes,
          currency,
          cardLast4:
            paymentMethod === "card"
              ? card.number.replace(/\s/g, "").slice(-4)
              : "",
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setFormError(json.error || "Could not place order. Try again.");
        setSubmitting(false);
        return;
      }

      const data = json.data;
      const snapshot: CompletedOrderSnapshot = {
        orderNumber: data.orderNumber,
        email: data.email,
        phone: data.phone,
        customerName: data.customerName,
        totalPkr: data.totalPkr,
        subtotalPkr: data.subtotalPkr,
        shippingPkr: data.shippingPkr,
        discountPkr: data.discountPkr || 0,
        discountCode: data.discountCode,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        shippingMethodTitle: data.shippingMethod?.title || "Standard",
        shippingAddress: address,
        lines: (data.lines || []).map(
          (l: {
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
          }) => ({
            productHandle: l.productHandle,
            name: l.name,
            sizeMl: l.sizeMl,
            sku: l.sku,
            quantity: l.quantity,
            unitPricePkr: l.unitPricePkr,
            image: l.image,
            isGift: l.isGift,
            giftMessage: l.giftMessage,
            giftWrap: l.giftWrap,
          }),
        ),
        createdAt: data.createdAt || new Date().toISOString(),
      };

      sessionStorage.setItem(
        CHECKOUT_ORDER_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
      clearCart();
      if (!rememberMe) {
        try {
          localStorage.removeItem("ns-checkout-draft");
        } catch {
          /* ignore */
        }
      }
      router.push("/checkout/thank-you");
    } catch {
      setFormError("Network error. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas font-serif text-base text-taupe">
        Loading checkout…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <p className="font-display text-lg text-ink">Your cart is empty</p>
        <Link
          href="/products"
          className="font-display text-sm font-medium text-brass hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas font-serif text-base leading-relaxed text-ink antialiased">
      <div className="mx-auto grid min-h-dvh max-w-[1100px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Form column */}
        <div className="order-2 px-5 pb-16 pt-6 sm:px-8 lg:order-1 lg:px-12 lg:pt-10 xl:px-16">
          <header className="mb-8 text-center lg:text-left">
            <Link
              href="/"
              className="inline-block font-display text-2xl font-medium tracking-tight text-ink"
            >
              NS Perfume
            </Link>
          </header>

          {/* Express wallets (Shop Pay / Apple Pay / GPay) — disabled until a gateway is connected.
          <section className="mb-6">
            <p className="mb-3 text-center text-sm text-taupe">
              Express checkout
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Shop Pay", className: "bg-brass text-paper" },
                { label: "Apple Pay", className: "bg-ink text-paper" },
                { label: "GPay", className: "bg-paper text-ink border border-hairline" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  disabled
                  title="Connect a payment provider to enable express checkout"
                  className={cn(
                    "flex h-11 cursor-not-allowed items-center justify-center rounded-md text-sm font-semibold opacity-90",
                    btn.className,
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-hairline" />
              <span className="font-display text-xs uppercase tracking-wide text-taupe">
                OR
              </span>
              <div className="h-px flex-1 bg-hairline" />
            </div>
          </section>
          */}

          <div>{breadcrumbs(step, goToStep)}</div>

          {formError ? (
            <div
              role="alert"
              className="mb-5 rounded-md border border-rosewood/30 bg-rosewood/10 px-4 py-3 text-[14px] text-rosewood"
            >
              {formError}
            </div>
          ) : null}

          {/* INFORMATION */}
          {step === "information" ? (
            <div className="space-y-6">
              <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <h2 className="font-display text-xl font-medium text-ink">
                    Contact
                  </h2>
                  <p className="text-[13px] text-taupe">
                    Already have an account?{" "}
                    <Link href="/account" className="text-brass hover:underline">
                      Log in
                    </Link>
                  </p>
                </div>
                <CheckoutField
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <CheckoutError message={errors.email} />
                <CheckoutCheckbox
                  id="marketing"
                  className="mt-3"
                  label="Email me with news and offers"
                  checked={marketing}
                  onChange={setMarketing}
                />
              </section>

              <section>
                <h2 className="mb-3 font-display text-xl font-medium text-ink">
                  Delivery
                </h2>
                <div className="space-y-3">
                  <CheckoutSelect
                    id="country"
                    label="Country / region"
                    value={address.country}
                    onChange={(e) => setAddr(setAddress)("country", e.target.value)}
                  >
                    <option value="PK">Pakistan</option>
                  </CheckoutSelect>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <CheckoutField
                        id="firstName"
                        label="First name"
                        autoComplete="given-name"
                        value={address.firstName}
                        onChange={(e) =>
                          setAddr(setAddress)("firstName", e.target.value)
                        }
                      />
                      <CheckoutError message={errors.firstName} />
                    </div>
                    <div>
                      <CheckoutField
                        id="lastName"
                        label="Last name"
                        autoComplete="family-name"
                        value={address.lastName}
                        onChange={(e) =>
                          setAddr(setAddress)("lastName", e.target.value)
                        }
                      />
                      <CheckoutError message={errors.lastName} />
                    </div>
                  </div>
                  <CheckoutField
                    id="company"
                    label="Company (optional)"
                    autoComplete="organization"
                    value={address.company}
                    onChange={(e) => setAddr(setAddress)("company", e.target.value)}
                  />
                  <div>
                    <CheckoutField
                      id="address1"
                      label="Address"
                      autoComplete="address-line1"
                      value={address.address1}
                      onChange={(e) =>
                        setAddr(setAddress)("address1", e.target.value)
                      }
                    />
                    <CheckoutError message={errors.address1} />
                  </div>
                  <CheckoutField
                    id="address2"
                    label="Apartment, suite, etc. (optional)"
                    autoComplete="address-line2"
                    value={address.address2}
                    onChange={(e) =>
                      setAddr(setAddress)("address2", e.target.value)
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <CheckoutField
                        id="city"
                        label="City"
                        autoComplete="address-level2"
                        value={address.city}
                        onChange={(e) =>
                          setAddr(setAddress)("city", e.target.value)
                        }
                      />
                      <CheckoutError message={errors.city} />
                    </div>
                    <div>
                      <CheckoutSelect
                        id="province"
                        label="Province"
                        value={address.province}
                        onChange={(e) =>
                          setAddr(setAddress)("province", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        {PK_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </CheckoutSelect>
                      <CheckoutError message={errors.province} />
                    </div>
                    <CheckoutField
                      id="postalCode"
                      label="Postal code (optional)"
                      autoComplete="postal-code"
                      value={address.postalCode}
                      onChange={(e) =>
                        setAddr(setAddress)("postalCode", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <CheckoutField
                      id="phone"
                      label="Phone"
                      type="tel"
                      autoComplete="tel"
                      value={address.phone}
                      onChange={(e) => setAddr(setAddress)("phone", e.target.value)}
                    />
                    <CheckoutError message={errors.phone} />
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
                <Link
                  href="/cart"
                  className="text-center text-[14px] text-brass hover:underline sm:text-left"
                >
                  ‹ Return to cart
                </Link>
                <button
                  type="button"
                  onClick={() => goToStep("shipping")}
                  className="min-h-14 cursor-pointer rounded-md bg-ink px-8 font-display text-sm font-medium uppercase tracking-[0.12em] text-paper transition-opacity hover:opacity-90"
                >
                  Continue to shipping
                </button>
              </div>
            </div>
          ) : null}

          {/* SHIPPING */}
          {step === "shipping" ? (
            <div className="space-y-6">
              <section className="rounded-md border border-hairline text-[14px]">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline px-4 py-3">
                  <div>
                    <p className="text-[12px] text-taupe">Contact</p>
                    <p className="text-ink">{email}</p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-[13px] text-brass hover:underline"
                    onClick={() => setStep("information")}
                  >
                    Change
                  </button>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-[12px] text-taupe">Ship to</p>
                    <p className="text-ink">
                      {[
                        address.address1,
                        address.address2,
                        address.city,
                        address.province,
                        address.postalCode,
                        address.country === "PK" ? "Pakistan" : address.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-[13px] text-brass hover:underline"
                    onClick={() => setStep("information")}
                  >
                    Change
                  </button>
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-display text-xl font-medium text-ink">
                  Shipping method
                </h2>
                <div className="overflow-hidden rounded-md border border-hairline">
                  {SHIPPING_METHODS.map((method, idx) => {
                    const price = shippingPricePkr(method.id, afterDiscount);
                    const free =
                      (method.id === "standard" && price === 0) ||
                      (freeShipPromo && method.id === "standard");
                    const selected = shippingMethodId === method.id;
                    return (
                      <label
                        key={method.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-4 py-4",
                          idx > 0 && "border-t border-hairline",
                          selected && "bg-muted",
                        )}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          checked={selected}
                          onChange={() => setShippingMethodId(method.id)}
                          className="h-4 w-4 accent-brass"
                        />
                        <span className="flex-1">
                          <span className="block font-medium text-ink">
                            {method.title}
                          </span>
                          <span className="block text-[13px] text-taupe">
                            {method.description}
                          </span>
                        </span>
                        <span className="text-[14px] font-medium text-ink">
                          {free ? "Free" : null}
                          {!free ? (
                            <PriceInline pkr={price} />
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <div className="flex flex-col-reverse items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setStep("information")}
                  className="cursor-pointer text-center text-[14px] text-brass hover:underline sm:text-left"
                >
                  ‹ Return to information
                </button>
                <button
                  type="button"
                  onClick={() => goToStep("payment")}
                  className="min-h-14 cursor-pointer rounded-md bg-ink px-8 font-display text-sm font-medium uppercase tracking-[0.12em] text-paper transition-opacity hover:opacity-90"
                >
                  Continue to payment
                </button>
              </div>
            </div>
          ) : null}

          {/* PAYMENT */}
          {step === "payment" ? (
            <div className="space-y-6">
              <section className="rounded-md border border-hairline text-[14px]">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline px-4 py-3">
                  <div>
                    <p className="text-[12px] text-taupe">Contact</p>
                    <p>{email}</p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-[13px] text-brass hover:underline"
                    onClick={() => setStep("information")}
                  >
                    Change
                  </button>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline px-4 py-3">
                  <div>
                    <p className="text-[12px] text-taupe">Ship to</p>
                    <p>
                      {[address.address1, address.city, address.province]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-[13px] text-brass hover:underline"
                    onClick={() => setStep("information")}
                  >
                    Change
                  </button>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-[12px] text-taupe">Method</p>
                    <p>
                      {shippingLabel}
                      {shippingPkr === 0
                        ? " · Free"
                        : shippingPkr != null
                          ? ` · `
                          : ""}
                      {shippingPkr != null && shippingPkr > 0 ? (
                        <PriceInline pkr={shippingPkr} />
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-[13px] text-brass hover:underline"
                    onClick={() => setStep("shipping")}
                  >
                    Change
                  </button>
                </div>
              </section>

              <section>
                <h2 className="mb-1 font-display text-xl font-medium text-ink">
                  Payment
                </h2>
                <p className="mb-3 text-sm text-taupe">
                  Choose cash on delivery or bank transfer. Online card will be available once a payment gateway is connected.
                </p>
                <div className="overflow-hidden rounded-md border border-hairline">
                  {PAYMENT_METHODS.map((method, idx) => {
                    const selected = paymentMethod === method.id;
                    return (
                      <div key={method.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 px-4 py-4",
                            idx > 0 && "border-t border-hairline",
                            selected && "bg-muted",
                          )}
                        >
                          <input
                            type="radio"
                            name="payment"
                            checked={selected}
                            onChange={() => setPaymentMethod(method.id)}
                            className="mt-1 h-4 w-4 shrink-0 accent-brass"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-ink">
                                {method.title}
                              </span>
                              {method.badge ? (
                                <span className="rounded bg-ink px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide text-paper">
                                  {method.badge}
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block text-[13px] text-taupe">
                              {method.description}
                            </span>
                          </span>
                        </label>

                        {selected && method.id === "cod" ? (
                          <div className="space-y-3 border-t border-hairline bg-canvas-deep px-4 py-4 text-[13px] leading-relaxed text-taupe">
                            <p className="font-medium text-ink">
                              How cash on delivery works
                            </p>
                            <ul className="list-disc space-y-1.5 pl-4">
                              <li>
                                Pay the courier in cash for your order total (
                                <span className="font-medium text-ink">
                                  <PriceInline pkr={totalPkr} />
                                </span>
                                ).
                              </li>
                              <li>
                                Keep exact change ready when possible. The courier may call before delivery.
                              </li>
                              <li>
                                Order is confirmed immediately. No online payment is taken now.
                              </li>
                            </ul>
                          </div>
                        ) : null}

                        {selected && method.id === "bank" ? (
                          <div className="space-y-3 border-t border-hairline bg-canvas-deep px-4 py-4 text-[13px] leading-relaxed text-taupe">
                            <p className="font-medium text-ink">
                              Transfer to this account
                            </p>
                            <dl className="grid gap-2 rounded-md border border-hairline bg-paper p-3 sm:grid-cols-2">
                              <div>
                                <dt className="text-[11px] uppercase tracking-wide text-taupe">
                                  Bank
                                </dt>
                                <dd className="mt-0.5 font-medium text-ink">
                                  {siteConfig.bankTransfer.bankName}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[11px] uppercase tracking-wide text-taupe">
                                  Account title
                                </dt>
                                <dd className="mt-0.5 font-medium text-ink">
                                  {siteConfig.bankTransfer.accountTitle}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[11px] uppercase tracking-wide text-taupe">
                                  Account number
                                </dt>
                                <dd className="mt-0.5 font-mono text-[13px] font-medium text-ink">
                                  {siteConfig.bankTransfer.accountNumber}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-[11px] uppercase tracking-wide text-taupe">
                                  IBAN
                                </dt>
                                <dd className="mt-0.5 break-all font-mono text-[12px] font-medium text-ink">
                                  {siteConfig.bankTransfer.iban}
                                </dd>
                              </div>
                              <div className="sm:col-span-2">
                                <dt className="text-[11px] uppercase tracking-wide text-taupe">
                                  Branch
                                </dt>
                                <dd className="mt-0.5 text-ink">
                                  {siteConfig.bankTransfer.branch}
                                </dd>
                              </div>
                              <div className="sm:col-span-2 border-t border-hairline pt-2">
                                <dt className="text-[11px] uppercase tracking-wide text-taupe">
                                  Amount to transfer
                                </dt>
                                <dd className="mt-0.5 text-[15px] font-semibold text-ink">
                                  <PriceInline pkr={totalPkr} />
                                </dd>
                              </div>
                            </dl>
                            <ul className="list-disc space-y-1.5 pl-4">
                              <li>
                                Place the order first so you receive an order number. Use that number as the transfer reference.
                              </li>
                              <li>{siteConfig.bankTransfer.note}</li>
                              <li>
                                We confirm the transfer and then process shipping. Status may show as confirmed once recorded.
                              </li>
                            </ul>
                          </div>
                        ) : null}

                        {selected && method.id === "card" ? (
                          /* Online card (Visa / Mastercard) — UI kept for when a gateway goes live.
                          <div className="space-y-3 border-t border-hairline bg-canvas-deep px-4 py-4">
                            ...
                          </div>
                          */
                          null
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-display text-xl font-medium text-ink">
                  Billing address
                </h2>
                <div className="overflow-hidden rounded-md border border-hairline">
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-4 py-4",
                      billingSame && "bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="billing"
                      checked={billingSame}
                      onChange={() => setBillingSame(true)}
                      className="h-4 w-4 accent-brass"
                    />
                    <span className="text-[14px]">Same as shipping address</span>
                  </label>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 border-t border-hairline px-4 py-4",
                      !billingSame && "bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="billing"
                      checked={!billingSame}
                      onChange={() => setBillingSame(false)}
                      className="h-4 w-4 accent-brass"
                    />
                    <span className="text-[14px]">Use a different billing address</span>
                  </label>
                  {!billingSame ? (
                    <div className="space-y-3 border-t border-hairline bg-canvas-deep px-4 py-4">
                      <CheckoutSelect
                        id="bcountry"
                        label="Country / region"
                        value={billing.country}
                        onChange={(e) =>
                          setAddr(setBilling)("country", e.target.value)
                        }
                      >
                        <option value="PK">Pakistan</option>
                      </CheckoutSelect>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <CheckoutField
                            id="bfirstName"
                            label="First name"
                            value={billing.firstName}
                            onChange={(e) =>
                              setAddr(setBilling)("firstName", e.target.value)
                            }
                          />
                          <CheckoutError message={errors.bfirstName} />
                        </div>
                        <div>
                          <CheckoutField
                            id="blastName"
                            label="Last name"
                            value={billing.lastName}
                            onChange={(e) =>
                              setAddr(setBilling)("lastName", e.target.value)
                            }
                          />
                          <CheckoutError message={errors.blastName} />
                        </div>
                      </div>
                      <div>
                        <CheckoutField
                          id="baddress1"
                          label="Address"
                          value={billing.address1}
                          onChange={(e) =>
                            setAddr(setBilling)("address1", e.target.value)
                          }
                        />
                        <CheckoutError message={errors.baddress1} />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <CheckoutField
                            id="bcity"
                            label="City"
                            value={billing.city}
                            onChange={(e) =>
                              setAddr(setBilling)("city", e.target.value)
                            }
                          />
                          <CheckoutError message={errors.bcity} />
                        </div>
                        <div>
                          <CheckoutSelect
                            id="bprovince"
                            label="Province"
                            value={billing.province}
                            onChange={(e) =>
                              setAddr(setBilling)("province", e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            {PK_PROVINCES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </CheckoutSelect>
                          <CheckoutError message={errors.bprovince} />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <section>
                <CheckoutCheckbox
                  id="remember"
                  label="Save my information for a faster checkout"
                  checked={rememberMe}
                  onChange={setRememberMe}
                />
                <label className="mt-4 block text-[13px] text-taupe" htmlFor="notes">
                  Order notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-md border border-hairline bg-paper px-3 py-2.5 font-serif text-base text-ink outline-none focus:border-brass focus:ring-2 focus:ring-brass/20"
                  placeholder="Delivery instructions, gift timing, etc."
                />
              </section>

              <div className="flex flex-col-reverse items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setStep("shipping")}
                  className="cursor-pointer text-center text-[14px] text-brass hover:underline sm:text-left"
                >
                  ‹ Return to shipping
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitOrder}
                  className="min-h-14 cursor-pointer rounded-md bg-ink px-8 font-display text-sm font-medium uppercase tracking-[0.12em] text-paper transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting
                    ? "Processing…"
                    : paymentMethod === "cod"
                      ? "Complete order · COD"
                      : paymentMethod === "bank"
                        ? "Place order · Bank transfer"
                        : "Pay now"}
                </button>
              </div>
            </div>
          ) : null}

          <footer className="mt-12 border-t border-hairline pt-5">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-brass">
              <li>
                <Link href="/policies/refund-policy" className="hover:underline">
                  Refund policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:underline">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy" className="hover:underline">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/policies/terms-of-service" className="hover:underline">
                  Terms of service
                </Link>
              </li>
            </ul>
          </footer>
        </div>

        {/* Summary column */}
        <div className="order-1 lg:order-2">
          <CheckoutOrderSummary
            lines={lines}
            subtotalPkr={subtotal}
            discountPkr={discountPkr}
            discountCode={discountCode}
            shippingPkr={shippingPkr}
            shippingLabel={step === "information" ? undefined : shippingLabel}
            totalPkr={totalPkr}
            onApplyDiscount={applyDiscount}
            onRemoveDiscount={() => {
              setDiscountCode("");
              setDiscountPkr(0);
              setFreeShipPromo(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PriceInline({ pkr }: { pkr: number }) {
  const { format } = useCurrency();
  return <>{format(pkr)}</>;
}

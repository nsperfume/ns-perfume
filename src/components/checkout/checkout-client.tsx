"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCart } from "@/context/cart";
import { useCurrency } from "@/context/currency";
import { useCustomer } from "@/context/customer";
import {
  CHECKOUT_ORDER_STORAGE_KEY,
  emptyAddress,
  formatPkMobile,
  normalizePkMobile,
  PAYMENT_METHODS,
  PK_MOBILE_ERROR,
  PK_PROVINCES,
  type CheckoutAddress,
  type CompletedOrderSnapshot,
  type PaymentMethodId,
  type ShippingMethodId,
} from "@/lib/checkout";
import { cn } from "@/lib/cn";
import {
  CheckoutCheckbox,
  CheckoutField,
  CheckoutSelect,
} from "@/components/checkout/fields";
import { CheckoutOrderSummary } from "@/components/checkout/order-summary";
import { BankDetails } from "@/components/checkout/bank-details";
import { PayableAmount } from "@/components/commerce/price";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/data/site";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useCheckoutConfig } from "@/context/checkout-config";
import { computeTotals, enabledShippingMethods, shippingFor } from "@/lib/checkout-config";
import { estimateDeliveryRange } from "@/lib/order-status";

type Step = "information" | "shipping" | "payment";

type FieldErrors = Record<string, string>;

/** Field ids in the order they appear, so focus lands on the first problem. */
const INFORMATION_FIELDS = [
  "email",
  "phone",
  "firstName",
  "lastName",
  "address1",
  "city",
  "province",
] as const;
const BILLING_FIELDS = ["bfirstName", "blastName", "baddress1", "bcity", "bprovince"] as const;

const DRAFT_KEY = "ns-checkout-draft";

const primaryButton =
  "min-h-14 cursor-pointer rounded-full bg-ink px-8 text-label text-paper transition-colors hover:bg-brass hover:text-ink focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";
const backLink =
  "inline-flex min-h-11 cursor-pointer items-center justify-center text-sm font-medium text-brass-ink underline-offset-4 hover:underline sm:justify-start";
const stepHeading = "text-heading-sm text-ink outline-none";

function formatDay(iso: string) {
  // e.g. "Thu 29 Oct"
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(new Date(iso))
    .replace(",", "");
}

function expectedDelivery(methodId: ShippingMethodId, description: string) {
  const { from, to } = estimateDeliveryRange(new Date(), methodId, description);
  const a = formatDay(from);
  const b = formatDay(to);
  return a === b ? `Expected ${a}` : `Expected ${a} to ${b}`;
}

function addressLine(a: CheckoutAddress) {
  return [a.address1, a.address2, a.city, a.province, a.postalCode, "Pakistan"]
    .filter(Boolean)
    .join(", ");
}

function breadcrumbs(step: Step, onGo: (s: Step) => void) {
  const items: { id: Step | "cart"; label: string; href?: string }[] = [
    { id: "cart", label: "Cart", href: "/cart" },
    { id: "information", label: "Information" },
    { id: "shipping", label: "Shipping" },
    { id: "payment", label: "Payment" },
  ];
  const order = ["cart", "information", "shipping", "payment"] as const;
  const currentIdx = order.indexOf(step);
  return (
    <nav aria-label="Checkout steps" className="mb-8 text-sm text-taupe">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => {
          const active = item.id === step;
          const pastIdx = order.indexOf(item.id as (typeof order)[number]);
          const canNavigate =
            item.id !== "cart" && pastIdx >= 0 && pastIdx < currentIdx;
          return (
            <li key={item.id} className="flex items-center gap-1.5">
              {i > 0 ? <span className="text-taupe/60" aria-hidden>›</span> : null}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-brass-ink underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              ) : canNavigate ? (
                <button
                  type="button"
                  className="cursor-pointer text-brass-ink underline-offset-4 hover:underline"
                  onClick={() => onGo(item.id as Step)}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  aria-current={active ? "step" : undefined}
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

/** One row of the "Contact / Ship to / Method" review box. */
function ReviewRow({
  label,
  changeLabel,
  onChange,
  last,
  children,
}: {
  label: string;
  changeLabel: string;
  onChange: () => void;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-4 py-3",
        last ? "" : "border-b border-hairline",
      )}
    >
      <div className="min-w-0">
        <p className="text-eyebrow text-taupe">{label}</p>
        <div className="mt-0.5 text-ink">{children}</div>
      </div>
      <button
        type="button"
        className="inline-flex min-h-10 shrink-0 cursor-pointer items-center text-sm font-medium text-brass-ink underline-offset-4 hover:underline"
        onClick={onChange}
        aria-label={changeLabel}
      >
        Change
      </button>
    </div>
  );
}

export function CheckoutClient() {
  const router = useRouter();
  const { lines, subtotal, clearCart, closeCart } = useCart();
  const { displayCurrency } = useCurrency();
  const { user } = useCustomer();

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>("information");
  const [email, setEmail] = useState("");
  // Marketing consent is never assumed: unticked until the shopper ticks it.
  const [marketing, setMarketing] = useState(false);
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const checkoutConfig = useCheckoutConfig();
  const shippingMethods = enabledShippingMethods(checkoutConfig);
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>(
    () => shippingMethods[0]?.id ?? "standard",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("cod");
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<CheckoutAddress>(emptyAddress);
  const [discountCode, setDiscountCode] = useState("");
  const [discountPkr, setDiscountPkr] = useState(0);
  const [freeShipPromo, setFreeShipPromo] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /** Field to focus once the current step has rendered. */
  const [focusField, setFocusField] = useState<string | null>(null);

  const headingRefs = {
    information: useRef<HTMLHeadingElement>(null),
    shipping: useRef<HTMLHeadingElement>(null),
    payment: useRef<HTMLHeadingElement>(null),
  };
  const stepChanged = useRef(false);

  useEffect(() => {
    closeCart();
    setHydrated(true);
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved) as {
          email?: string;
          address?: CheckoutAddress;
        };
        if (d.email) setEmail(d.email);
        if (d.address) setAddress({ ...emptyAddress(), ...d.address, company: "", country: "PK" });
      }
    } catch {
      /* ignore */
    }
  }, [closeCart]);

  useEffect(() => {
    if (!user) return;
    setEmail((prev) => prev || user.email);
    setAddress((prev) => {
      if (prev.firstName || prev.lastName || prev.phone) return prev;
      const parts = (user.name || "").trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");
      return {
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        phone: prev.phone || user.phone || "",
      };
    });
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ email, address }));
    } catch {
      /* ignore */
    }
  }, [email, address, hydrated]);

  // After a failed Continue: focus the first invalid field and bring it into view.
  useEffect(() => {
    if (!focusField) return;
    const el = document.getElementById(focusField);
    setFocusField(null);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [focusField, step]);

  // When the step changes, move focus to the new step's heading.
  useEffect(() => {
    if (!stepChanged.current) return;
    stepChanged.current = false;
    if (focusField) return;
    headingRefs[step].current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable
  }, [step]);

  const afterDiscount = Math.max(0, subtotal - discountPkr);
  // Same rules the order API applies when it prices the order.
  const totals = computeTotals(checkoutConfig, {
    subtotalPkr: subtotal,
    discountPkr,
    shippingMethodId,
    paymentMethod,
    freeShippingCoupon: freeShipPromo,
  });
  // Before the shipping step, only show a price when it is already settled (free).
  const shippingPkr =
    step === "information" ? (totals.shippingPkr === 0 ? 0 : null) : totals.shippingPkr;
  // The cash-on-delivery fee applies once the shopper is choosing how to pay.
  const codFeePkr = step === "payment" ? totals.codFeePkr : 0;
  const totalPkr = afterDiscount + (shippingPkr ?? 0) + totals.taxPkr + codFeePkr;

  const shippingLabel = checkoutConfig.shipping[shippingMethodId]?.title;
  const customerName = [address.firstName, address.lastName].filter(Boolean).join(" ");

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setAddr =
    (setter: typeof setAddress, prefix = "") =>
    (key: keyof CheckoutAddress, value: string) => {
      setter((prev) => ({ ...prev, [key]: value }));
      clearError(`${prefix}${key}`);
    };
  const setShip = setAddr(setAddress);
  const setBill = setAddr(setBilling, "b");

  const applyDiscount = async (code: string): Promise<string | null> => {
    if (!code.trim()) return "Enter a discount code";
    try {
      const res = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(code.trim())}&subtotal=${subtotal}`,
      );
      const json = await res.json();
      if (!json.ok || !json.data) {
        return json.error || "Enter a valid discount code";
      }
      setDiscountCode(json.data.code);
      setDiscountPkr(json.data.amountPkr || 0);
      setFreeShipPromo(Boolean(json.data.freeShipping));
      return null;
    } catch {
      return "Could not validate discount code";
    }
  };

  const informationErrors = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email";
    }
    if (!address.phone.trim()) next.phone = "Enter your mobile number";
    else if (!normalizePkMobile(address.phone)) next.phone = PK_MOBILE_ERROR;
    if (!address.firstName.trim()) next.firstName = "Enter a first name";
    if (!address.lastName.trim()) next.lastName = "Enter a last name";
    if (!address.address1.trim()) next.address1 = "Enter an address";
    if (!address.city.trim()) next.city = "Enter a city";
    if (!address.province.trim()) next.province = "Select a province";
    return next;
  };

  const billingErrors = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!billingSame) {
      if (!billing.firstName.trim()) next.bfirstName = "Enter a first name";
      if (!billing.lastName.trim()) next.blastName = "Enter a last name";
      if (!billing.address1.trim()) next.baddress1 = "Enter an address";
      if (!billing.city.trim()) next.bcity = "Enter a city";
      if (!billing.province.trim()) next.bprovince = "Select a province";
    }
    return next;
  };

  /** Show errors and focus the first one. Returns true when there are none. */
  const report = (next: FieldErrors, order: readonly string[]) => {
    setErrors(next);
    const first = order.find((k) => next[k]);
    if (first) setFocusField(first);
    return !first;
  };

  const changeStep = (next: Step) => {
    if (next !== step) stepChanged.current = true;
    setFormError(null);
    setStep(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const goToStep = (next: Step) => {
    if (next === "shipping" || next === "payment") {
      const errs = informationErrors();
      if (Object.keys(errs).length) {
        if (step !== "information") {
          stepChanged.current = true;
          setStep("information");
        }
        report(errs, INFORMATION_FIELDS);
        return;
      }
      // Show the number in one tidy form ("0300 1234567"); it is sent as 03001234567.
      const pretty = formatPkMobile(address.phone);
      if (pretty !== address.phone) setAddress((prev) => ({ ...prev, phone: pretty }));
      setErrors({});
    }
    changeStep(next);
  };

  const submitOrder = async () => {
    const infoErrs = informationErrors();
    if (Object.keys(infoErrs).length) {
      goToStep("shipping");
      return;
    }
    if (!report(billingErrors(), BILLING_FIELDS)) return;
    const phone = normalizePkMobile(address.phone) as string;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone,
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
          shippingAddress: { ...address, company: "", country: "PK", phone },
          billingAddress: billingSame
            ? undefined
            : { ...billing, company: "", country: "PK" },
          billingSameAsShipping: billingSame,
          shippingMethodId,
          paymentMethod,
          discountCode,
          marketingOptIn: marketing,
          notes,
          currency: displayCurrency,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setSubmitting(false);
        if (json.error === PK_MOBILE_ERROR) {
          stepChanged.current = true;
          setStep("information");
          report({ phone: PK_MOBILE_ERROR }, INFORMATION_FIELDS);
          return;
        }
        setFormError(json.error || "Could not place order. Try again.");
        return;
      }

      const data = json.data;
      const snapshot: CompletedOrderSnapshot = {
        orderNumber: data.orderNumber,
        invoiceUrl:
          typeof data.invoiceUrl === "string" ? data.invoiceUrl : undefined,
        email: data.email,
        phone: data.phone,
        customerName: data.customerName,
        totalPkr: data.totalPkr,
        subtotalPkr: data.subtotalPkr,
        shippingPkr: data.shippingPkr,
        discountPkr: data.discountPkr || 0,
        codFeePkr: data.codFeePkr || 0,
        taxPkr: data.taxPkr || 0,
        taxIncludedPkr: data.taxIncludedPkr || 0,
        taxLabel: data.taxLabel || "",
        discountCode: data.discountCode,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        shippingMethodTitle: data.shippingMethod?.title || "Standard",
        shippingAddress: { ...address, phone },
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
        confirmationEmail: Boolean(data.confirmationEmail),
      };

      sessionStorage.setItem(
        CHECKOUT_ORDER_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
      clearCart();
      if (!rememberMe) {
        try {
          localStorage.removeItem(DRAFT_KEY);
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
      <BrandLoaderBlock className="min-h-dvh bg-canvas" label="Loading checkout" />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <p className="font-sans text-lg text-ink">Your cart is empty</p>
        <Link
          href="/collections/bestsellers"
          className="font-sans text-sm font-semibold text-brass-ink hover:underline"
        >
          Shop bestsellers
        </Link>
      </div>
    );
  }

  const reviewContact = (
    <ReviewRow
      label="Contact"
      changeLabel="Change contact details"
      onChange={() => changeStep("information")}
    >
      <p className="break-words">{email}</p>
      <p className="font-sans tabular-nums">{formatPkMobile(address.phone)}</p>
    </ReviewRow>
  );
  const reviewShipTo = (last: boolean) => (
    <ReviewRow
      label="Ship to"
      changeLabel="Change delivery address"
      onChange={() => changeStep("information")}
      last={last}
    >
      <p className="font-medium">{customerName}</p>
      <p className="text-taupe">{addressLine(address)}</p>
    </ReviewRow>
  );

  return (
    <div className="min-h-dvh bg-canvas text-base leading-relaxed text-ink antialiased lg:bg-[linear-gradient(90deg,var(--color-canvas)_50%,var(--color-canvas-deep)_50%)]">
      <div className="mx-auto grid min-h-dvh max-w-[1240px] lg:grid-cols-2 2xl:max-w-[1360px]">
        {/* Form column */}
        <div className="order-2 bg-canvas px-5 pb-16 pt-6 sm:px-8 lg:order-1 lg:pl-[var(--gutter)] lg:pr-14 lg:pt-12 xl:pr-20">
          <header className="mb-8 text-center lg:text-left">
            <Link
              href="/"
              aria-label={`${siteConfig.name} home`}
              className="inline-block text-ink"
            >
              <Logo className="h-9 sm:h-10 lg:h-11" />
            </Link>
          </header>

          <div>{breadcrumbs(step, goToStep)}</div>

          {formError ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-rosewood/30 bg-rosewood/10 px-4 py-3 text-sm font-medium text-rosewood"
            >
              {formError}
            </div>
          ) : null}

          {/* INFORMATION */}
          {step === "information" ? (
            <form
              noValidate
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                goToStep("shipping");
              }}
            >
              <section aria-labelledby="checkout-contact">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                  <h2
                    id="checkout-contact"
                    ref={headingRefs.information}
                    tabIndex={-1}
                    className={stepHeading}
                  >
                    Contact
                  </h2>
                  {!user ? (
                    <p className="text-[0.8125rem] text-taupe">
                      Already have an account?{" "}
                      <Link
                        href={`/account?next=${encodeURIComponent("/checkout")}`}
                        className="text-brass-ink underline-offset-4 hover:underline"
                      >
                        Log in
                      </Link>
                    </p>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <CheckoutField
                    id="email"
                    label="Email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    error={errors.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                  />
                  <CheckoutField
                    id="phone"
                    label="Mobile number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={address.phone}
                    error={errors.phone}
                    hint="For delivery updates and WhatsApp"
                    onChange={(e) => setShip("phone", e.target.value)}
                    onBlur={(e) => {
                      const n = normalizePkMobile(e.target.value);
                      if (n) setShip("phone", formatPkMobile(n));
                    }}
                  />
                </div>
                <CheckoutCheckbox
                  id="marketing"
                  className="mt-2"
                  label="Email me with news and offers"
                  checked={marketing}
                  onChange={setMarketing}
                />
              </section>

              <section aria-labelledby="checkout-delivery">
                <h2 id="checkout-delivery" className="text-heading-sm text-ink">
                  Delivery
                </h2>
                <p className="mb-3 mt-1 text-sm text-taupe">
                  We deliver across Pakistan.
                </p>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CheckoutField
                      id="firstName"
                      label="First name"
                      autoComplete="given-name"
                      required
                      value={address.firstName}
                      error={errors.firstName}
                      onChange={(e) => setShip("firstName", e.target.value)}
                    />
                    <CheckoutField
                      id="lastName"
                      label="Last name"
                      autoComplete="family-name"
                      required
                      value={address.lastName}
                      error={errors.lastName}
                      onChange={(e) => setShip("lastName", e.target.value)}
                    />
                  </div>
                  <CheckoutField
                    id="address1"
                    label="Address"
                    autoComplete="address-line1"
                    required
                    value={address.address1}
                    error={errors.address1}
                    onChange={(e) => setShip("address1", e.target.value)}
                  />
                  <CheckoutField
                    id="address2"
                    label="House, flat or nearest landmark (optional)"
                    autoComplete="address-line2"
                    value={address.address2}
                    onChange={(e) => setShip("address2", e.target.value)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CheckoutField
                      id="city"
                      className="min-w-0"
                      label="City"
                      autoComplete="address-level2"
                      required
                      value={address.city}
                      error={errors.city}
                      onChange={(e) => setShip("city", e.target.value)}
                    />
                    <CheckoutSelect
                      id="province"
                      className="min-w-0"
                      label="Province"
                      autoComplete="address-level1"
                      required
                      value={address.province}
                      error={errors.province}
                      onChange={(e) => setShip("province", e.target.value)}
                    >
                      <option value="">Select</option>
                      {PK_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </CheckoutSelect>
                    <CheckoutField
                      id="postalCode"
                      className="min-w-0"
                      label="Postal code (optional)"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      value={address.postalCode}
                      onChange={(e) => setShip("postalCode", e.target.value)}
                    />
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
                <Link href="/cart" className={backLink}>
                  ‹ Return to cart
                </Link>
                <button type="submit" className={primaryButton}>
                  Continue to shipping
                </button>
              </div>
            </form>
          ) : null}

          {/* SHIPPING */}
          {step === "shipping" ? (
            <div className="space-y-6">
              <section aria-label="Your details" className="rounded-xl border border-hairline text-body-sm">
                {reviewContact}
                {reviewShipTo(true)}
              </section>

              <fieldset className="min-w-0">
                <legend className="mb-3 p-0">
                  <h2 ref={headingRefs.shipping} tabIndex={-1} className={stepHeading}>
                    Shipping method
                  </h2>
                </legend>
                <div className="overflow-hidden rounded-xl border border-hairline">
                  {shippingMethods.map((method, idx) => {
                    const price = shippingFor(checkoutConfig, method.id, afterDiscount, freeShipPromo);
                    const free = price === 0;
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
                          value={method.id}
                          checked={selected}
                          onChange={() => setShippingMethodId(method.id)}
                          className="h-4 w-4 shrink-0 accent-brass"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-ink">
                            {method.title}
                          </span>
                          <span className="block text-[0.8125rem] text-taupe">
                            {method.description}
                          </span>
                          <span className="mt-0.5 block text-[0.8125rem] text-ink">
                            {expectedDelivery(method.id, method.description)}
                          </span>
                        </span>
                        <span className="shrink-0 font-sans text-sm font-medium tabular-nums text-ink">
                          {free ? "Free" : <PriceInline pkr={price} />}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-col-reverse items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => changeStep("information")}
                  className={backLink}
                >
                  ‹ Return to information
                </button>
                <button
                  type="button"
                  onClick={() => goToStep("payment")}
                  className={primaryButton}
                >
                  Continue to payment
                </button>
              </div>
            </div>
          ) : null}

          {/* PAYMENT */}
          {step === "payment" ? (
            <div className="space-y-6">
              <section aria-label="Your details" className="rounded-xl border border-hairline text-body-sm">
                {reviewContact}
                {reviewShipTo(false)}
                <ReviewRow
                  label="Method"
                  changeLabel="Change shipping method"
                  onChange={() => changeStep("shipping")}
                  last
                >
                  <p>
                    {shippingLabel}
                    {" · "}
                    {shippingPkr === 0 ? (
                      "Free"
                    ) : shippingPkr != null ? (
                      <span className="font-sans tabular-nums">
                        <PriceInline pkr={shippingPkr} />
                      </span>
                    ) : null}
                  </p>
                  <p className="text-taupe">
                    {expectedDelivery(
                      shippingMethodId,
                      checkoutConfig.shipping[shippingMethodId]?.description ?? "",
                    )}
                  </p>
                </ReviewRow>
              </section>

              <fieldset className="min-w-0">
                <legend className="mb-1 p-0">
                  <h2 ref={headingRefs.payment} tabIndex={-1} className={stepHeading}>
                    Payment
                  </h2>
                </legend>
                <p className="mb-3 text-sm text-taupe">
                  Pay cash on delivery, or by bank transfer, JazzCash or Easypaisa.
                </p>
                <div className="overflow-hidden rounded-xl border border-hairline">
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
                            value={method.id}
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
                                <span className="rounded-xl bg-ink px-1.5 py-0.5 text-eyebrow text-paper">
                                  {method.badge}
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block text-[0.8125rem] text-taupe">
                              {method.description}
                            </span>
                          </span>
                        </label>

                        {selected && method.id === "cod" ? (
                          <div className="space-y-3 border-t border-hairline bg-canvas-deep px-4 py-4 text-[0.8125rem] leading-relaxed text-taupe">
                            <p className="font-medium text-ink">
                              How cash on delivery works
                            </p>
                            <ul className="list-disc space-y-1.5 pl-4">
                              <li>
                                We will call or WhatsApp you to confirm before dispatch.
                              </li>
                              <li>
                                Pay the courier{" "}
                                <PayableAmount
                                  amountPkr={totalPkr}
                                  className="font-sans font-medium tabular-nums text-ink"
                                />{" "}
                                in cash when your order arrives. Keep exact change
                                ready if you can.
                              </li>
                              <li>Nothing is charged online.</li>
                            </ul>
                          </div>
                        ) : null}

                        {selected && method.id === "bank" ? (
                          <div className="space-y-3 border-t border-hairline bg-canvas-deep px-4 py-4 text-[0.8125rem] leading-relaxed text-taupe">
                            <p className="font-medium text-ink">
                              Pay to this account or wallet
                            </p>
                            <BankDetails />
                            <div className="rounded-xl border border-hairline bg-paper px-3 py-2.5">
                              <p className="text-eyebrow text-taupe">
                                Amount to transfer
                              </p>
                              <p className="mt-0.5 font-sans text-[0.9375rem] font-semibold tabular-nums text-ink">
                                <PayableAmount
                                  amountPkr={totalPkr}
                                  variant="stacked"
                                />
                              </p>
                            </div>
                            <p>
                              Place your order to get an order number. Use it as
                              the transfer reference, then send the receipt to us
                              on WhatsApp at{" "}
                              <span className="font-sans font-medium tabular-nums text-ink">
                                {formatPkMobile(siteConfig.phone)}
                              </span>
                              . We ship once the payment is confirmed.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="min-w-0">
                <legend className="mb-3 p-0">
                  <h2 className="text-heading-sm text-ink">Billing address</h2>
                </legend>
                <div className="overflow-hidden rounded-xl border border-hairline">
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
                    <span className="text-sm">Same as shipping address</span>
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
                    <span className="text-sm">Use a different billing address</span>
                  </label>
                  {!billingSame ? (
                    <div className="space-y-3 border-t border-hairline bg-canvas-deep px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <CheckoutField
                          id="bfirstName"
                          label="First name"
                          autoComplete="billing given-name"
                          required
                          value={billing.firstName}
                          error={errors.bfirstName}
                          onChange={(e) => setBill("firstName", e.target.value)}
                        />
                        <CheckoutField
                          id="blastName"
                          label="Last name"
                          autoComplete="billing family-name"
                          required
                          value={billing.lastName}
                          error={errors.blastName}
                          onChange={(e) => setBill("lastName", e.target.value)}
                        />
                      </div>
                      <CheckoutField
                        id="baddress1"
                        label="Address"
                        autoComplete="billing address-line1"
                        required
                        value={billing.address1}
                        error={errors.baddress1}
                        onChange={(e) => setBill("address1", e.target.value)}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <CheckoutField
                          id="bcity"
                          className="min-w-0"
                          label="City"
                          autoComplete="billing address-level2"
                          required
                          value={billing.city}
                          error={errors.bcity}
                          onChange={(e) => setBill("city", e.target.value)}
                        />
                        <CheckoutSelect
                          id="bprovince"
                          className="min-w-0"
                          label="Province"
                          autoComplete="billing address-level1"
                          required
                          value={billing.province}
                          error={errors.bprovince}
                          onChange={(e) => setBill("province", e.target.value)}
                        >
                          <option value="">Select</option>
                          {PK_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </CheckoutSelect>
                      </div>
                    </div>
                  ) : null}
                </div>
              </fieldset>

              <section>
                <CheckoutCheckbox
                  id="remember"
                  label="Save my information for a faster checkout"
                  checked={rememberMe}
                  onChange={setRememberMe}
                />
                <label className="mt-4 block text-sm font-semibold text-ink/80" htmlFor="notes">
                  Order notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="mt-2 w-full rounded-xl border border-[#d6cfbf] bg-paper px-4 py-3 text-base text-ink outline-none focus:border-brass focus:ring-2 focus:ring-brass/25"
                  placeholder="Delivery instructions or gift timing"
                />
              </section>

              <div className="flex flex-col-reverse items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => changeStep("shipping")}
                  className={backLink}
                >
                  ‹ Return to shipping
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitOrder}
                  className={primaryButton}
                >
                  {submitting ? "Placing order…" : "Place order"}
                </button>
              </div>
            </div>
          ) : null}

          <footer className="mt-12 border-t border-hairline pt-5">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-caption text-brass-ink">
              <li>
                <Link href="/policies/refund" className="hover:underline">
                  Refund policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:underline">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:underline">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:underline">
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
            shippingLabel={shippingPkr === null ? undefined : shippingLabel}
            freeShippingCoupon={freeShipPromo}
            codFeePkr={codFeePkr}
            taxPkr={totals.taxPkr}
            taxIncludedPkr={totals.taxIncludedPkr}
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

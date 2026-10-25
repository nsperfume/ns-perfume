"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_CHECKOUT_CONFIG, type CheckoutConfig } from "@/lib/checkout-config";

const CheckoutConfigContext = createContext<CheckoutConfig>(DEFAULT_CHECKOUT_CONFIG);

/** Store charges from Admin > Settings, provided once by the root layout. */
export function CheckoutConfigProvider({ value, children }: { value: CheckoutConfig; children: ReactNode }) {
  return <CheckoutConfigContext.Provider value={value}>{children}</CheckoutConfigContext.Provider>;
}

export function useCheckoutConfig() {
  return useContext(CheckoutConfigContext);
}

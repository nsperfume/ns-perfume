export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSize(ml: number): string {
  return `${ml}ML`;
}

export function concentrationLabel(value: string): string {
  return value.toUpperCase();
}

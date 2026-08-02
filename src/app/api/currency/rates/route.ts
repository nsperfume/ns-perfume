import { fetchPkrRates } from "@/lib/currency";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const data = await fetchPkrRates();
    return jsonOk({
      base: "PKR",
      rates: data.rates,
      updatedAt: data.updatedAt,
      source: data.source,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load rates", 500);
  }
}

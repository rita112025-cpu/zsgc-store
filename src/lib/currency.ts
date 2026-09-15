// Shared currency utilities — safe for both client and server (no DOM/node APIs)

export type CurrencyCode = "USD" | "EUR" | "GBP" | "TWD";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  /** Multiplier from USD to this currency */
  rate: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", label: "US Dollar", rate: 1 },
  { code: "EUR", symbol: "€", label: "Euro", rate: 0.93 },
  { code: "GBP", symbol: "£", label: "British Pound", rate: 0.79 },
  { code: "TWD", symbol: "NT$", label: "New Taiwan Dollar", rate: 31.8 },
];

export function getCurrency(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/**
 * Convert a USD-cent amount into the target currency's major unit and format it.
 * Server passes `currency` at checkout; client uses the same logic for display.
 */
export function formatMoney(usdCents: number, currency: CurrencyCode = "USD"): string {
  const info = getCurrency(currency);
  const major = (usdCents / 100) * info.rate;
  const rounded = info.code === "TWD" ? Math.round(major) : Math.round(major * 100) / 100;
  const decimals = info.code === "TWD" ? 0 : 2;
  return `${info.symbol}${rounded.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Round a USD-cent total converted to a major currency (server-side persistence). */
export function convertCentsToMajor(usdCents: number, currency: CurrencyCode): number {
  const info = getCurrency(currency);
  const major = (usdCents / 100) * info.rate;
  return info.code === "TWD" ? Math.round(major) : Math.round(major * 100) / 100;
}

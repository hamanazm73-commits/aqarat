import type { Locale } from "./types";

// Use Latin (Western) digits everywhere. They are the norm for prices in Iraq
// and, crucially, render identically on the Node server and in the browser —
// avoiding React hydration mismatches that locale-specific numerals cause.
const INTL_LOCALE: Record<Locale, string> = {
  ku: "en-US",
  en: "en-US",
  ar: "en-US",
  tk: "en-US",
};

const currencySuffix = (locale: Locale) => (locale === "en" || locale === "tk" ? "IQD" : "د.ع");

/** Format an IQD amount, e.g. 250000000 → "250,000,000 د.ع" / "250,000,000 IQD". */
export function formatIQD(amount: number, locale: Locale): string {
  const n = new Intl.NumberFormat(INTL_LOCALE[locale], {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${n} ${currencySuffix(locale)}`;
}

/** A compact price for cards, e.g. 250000000 → "250M د.ع". */
export function formatIQDCompact(amount: number, locale: Locale): string {
  const c = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
  return `${c} ${currencySuffix(locale)}`;
}

/** Localized plain number (used for area, rooms, etc.). */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
}

/** Percent off, rounded. */
export function discountPercent(oldPrice: number, newPrice: number): number {
  if (!oldPrice || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

/** Deterministic numeric date (YYYY-MM-DD, Latin digits) — same on server & client. */
export function formatDate(iso: string, _locale: Locale): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

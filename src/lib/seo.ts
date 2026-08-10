import type { Locale } from "./types";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://homes.layhama.com";

/** Kurdish sits at the root, the other two behind a prefix. */
export function urlFor(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : `/${path.replace(/^\/|\/$/g, "")}`;
  return locale === "ku"
    ? `${SITE_URL}${clean || "/"}`
    : `${SITE_URL}/${locale}${clean}`;
}

/**
 * The three addresses of one page, for `alternates.languages`.
 *
 * This is the part that gets the Arabic and English pages found at all. Each
 * version has to point at the others, or Google reads three near-identical
 * sites and picks one to keep. `x-default` is the Kurdish page, since that is
 * where a visitor with no matching language should land.
 */
export function languageAlternates(path = "/") {
  return {
    ku: urlFor("ku", path),
    en: urlFor("en", path),
    ar: urlFor("ar", path),
    "x-default": urlFor("ku", path),
  };
}

/** Canonical + hreflang together — every indexable page wants both. */
export function alternatesFor(locale: Locale, path = "/") {
  return {
    canonical: urlFor(locale, path),
    languages: languageAlternates(path),
  };
}

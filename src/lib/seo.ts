import type { Locale } from "./types";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://homes.layhama.com";

/** Kurdish sits at the root, the other three behind a prefix. */
export function urlFor(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : `/${path.replace(/^\/|\/$/g, "")}`;
  return locale === "ku"
    ? `${SITE_URL}${clean || "/"}`
    : `${SITE_URL}/${locale}${clean}`;
}

/**
 * The four addresses of one page, for `alternates.languages`.
 *
 * This is the part that gets the Arabic, English and Turkmen pages found at
 * all. Each version has to point at the others, or Google reads four
 * near-identical sites and picks one to keep. `x-default` is the Kurdish page,
 * since that is where a visitor with no matching language should land.
 *
 * The tag for Turkmen is `tk` — the site's own code happens to match the
 * ISO code, so nothing needs mapping here. Worth saying because the two are
 * not the same thing and a future language may well need translating between
 * them.
 */
export function languageAlternates(path = "/") {
  return {
    ku: urlFor("ku", path),
    en: urlFor("en", path),
    ar: urlFor("ar", path),
    tk: urlFor("tk", path),
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

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { dict } from "./dictionaries";
import { LOCALES, RTL_LOCALES, type Locale, type Localized } from "@/lib/types";

const STORAGE_KEY = "aqarat.locale";
const DEFAULT_LOCALE: Locale = "ku";

/** Kurdish lives at the root; the other two live behind a prefix. Keeping ku
 *  unprefixed means no URL that has been shared or indexed has to move. */
export const PREFIXED_LOCALES: Locale[] = ["en", "ar"];

/** The language a path is written in, or null when it carries no prefix. */
export function localeFromPath(pathname: string): Locale | null {
  const first = pathname.split("/")[1];
  return (PREFIXED_LOCALES as string[]).includes(first)
    ? (first as Locale)
    : null;
}

/** The same page in another language: `/en/properties` ⇄ `/properties`. */
export function pathForLocale(pathname: string, locale: Locale): string {
  const rest = localeFromPath(pathname)
    ? "/" + pathname.split("/").slice(2).join("/")
    : pathname;
  const clean = rest === "/" ? "" : rest.replace(/\/$/, "");
  return locale === DEFAULT_LOCALE ? clean || "/" : `/${locale}${clean}`;
}

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (typeof dict)[Locale];
  setLocale: (l: Locale) => void;
  /** Pull the right string out of a {ku,en,ar} object. */
  tr: (value: Localized | undefined) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function isLocale(v: string | null): v is Locale {
  return !!v && (LOCALES as string[]).includes(v);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // The URL is the authority when it names a language. That is what makes the
  // English and Arabic pages render as English and Arabic on the server —
  // which is the only version a crawler is guaranteed to read. Without a
  // prefix we are on the Kurdish site, and the saved choice applies.
  const urlLocale = localeFromPath(pathname);
  const [saved, setSaved] = useState<Locale>(DEFAULT_LOCALE);
  const locale = urlLocale ?? saved;

  // Restore the saved language after mount (the server renders the default).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) setSaved(stored);
  }, []);

  // Keep <html lang/dir> in sync.
  useEffect(() => {
    const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  // Switching language is a navigation now, not just a state change, so the
  // address bar keeps matching the words on the page — and so the choice can
  // be shared or bookmarked.
  const setLocale = useCallback(
    (l: Locale) => {
      setSaved(l);
      try {
        localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* storage blocked — the choice still applies for this visit */
      }
      const next = pathForLocale(pathname, l);
      if (next !== pathname) router.push(next);
    },
    [pathname, router],
  );

  const value = useMemo<I18nValue>(() => {
    const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
    return {
      locale,
      dir,
      t: dict[locale],
      setLocale,
      tr: (v) => (v ? v[locale] : ""),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dict } from "./dictionaries";
import { LOCALES, RTL_LOCALES, type Locale, type Localized } from "@/lib/types";

const STORAGE_KEY = "aqarat.locale";
const DEFAULT_LOCALE: Locale = "ku";

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
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Restore the saved language after mount (server always renders the default).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved) && saved !== locale) setLocaleState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep <html lang/dir> in sync.
  useEffect(() => {
    const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

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

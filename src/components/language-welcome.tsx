"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n/context";
import { BrandMark } from "@/components/brand-mark";
import type { Locale } from "@/lib/types";

/** Each language in its own script, with a greeting so it reads as a welcome. */
const OPTIONS: {
  locale: Locale;
  native: string;
  greeting: string;
  dir: "rtl" | "ltr";
}[] = [
  { locale: "ku", native: "کوردی", greeting: "سڵاو", dir: "rtl" },
  { locale: "ar", native: "العربية", greeting: "مرحبا", dir: "rtl" },
  { locale: "en", native: "English", greeting: "Hello", dir: "ltr" },
];

/**
 * The second step speaks the language just chosen, so its words live here
 * beside the first step's rather than in the shared dictionary — the splash
 * stays one self-contained screen.
 */
const THEME_COPY: Record<
  Locale,
  { prompt: string; dark: string; light: string; note: string }
> = {
  ku: {
    prompt: "ڕووکارەکە چۆن بێت؟",
    dark: "تاریک",
    light: "ڕووناک",
    note: "دواتر لە سەرەوەی سایتەکە دەتوانیت بیگۆڕیت",
  },
  ar: {
    prompt: "كيف تريد المظهر؟",
    dark: "داكن",
    light: "فاتح",
    note: "يمكنك تغييره لاحقًا من أعلى الموقع",
  },
  en: {
    prompt: "How should it look?",
    dark: "Dark",
    light: "Light",
    note: "You can change this later at the top of the site",
  },
};

const ORBS = [
  { cls: "size-72 -top-10 -start-10", dur: 11, delay: 0 },
  { cls: "size-56 bottom-0 end-0", dur: 13, delay: 2 },
  { cls: "size-40 top-1/3 end-1/4", dur: 9, delay: 1 },
];

const LOCALE_KEY = "aqarat.locale";
const THEME_ASKED_KEY = "aqarat.themeAsked";

/**
 * A small drawing of the site in each palette. Naming a theme means little;
 * seeing it is instant, and it reads the same in all three languages.
 *
 * The colours are written out rather than taken from `bg-primary` / `bg-gold`,
 * because those tokens follow whichever theme is active — the light card would
 * quietly repaint itself dark and stop being a picture of the light theme.
 * They are spelled out in full on purpose: Tailwind only generates a class it
 * can see as a whole string in the source, so building one from a variable
 * produces markup with no CSS behind it.
 */
function ThemePreview({ dark }: { dark: boolean }) {
  return (
    <div
      aria-hidden
      className={`mx-auto w-full overflow-hidden rounded-xl border ${
        dark ? "border-white/10 bg-[#0d1117]" : "border-black/10 bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-1 px-2 py-1.5 ${
          dark ? "bg-white/[0.06]" : "bg-[oklch(0.32_0.08_252)]"
        }`}
      >
        <span className="size-1.5 rounded-full bg-[oklch(0.75_0.16_68)]" />
        <span
          className={`h-1 w-8 rounded-full ${dark ? "bg-white/25" : "bg-white/50"}`}
        />
      </div>
      <div className="space-y-1 p-2">
        <span
          className={`block h-1.5 w-3/4 rounded-full ${
            dark ? "bg-white/30" : "bg-black/35"
          }`}
        />
        <span
          className={`block h-1.5 w-1/2 rounded-full ${
            dark ? "bg-white/15" : "bg-black/15"
          }`}
        />
        <span className="block h-4 w-10 rounded-md bg-[oklch(0.75_0.16_68)]" />
      </div>
    </div>
  );
}

/**
 * Asked once, on a visitor's first arrival: which language, then light or
 * dark. Both are saved, so the screen never appears again.
 */
export function LanguageWelcome() {
  const { setLocale } = useI18n();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"locale" | "theme">("locale");
  const [locale, setPickedLocale] = useState<Locale>("ku");
  const [picked, setPicked] = useState<Locale | null>(null);
  const [pickedTheme, setPickedTheme] = useState<"dark" | "light" | null>(null);

  // First visit = nothing saved yet. Decided on the client, so the server
  // renders nothing and there is no hydration mismatch. Someone who chose a
  // language before this screen existed still gets asked about the theme.
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(LOCALE_KEY);
      const themeAsked = localStorage.getItem(THEME_ASKED_KEY);
      if (!savedLocale) {
        setOpen(true);
      } else if (!themeAsked) {
        setPickedLocale(savedLocale as Locale);
        setStep("theme");
        setOpen(true);
      }
    } catch {
      /* storage blocked — just skip the splash */
    }
  }, []);

  // Hold the page still while the splash is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function chooseLocale(l: Locale) {
    setPicked(l);
    setPickedLocale(l);
    setLocale(l);
    // let the tick land, then move on to the look
    setTimeout(() => setStep("theme"), 460);
  }

  function chooseTheme(t: "dark" | "light") {
    setPickedTheme(t);
    setTheme(t);
    try {
      localStorage.setItem(THEME_ASKED_KEY, "1");
    } catch {
      /* storage blocked — the theme still applies for this visit */
    }
    setTimeout(() => setOpen(false), 460);
  }

  const copy = THEME_COPY[locale];
  const dir = OPTIONS.find((o) => o.locale === locale)?.dir ?? "rtl";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="locale-welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed inset-0 z-[200] overflow-hidden bg-[#0d1117]"
          role="dialog"
          aria-modal="true"
          aria-label={step === "locale" ? "Choose your language" : "Choose a theme"}
        >
          {ORBS.map((o, i) => (
            <motion.div
              key={i}
              aria-hidden
              animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
              transition={{
                duration: o.dur,
                repeat: Infinity,
                ease: "easeInOut",
                delay: o.delay,
              }}
              className={`pointer-events-none absolute rounded-full bg-gold/20 blur-3xl ${o.cls}`}
            />
          ))}
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(223,178,80,0.10),transparent_60%)]" />

          {/* centred when it fits, scrolls when the screen is short */}
          <div className="relative h-full overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-5 py-8">
              <motion.div
                initial={{ scale: 0.93, y: 24, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 150, damping: 18 }}
                className="w-full max-w-md text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.15,
                    type: "spring",
                    stiffness: 200,
                    damping: 14,
                  }}
                  className="mx-auto w-fit"
                >
                  <BrandMark className="size-14 sm:size-16" />
                </motion.div>
                <h1 className="mt-4 text-[1.6rem] font-extrabold leading-tight text-white sm:text-3xl">
                  لای حەمە هۆمز
                </h1>
                <p className="mt-1 text-sm font-medium text-gold">
                  عند حمة للعقارات · Lay Hama Homes
                </p>

                {/* Two dots, so the screen says how much is left. */}
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  {(["locale", "theme"] as const).map((s) => (
                    <span
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step === s ? "w-5 bg-gold" : "w-1.5 bg-white/25"
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {step === "locale" ? (
                    <motion.div
                      key="step-locale"
                      initial={{ opacity: 0, x: 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-white/55 sm:max-w-none sm:text-sm">
                        زمانەکەت هەڵبژێرە · اختر لغتك · Choose your language
                      </p>

                      <div className="mt-7 grid gap-2.5 sm:gap-3">
                        {OPTIONS.map((o, i) => {
                          const isPicked = picked === o.locale;
                          return (
                            <motion.button
                              key={o.locale}
                              type="button"
                              dir={o.dir}
                              onClick={() => chooseLocale(o.locale)}
                              initial={{ opacity: 0, y: 18 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.28 + i * 0.09,
                                duration: 0.4,
                              }}
                              whileHover={{ y: -3 }}
                              whileTap={{ scale: 0.97 }}
                              className={`group relative flex items-center justify-between overflow-hidden rounded-2xl border px-5 py-4 transition-colors ${
                                isPicked
                                  ? "border-gold bg-gold/15"
                                  : "border-white/12 bg-white/[0.06] hover:border-gold/70 hover:bg-white/[0.1]"
                              }`}
                            >
                              <span className="text-lg font-extrabold text-white sm:text-xl">
                                {o.native}
                              </span>
                              <span className="flex items-center gap-2.5">
                                <span className="text-sm font-medium text-gold">
                                  {o.greeting}
                                </span>
                                <AnimatePresence>
                                  {isPicked && (
                                    <motion.span
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      className="grid size-6 place-items-center rounded-full bg-gold text-black"
                                    >
                                      <Check className="size-4" />
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </span>
                              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                            </motion.button>
                          );
                        })}
                      </div>

                      <p className="mx-auto mt-6 max-w-xs text-[0.7rem] leading-relaxed text-white/35 sm:text-xs">
                        دواتر دەتوانیت لە سەرەوەی سایتەکە زمان بگۆڕیت
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step-theme"
                      dir={dir}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-white/55 sm:max-w-none sm:text-sm">
                        {copy.prompt}
                      </p>

                      <div className="mt-7 grid grid-cols-2 gap-3">
                        {(
                          [
                            { key: "dark", label: copy.dark, Icon: Moon },
                            { key: "light", label: copy.light, Icon: Sun },
                          ] as const
                        ).map((o, i) => {
                          const isPicked = pickedTheme === o.key;
                          return (
                            <motion.button
                              key={o.key}
                              type="button"
                              onClick={() => chooseTheme(o.key)}
                              initial={{ opacity: 0, y: 18 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.15 + i * 0.09,
                                duration: 0.4,
                              }}
                              whileHover={{ y: -3 }}
                              whileTap={{ scale: 0.97 }}
                              className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-3 transition-colors ${
                                isPicked
                                  ? "border-gold bg-gold/15"
                                  : "border-white/12 bg-white/[0.06] hover:border-gold/70 hover:bg-white/[0.1]"
                              }`}
                            >
                              <ThemePreview dark={o.key === "dark"} />
                              <span className="flex items-center justify-center gap-1.5">
                                <o.Icon className="size-4 shrink-0 text-gold" />
                                <span className="text-sm font-bold text-white">
                                  {o.label}
                                </span>
                                <AnimatePresence>
                                  {isPicked && (
                                    <motion.span
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      className="grid size-5 shrink-0 place-items-center rounded-full bg-gold text-black"
                                    >
                                      <Check className="size-3" />
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <p className="mx-auto mt-6 max-w-xs text-[0.7rem] leading-relaxed text-white/35 sm:text-xs">
                        {copy.note}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

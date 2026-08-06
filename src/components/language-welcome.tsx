"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
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

const ORBS = [
  { cls: "size-72 -top-10 -start-10", dur: 11, delay: 0 },
  { cls: "size-56 bottom-0 end-0", dur: 13, delay: 2 },
  { cls: "size-40 top-1/3 end-1/4", dur: 9, delay: 1 },
];

/**
 * Asked once, on a visitor's first arrival: which language should the site be
 * in? The choice is saved, so it never appears again.
 */
export function LanguageWelcome() {
  const { setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Locale | null>(null);

  // First visit = nothing saved yet. Decided on the client, so the server
  // renders nothing and there is no hydration mismatch.
  useEffect(() => {
    try {
      if (!localStorage.getItem("aqarat.locale")) setOpen(true);
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

  function choose(l: Locale) {
    setPicked(l);
    setLocale(l);
    // let the tick land before the screen goes
    setTimeout(() => setOpen(false), 460);
  }

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
          aria-label="Choose your language"
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
                  نووسینگەی ئۆنڵاین
                </h1>
                <p className="mt-1 text-sm font-medium text-gold">
                  المكتب الإلكتروني · Online Office
                </p>
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
                        onClick={() => choose(o.locale)}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28 + i * 0.09, duration: 0.4 }}
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
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

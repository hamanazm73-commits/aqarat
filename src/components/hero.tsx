"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { Sparkles, MapPin, Building, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cityNames, purposeNames } from "@/lib/i18n/dictionaries";
import { districts, searchLabels } from "@/lib/districts";
import type { CityKey } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { KurdistanMapMark } from "./kurdistan-map-mark";
import { HeroStat } from "./hero-stat";

const CHOOSE = "__choose__";
const ALL = "__all__";

/**
 * Entrance order: badge, headline, rule, subtitle, map, search, figures.
 *
 * Everything used to arrive at once on a single CSS animation, which reads as
 * a page finishing loading. Staggering it reads as a page introducing itself —
 * and it puts the eye where it should land first.
 */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero({
  counts,
  cities,
}: {
  counts: { listings: number; cities: number };
  cities: CityKey[];
}) {
  const { t, locale, tr } = useI18n();
  const router = useRouter();
  const L = searchLabels[locale];

  const [purpose, setPurpose] = useState<"all" | "sale" | "rent">("all");
  const [city, setCity] = useState<string>("all");
  const [district, setDistrict] = useState<string>(CHOOSE);

  // Parallax: the backdrop and the glows lag behind the copy as you scroll.
  // Held flat for anyone who asked for less motion.
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : -70]);
  const glowY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : -120]);

  function onCity(value: string) {
    setCity(value);
    setDistrict(CHOOSE);
  }

  function onDistrict(value: string) {
    setDistrict(value);
    if (value === CHOOSE) return;
    const p = new URLSearchParams();
    if (purpose !== "all") p.set("purpose", purpose);
    if (city !== "all") p.set("city", city);
    if (value !== ALL) p.set("q", value);
    router.push(`/properties?${p.toString()}`);
  }

  return (
    <section className="relative overflow-hidden">
      {/* The backdrop drifts slower than the page. Nothing here is a
          photograph, so depth has to come from the layers moving against each
          other rather than from the picture. */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#08182b] via-[#0f2a44] to-background" />
        {/* a vignette, so the middle of the screen is the brightest thing */}
        <div className="absolute inset-0 [background:radial-gradient(ellipse_110%_70%_at_50%_15%,transparent_40%,rgba(0,0,0,0.45)_100%)]" />
      </motion.div>

      {/* drifting gold light */}
      <motion.div
        aria-hidden
        style={{ y: glowY }}
        className="aurora-blob pointer-events-none absolute -top-24 end-0 -z-10 size-80 max-w-full rounded-full bg-gold/25"
      />
      <motion.div
        aria-hidden
        style={{ y: glowY }}
        className="aurora-blob pointer-events-none absolute -bottom-32 start-0 -z-10 size-72 max-w-full rounded-full bg-gold/15 [animation-delay:-6s]"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 pb-28 text-center sm:px-6 sm:pt-28">
        <motion.span
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-gold/30 backdrop-blur"
        >
          <Sparkles className="size-4 text-gold" />
          {t.hero.badge}
        </motion.span>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="mt-5 text-4xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl"
        >
          {t.hero.title}
        </motion.h1>

        {/* the gold hairline that marks every masthead across both sites —
            drawn out from the centre rather than simply appearing */}
        <motion.span
          aria-hidden
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 block h-px w-24 origin-center bg-gradient-to-r from-transparent via-gold to-transparent"
        />

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-5 max-w-xl text-lg leading-relaxed text-white/85"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* Kurdistan, with the flag pin planted on Erbil. In flow rather than
            behind the copy: as a watermark it landed on the search bar at
            phone widths, and at full strength it's the thing worth looking at
            anyway. The site's own artwork, not a stock photo. */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className="w-full"
        >
          <KurdistanMapMark className="mt-7 h-[230px] w-full sm:h-[290px]" />
        </motion.div>

        {/* City / district filter — no button; picking a district searches */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={5}
          className="mt-7 grid w-full gap-3 rounded-2xl bg-background/95 p-4 shadow-2xl ring-1 ring-gold/25 backdrop-blur sm:grid-cols-3"
        >
          {/* Purpose */}
          <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 transition-colors focus-within:border-gold">
            <Home className="size-5 shrink-0 text-muted-foreground" />
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as typeof purpose)}
              className="h-11 w-full cursor-pointer bg-transparent text-sm outline-none"
            >
              <option value="all">{t.filters.any}</option>
              <option value="sale">{tr(purposeNames.sale)}</option>
              <option value="rent">{tr(purposeNames.rent)}</option>
            </select>
          </label>

          {/* City */}
          <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 transition-colors focus-within:border-gold">
            <Building className="size-5 shrink-0 text-muted-foreground" />
            <select
              value={city}
              onChange={(e) => onCity(e.target.value)}
              className="h-11 w-full cursor-pointer bg-transparent text-sm outline-none"
            >
              <option value="all">{L.chooseCity}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {tr(cityNames[c])}
                </option>
              ))}
            </select>
          </label>

          {/* District (fills when a city is chosen) */}
          <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 transition-colors focus-within:border-gold">
            <MapPin className="size-5 shrink-0 text-muted-foreground" />
            <select
              value={district}
              onChange={(e) => onDistrict(e.target.value)}
              disabled={city === "all"}
              className="h-11 w-full cursor-pointer bg-transparent text-sm outline-none disabled:opacity-60"
            >
              {city === "all" ? (
                <option value={CHOOSE}>{L.chooseCity}</option>
              ) : (
                <>
                  <option value={CHOOSE} disabled>
                    {L.chooseDistrict}
                  </option>
                  <option value={ALL}>{L.allDistricts}</option>
                  {districts[city as CityKey].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
        </motion.div>

        {/* Stats — counted up on arrival rather than printed */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={6}
          className="mt-10 flex flex-wrap justify-center gap-10 text-white"
        >
          <HeroStat
            value={counts.listings}
            label={t.hero.stats.listings}
            format={(n) => `${formatNumber(n, locale)}+`}
          />
          <HeroStat
            value={counts.cities}
            label={t.hero.stats.cities}
            format={(n) => formatNumber(n, locale)}
          />
        </motion.div>
      </div>

      {/* the hero dissolves into the page instead of stopping at a hard edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent"
      />
    </section>
  );
}

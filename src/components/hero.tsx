"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { MapPin, Building, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cityNames, purposeNames } from "@/lib/i18n/dictionaries";
import { districts, searchLabels } from "@/lib/districts";
import type { CityKey } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { HeroStat } from "./hero-stat";

/** A mountain valley — the country the listings sit in, rather than one
    particular house. It reads as Kurdistan, it holds the navy wash the brand
    puts over it, and the open sky leaves the search legible on top. The
    sister hotels site opens on landscape for the same reason. */
const HERO = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b";

const CHOOSE = "__choose__";
const ALL = "__all__";

/**
 * Entrance order: badge, headline, rule, subtitle, search, cities, figures.
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

  // 3D tilt, as on the hotel site: the photograph leans toward the pointer and
  // shifts a little with it, so the scene has depth rather than being a flat
  // picture behind text. Springs rather than raw values, or it snaps.
  // Mouse only — on a touch screen there is no pointer to lean toward, and the
  // scroll parallax already carries it.
  const px = useMotionValue(0); // -0.5 … 0.5 from the centre
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 18 });
  const sy = useSpring(py, { stiffness: 120, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const tiltX = useTransform(sx, [-0.5, 0.5], [28, -28]);
  const tiltY = useTransform(sy, [-0.5, 0.5], [28, -28]);

  function onPointer(e: React.MouseEvent<HTMLElement>) {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function resetPointer() {
    px.set(0);
    py.set(0);
  }

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
    <section
      onMouseMove={onPointer}
      onMouseLeave={resetPointer}
      className="relative overflow-hidden"
    >
      {/* A lit house at dusk, drifting slower than the page. An <img> with a
          srcSet rather than a CSS background, so a phone fetches a phone-sized
          file. Perspective sits on the parent so the inner rotation reads as
          real depth; the scale keeps the tilt from ever exposing an edge. */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 -z-20 [perspective:1200px]"
      >
        <motion.div
          style={{ rotateX, rotateY, x: tiltX, y: tiltY, scale: 1.18 }}
          className="size-full origin-center will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${HERO}?w=1600&q=80`}
            srcSet={`${HERO}?w=768&q=72 768w, ${HERO}?w=1280&q=78 1280w, ${HERO}?w=1920&q=80 1920w`}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="size-full object-cover"
          />
        </motion.div>
        {/* Navy over the photograph rather than beside it — the brand colour
            has to survive whatever the picture is doing.

            Reaching past the frame on purpose. The photograph sits in a
            wrapper scaled to 1.18, so it spills about 9% beyond this box on
            every side, and the parallax then slides the whole layer up to 70px
            — which left the spilled part uncovered and showed a bright,
            unveiled band of the photograph along the bottom edge. The veil has
            to be larger than the thing it is veiling. */}
        <div className="absolute -inset-[14%] bg-gradient-to-b from-[#08182b]/90 via-[#0f2a44]/78 to-background" />
        {/* a vignette, so the middle of the screen is the brightest thing */}
        <div className="absolute -inset-[14%] [background:radial-gradient(ellipse_110%_70%_at_50%_15%,transparent_40%,rgba(0,0,0,0.45)_100%)]" />
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
          // No icon, so the words sit centred in the pill instead of being
          // pushed off to one side by a mark beside them.
          className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-gold/30 backdrop-blur"
        >
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

        {/* City / district filter — no button; picking a district searches.
            This is the hero now. On a property site the search is the product,
            so it gets the room an illustration used to take. */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className={`mt-10 grid w-full gap-3 rounded-2xl bg-background/95 p-4 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] ring-1 ring-gold/30 backdrop-blur sm:mt-12 sm:gap-4 sm:p-5 ${
            city === "all" ? "sm:grid-cols-2" : "sm:grid-cols-3"
          }`}
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

          {/* District — only once a city is chosen. Showing it beforehand was
              a dead control asking to be tapped: it can only offer the
              districts of a city nobody has picked yet. */}
          <AnimatePresence initial={false}>
            {city !== "all" && (
              <motion.label
                key="district"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 transition-colors focus-within:border-gold"
              >
                <MapPin className="size-5 shrink-0 text-muted-foreground" />
                <select
                  value={district}
                  onChange={(e) => onDistrict(e.target.value)}
                  className="h-11 w-full cursor-pointer bg-transparent text-sm outline-none"
                >
                  <option value={CHOOSE} disabled>
                    {L.chooseDistrict}
                  </option>
                  <option value={ALL}>{L.allDistricts}</option>
                  {(districts[city as CityKey] ?? []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </motion.label>
            )}
          </AnimatePresence>
        </motion.div>

        {/* One tap straight into a city. The selects are precise but they cost
            three interactions; most people want the nearest big city, and this
            is that in one. Real destinations, not filler under the search. */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={5}
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-sm text-white/55">{L.chooseCity}</span>
          {cities.slice(0, 5).map((c) => (
            <Link
              key={c}
              href={`/properties?city=${c}`}
              className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/90 ring-1 ring-white/15 backdrop-blur transition hover:bg-gold hover:text-gold-foreground hover:ring-gold"
            >
              {tr(cityNames[c])}
            </Link>
          ))}
        </motion.div>

        {/* Stats — counted up on arrival rather than printed */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={6}
          className="mt-12 flex flex-wrap justify-center gap-10 text-white"
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

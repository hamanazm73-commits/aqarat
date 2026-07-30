"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, MapPin, Building, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cityNames, purposeNames } from "@/lib/i18n/dictionaries";
import { districts, searchLabels } from "@/lib/districts";
import type { CityKey } from "@/lib/types";
import { formatNumber } from "@/lib/format";

const CHOOSE = "__choose__";
const ALL = "__all__";

/** Hero photograph — apartment balconies lit at blue hour. */
const HERO = "https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb";

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
      {/* Apartment balconies at blue hour: the sky is already this site's navy
          and the lit balconies its gold, so the photograph carries the palette
          instead of fighting it. An <img> with a srcSet rather than a CSS
          background, so phones fetch a small file and it can be the LCP. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${HERO}?w=1600&q=80`}
        srcSet={`${HERO}?w=768&q=72 768w, ${HERO}?w=1280&q=78 1280w, ${HERO}?w=1920&q=80 1920w`}
        sizes="100vw"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      {/* deep navy over it — the hero reads as navy first and photograph
          second, which is what keeps the headline the loudest thing here */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#0d2237]/90 via-[#12293f]/80 to-background" />

      {/* drifting gold light */}
      <div
        aria-hidden
        className="aurora-blob pointer-events-none absolute -top-24 end-0 -z-10 size-80 max-w-full rounded-full bg-gold/25"
      />
      <div
        aria-hidden
        className="aurora-blob pointer-events-none absolute -bottom-32 start-0 -z-10 size-72 max-w-full rounded-full bg-gold/15 [animation-delay:-6s]"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-20 pb-28 text-center sm:px-6 sm:pt-28">
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-gold/30 backdrop-blur">
          <Sparkles className="size-4 text-gold" />
          {t.hero.badge}
        </span>

        <h1 className="animate-fade-up mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
          {t.hero.title}
        </h1>

        {/* the gold hairline that marks every masthead across both sites */}
        <span
          aria-hidden
          className="mt-6 block h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent"
        />

        <p className="animate-fade-up mt-5 max-w-xl text-lg leading-relaxed text-white/85">
          {t.hero.subtitle}
        </p>

        {/* City / district filter — no button; picking a district searches */}
        <div className="mt-9 grid w-full gap-3 rounded-2xl bg-background/95 p-4 shadow-2xl ring-1 ring-gold/25 backdrop-blur sm:grid-cols-3">
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
        </div>

        {/* Stats */}
        <div className="mt-8 flex flex-wrap justify-center gap-10 text-white">
          <Stat
            value={`${formatNumber(counts.listings, locale)}+`}
            label={t.hero.stats.listings}
          />
          <Stat
            value={`${formatNumber(counts.cities, locale)}`}
            label={t.hero.stats.cities}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-extrabold text-gold sm:text-4xl">{value}</p>
      <p className="mt-0.5 text-sm text-white/70">{label}</p>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CityKey, Locale, Property, PropertyFilters } from "@/lib/types";
import { filterProperties } from "@/lib/data";
import { useI18n } from "@/lib/i18n/context";
import {
  cityNames,
  purposeNames,
  typeNames,
} from "@/lib/i18n/dictionaries";
import { PROPERTY_TYPE_KEYS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { PropertyCard } from "./property-card";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const SORTS = ["newest", "price_asc", "price_desc", "area_desc"] as const;

/*
 * The rungs on the price filter, in dinars — two ladders, because buying and
 * renting are not the same numbers.
 *
 * A house sells for a hundred million and rents for six hundred thousand a
 * month. One ladder cannot serve both: rungs fine enough to be useful for rent
 * would run to hundreds of options before reaching a house price, and a ladder
 * starting at a million puts every rental below its first rung.
 *
 * Either way the steps widen as the numbers do — close together at the bottom
 * where most of the listings are, further apart at the top where five million
 * either way stops mattering.
 */
const SALE_STEPS = [
  1, 5, 10, 20, 30, 40, 50, 75,
  100, 125, 150, 200, 250, 300, 400, 500, 750, 1000,
].map((m) => m * 1_000_000);

const RENT_STEPS = [
  50, 100, 150, 200, 250, 300, 400, 500, 750,
  1000, 1500, 2000, 3000, 5000, 7500, 10000,
].map((k) => k * 1_000);

/*
 * The top of the sale ladder, as a maximum only.
 *
 * "Up to a billion" leaves out the house above it, and a buyer looking at that
 * end of the market wants no ceiling at all rather than a higher one. As a
 * minimum it would be meaningless — the billion rung already means a billion
 * and up — so it is only ever offered on the right-hand box.
 */
const NO_CEILING = 1_000_000_000_000;

/** "١٥٠ ملیۆن د.ع" rather than 150000000, which nobody reads at a glance. */
function priceLabel(v: number, locale: Locale): string {
  if (v === NO_CEILING) return OVER_A_BILLION[locale];
  const [n, unit] =
    v >= 1_000_000_000
      ? [v / 1_000_000_000, BILLION[locale]]
      : v >= 1_000_000
        ? [v / 1_000_000, MILLION[locale]]
        : [v / 1_000, THOUSAND[locale]];
  return `${formatNumber(n, locale)} ${unit} ${CURRENCY[locale]}`;
}

const THOUSAND: Record<Locale, string> = { ku: "هەزار", ar: "ألف", en: "thousand" };
const MILLION: Record<Locale, string> = { ku: "ملیۆن", ar: "مليون", en: "million" };
const BILLION: Record<Locale, string> = { ku: "ملیار", ar: "مليار", en: "billion" };
const CURRENCY: Record<Locale, string> = { ku: "د.ع", ar: "د.ع", en: "IQD" };
const OVER_A_BILLION: Record<Locale, string> = {
  ku: "زیاتر لە ١ ملیار د.ع",
  ar: "أكثر من مليار د.ع",
  en: "over 1 billion IQD",
};

export function PropertyExplorer({
  all,
  initial,
  cities,
}: {
  all: Property[];
  initial: PropertyFilters;
  cities: CityKey[];
}) {
  const { t, locale, tr } = useI18n();
  const [f, setF] = useState<PropertyFilters>({ sort: "newest", ...initial });
  const [openMobile, setOpenMobile] = useState(false);

  const results = useMemo(() => filterProperties(all, f), [all, f]);

  function set<K extends keyof PropertyFilters>(k: K, v: PropertyFilters[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  /*
   * Switching between buying and renting clears the price with it.
   *
   * The two ladders share no rungs. A minimum of a hundred million left over
   * from buying, carried into renting, is a filter that matches nothing and
   * shows a value the rent ladder cannot even display.
   */
  function setPurpose(v: PropertyFilters["purpose"]) {
    setF((prev) => ({ ...prev, purpose: v, minPrice: undefined, maxPrice: undefined }));
  }

  const steps = f.purpose === "rent" ? RENT_STEPS : SALE_STEPS;
  function reset() {
    setF({ sort: "newest" });
  }

  const filterBody = (
    <div className="space-y-5">
      {/* Purpose */}
      <Field label={t.filters.purpose}>
        <div className="grid grid-cols-3 gap-2">
          <Chip active={!f.purpose || f.purpose === "all"} onClick={() => setPurpose("all")}>
            {t.filters.any}
          </Chip>
          <Chip active={f.purpose === "sale"} onClick={() => setPurpose("sale")}>
            {tr(purposeNames.sale)}
          </Chip>
          <Chip active={f.purpose === "rent"} onClick={() => setPurpose("rent")}>
            {tr(purposeNames.rent)}
          </Chip>
        </div>
      </Field>

      {/* Type */}
      <Field label={t.filters.type}>
        <select
          value={f.type ?? "all"}
          onChange={(e) => set("type", e.target.value as PropertyFilters["type"])}
          className="input"
        >
          <option value="all">{t.filters.any}</option>
          {PROPERTY_TYPE_KEYS.map((tk) => (
            <option key={tk} value={tk}>{tr(typeNames[tk])}</option>
          ))}
        </select>
      </Field>

      {/* City */}
      <Field label={t.filters.city}>
        <select
          value={f.city ?? "all"}
          onChange={(e) => set("city", e.target.value as PropertyFilters["city"])}
          className="input"
        >
          <option value="all">{t.filters.any}</option>
          {cities.map((c) => (
            <option key={c} value={c}>{tr(cityNames[c])}</option>
          ))}
        </select>
      </Field>

      {/*
        Price is chosen, not typed.

        Two empty number boxes asked a buyer to know the market before they
        could use them, on a phone keypad, and every stray digit was a filter
        that quietly matched nothing — one zero too many on a house priced in
        the hundreds of millions is easy to type and impossible to see. The
        rungs are the prices these houses actually go for.
      */}
      <Field label={t.filters.priceRange}>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={f.minPrice ?? ""}
            onChange={(e) => set("minPrice", e.target.value ? Number(e.target.value) : undefined)}
            className="input"
          >
            <option value="">{t.filters.minPrice}</option>
            {steps.map((v) => (
              <option key={v} value={v}>{priceLabel(v, locale)}</option>
            ))}
          </select>
          <select
            value={f.maxPrice ?? ""}
            onChange={(e) => set("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
            className="input"
          >
            <option value="">{t.filters.maxPrice}</option>
            {/* Anything below the minimum already chosen would select
                nothing, so it is not offered. */}
            {[...steps, ...(f.purpose === "rent" ? [] : [NO_CEILING])]
              .filter((v) => !f.minPrice || v > f.minPrice)
              .map((v) => (
                <option key={v} value={v}>{priceLabel(v, locale)}</option>
              ))}
          </select>
        </div>
      </Field>

      {/* Bedrooms */}
      <Field label={t.filters.bedrooms}>
        <div className="grid grid-cols-5 gap-2">
          <Chip active={!f.bedrooms} onClick={() => set("bedrooms", undefined)}>
            {t.filters.any}
          </Chip>
          {[1, 2, 3, 4].map((n) => (
            <Chip key={n} active={f.bedrooms === n} onClick={() => set("bedrooms", n)}>
              {formatNumber(n, locale)}+
            </Chip>
          ))}
        </div>
      </Field>

      <Button variant="outline" className="w-full" onClick={reset}>
        {t.filters.reset}
      </Button>
    </div>
  );

  return (
    <>
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{t.nav.properties}</h1>
    </div>
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> {t.filters.title}
          </h2>
          {filterBody}
        </div>
      </aside>

      <div>
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatNumber(results.length, locale)}
            </span>{" "}
            {t.filters.results}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={f.sort ?? "newest"}
              onChange={(e) => set("sort", e.target.value as PropertyFilters["sort"])}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none"
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>{t.sort[s]}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setOpenMobile(true)}
            >
              <SlidersHorizontal className="h-4 w-4" /> {t.filters.title}
            </Button>
          </div>
        </div>

        {/* Grid */}
        {results.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
            {t.filters.noResults}
          </div>
        )}
      </div>

      {/* Mobile filter sheet */}
      {openMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenMobile(false)} />
          <div className="absolute inset-y-0 end-0 w-[85%] max-w-sm overflow-y-auto bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{t.filters.title}</h2>
              <button onClick={() => setOpenMobile(false)} className="cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterBody}
            <Button className="mt-4 w-full" onClick={() => setOpenMobile(false)}>
              {t.filters.apply}
            </Button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2 py-2 text-xs font-medium transition-colors cursor-pointer",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

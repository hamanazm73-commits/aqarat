"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CityKey, Property, PropertyFilters } from "@/lib/types";
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
  function reset() {
    setF({ sort: "newest" });
  }

  const filterBody = (
    <div className="space-y-5">
      {/* Purpose */}
      <Field label={t.filters.purpose}>
        <div className="grid grid-cols-3 gap-2">
          <Chip active={!f.purpose || f.purpose === "all"} onClick={() => set("purpose", "all")}>
            {t.filters.any}
          </Chip>
          <Chip active={f.purpose === "sale"} onClick={() => set("purpose", "sale")}>
            {tr(purposeNames.sale)}
          </Chip>
          <Chip active={f.purpose === "rent"} onClick={() => set("purpose", "rent")}>
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

      {/* Price */}
      <Field label={t.filters.priceRange}>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={t.filters.minPrice}
            value={f.minPrice ?? ""}
            onChange={(e) => set("minPrice", e.target.value ? Number(e.target.value) : undefined)}
            className="input"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder={t.filters.maxPrice}
            value={f.maxPrice ?? ""}
            onChange={(e) => set("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
            className="input"
          />
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

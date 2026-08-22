"use client";

import Link from "next/link";
import { ArrowDown, Building, Home, Landmark, Store, Trees, Warehouse } from "lucide-react";
import type { CityKey, Property, PropertyType } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import { typeNames } from "@/lib/i18n/dictionaries";
import { Hero } from "./hero";
import { PropertyCard } from "./property-card";

const TYPE_ICONS: Record<PropertyType, React.ComponentType<{ className?: string }>> = {
  house: Home,
  apartment: Building,
  villa: Warehouse,
  land: Trees,
  shop: Store,
  office: Landmark,
};

export function HomeContent({
  properties,
  counts,
  cities,
}: {
  properties: Property[];
  counts: { listings: number; cities: number };
  cities: CityKey[];
}) {
  const { t, tr } = useI18n();
  // Show every listing on the home page, featured ones first.
  const sorted = [...properties].sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured),
  );

  return (
    <>
      <Hero counts={counts} cities={cities} />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {(Object.keys(TYPE_ICONS) as PropertyType[]).map((type) => {
            const Icon = TYPE_ICONS[type];
            return (
              <Link
                key={type}
                href={`/properties?type=${type}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-gold/20 transition-colors group-hover:bg-gold group-hover:text-gold-foreground">
                  <Icon className="size-6" />
                </span>
                <span className="text-sm font-medium">{tr(typeNames[type])}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* All properties */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t.nav.properties}</h2>
            <span
              aria-hidden
              className="mt-3 block h-px w-16 bg-gradient-to-r from-gold to-transparent"
            />
          </div>
          {/*
            A button, not a line of blue text.

            It said "فلتەرکردن" on something that opens a list, sat as bare
            underlined text with nothing around it, and was hidden below the
            small breakpoint — so on a phone the grid simply stopped and the
            page went quiet with no way on. It reads as a control now, at the
            weight the rest of the page is drawn at, and it is there at every
            width. The arrow follows the script rather than always pointing
            left, and slides on hover the way it is being asked to move.
          */}
          <Link
            href="/properties"
            className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-gold/30 bg-gold/8 px-5 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
          >
            {t.filters.title}
            {/* Down, not along. Whichever way the script runs, more of the
                page is below — and it nudges downward on hover for the same
                reason. */}
            <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
          </Link>
        </div>

        {sorted.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            {t.filters.noResults}
          </p>
        )}
      </section>

    </>
  );
}


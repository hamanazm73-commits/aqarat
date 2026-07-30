"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Building, Headphones, Home, Landmark, ShieldCheck, Store, Trees, Warehouse } from "lucide-react";
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
  const { t, tr, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
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
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-medium">{tr(typeNames[type])}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* All properties */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.nav.properties}</h2>
          <Link
            href="/properties"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            {t.filters.title} <Arrow className="h-4 w-4" />
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

      {/* Why us / trust */}
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-muted/40 p-8 sm:p-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t.about.title}</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              {t.about.subtitle}
            </p>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <Feature icon={ShieldCheck} title={t.about.trustTitle} text={t.about.trustText} />
            <Feature icon={Building} title={t.about.selectTitle} text={t.about.selectText} />
            <Feature icon={Headphones} title={t.about.supportTitle} text={t.about.supportText} />
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

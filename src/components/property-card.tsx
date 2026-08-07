"use client";

import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Maximize, MapPin, Star, Eye } from "lucide-react";
import type { Property } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import { cityNames, typeNames } from "@/lib/i18n/dictionaries";
import { formatIQDCompact, formatNumber, discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const WA_NUMBER = "9647502202191";
const SITE_URL = "https://homeskurdistan.com";

export function PropertyCard({ p }: { p: Property }) {
  const { locale, t, tr } = useI18n();

  const pct = p.discount?.active
    ? discountPercent(p.discount.oldPriceIQD, p.priceIQD)
    : 0;

  // Pre-filled WhatsApp message so the owner knows exactly which property.
  const waText = `${t.card.whatsappMsg}\n${tr(p.title)} — ${formatIQDCompact(
    p.priceIQD,
    locale,
  )}\n${SITE_URL}/properties/${p.id}`;
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.99]",
        // a featured listing wears the gold ring outright; the rest earn it on hover
        p.featured
          ? "ring-2 ring-gold/50"
          : "ring-1 ring-foreground/10 hover:ring-gold/40",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* blurred fill so photos of any shape sit on something, never on a
            bare grey box */}
        <Image
          src={p.images[0]}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="scale-110 object-cover opacity-55 blur-xl"
        />
        <Image
          src={p.images[0]}
          alt={tr(p.title)}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

        {/* purpose + discount, top-start */}
        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold shadow-lg",
              p.purpose === "sale"
                ? "bg-primary text-primary-foreground"
                : "bg-gold text-gold-foreground",
            )}
          >
            {p.purpose === "sale" ? t.card.forSale : t.card.forRent}
          </span>
          {pct > 0 && (
            <span className="rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              −{formatNumber(pct, locale)}%
            </span>
          )}
        </div>

        {/* featured star, top-end — the glass pill the sister site uses */}
        {p.featured && (
          <span className="absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md">
            <Star className="gold-glow size-3.5 fill-gold text-gold" />
            {t.card.featured}
          </span>
        )}

        {/* type, bottom-end */}
        <span className="absolute bottom-3 end-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white shadow-lg ring-1 ring-white/15 backdrop-blur-md">
          {tr(typeNames[p.type])}
        </span>

        {/* per-property WhatsApp, bottom-start */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 start-3 z-20 flex size-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:bg-[#1ebe5d] active:scale-90"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-primary">
          {tr(p.title)}
        </h3>

        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {tr(cityNames[p.city])}
          {p.district && <span>· {tr(p.district)}</span>}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {typeof p.bedrooms === "number" && (
            <span className="flex items-center gap-1">
              <BedDouble className="size-4" /> {formatNumber(p.bedrooms, locale)}
            </span>
          )}
          {typeof p.bathrooms === "number" && (
            <span className="flex items-center gap-1">
              <Bath className="size-4" /> {formatNumber(p.bathrooms, locale)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Maximize className="size-4" /> {formatNumber(p.area, locale)}{" "}
            {t.card.area}
          </span>
          {/* Only once it has been looked at: "0 views" on a listing published
              an hour ago tells a buyer nothing and the seller something worse.
              Carried in a gold pill with the word spelled out, the way the
              sister site shows it — a bare number beside the bed and bath
              counts just reads as another measurement. */}
          {!!p.views && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-sm font-bold text-amber-700 sm:text-xs dark:text-amber-300"
              title={t.card.views}
            >
              <Eye className="size-4 sm:size-3.5" />
              {formatNumber(p.views, locale)} {t.card.views}
            </span>
          )}
        </div>

        {/* price last — gold, the way the sister site prices a room */}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          {pct > 0 && p.discount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatIQDCompact(p.discount.oldPriceIQD, locale)}
            </span>
          )}
          <span className="text-2xl font-extrabold text-gold">
            {formatIQDCompact(p.priceIQD, locale)}
          </span>
          {p.purpose === "rent" && (
            <span className="text-xs text-muted-foreground">
              {t.card.perMonth}
            </span>
          )}
        </div>
      </div>

      {/* Whole-card link (stretched, sits below the WhatsApp button) */}
      <Link
        href={`/properties/${p.id}`}
        aria-label={tr(p.title)}
        className="absolute inset-0 z-10"
      />
    </div>
  );
}

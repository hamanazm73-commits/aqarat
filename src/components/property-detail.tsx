"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Phone,
  MessageCircle,
  Check,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Layers,
  CookingPot,
} from "lucide-react";
import type { Property } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import {
  amenityNames,
  cityNames,
  purposeNames,
  typeNames,
} from "@/lib/i18n/dictionaries";
import {
  formatIQD,
  formatNumber,
  formatDate,
  discountPercent,
} from "@/lib/format";
import { InquiryForm } from "./inquiry-form";
import { PropertyCard } from "./property-card";
import { Button } from "./ui/button";
import { youtubeEmbed } from "@/lib/video";

export function PropertyDetail({
  p,
  similar,
}: {
  p: Property;
  similar: Property[];
}) {
  const { t, locale, tr } = useI18n();
  const [active, setActive] = useState(0);

  const pct = p.discount?.active
    ? discountPercent(p.discount.oldPriceIQD, p.priceIQD)
    : 0;

  const specs = [
    typeof p.bedrooms === "number" && {
      icon: BedDouble,
      label: t.card.beds,
      value: formatNumber(p.bedrooms, locale),
    },
    typeof p.bathrooms === "number" && {
      icon: Bath,
      label: t.card.baths,
      value: formatNumber(p.bathrooms, locale),
    },
    typeof p.floors === "number" && {
      icon: Layers,
      label: t.card.floors,
      value: formatNumber(p.floors, locale),
    },
    typeof p.kitchens === "number" && {
      icon: CookingPot,
      label: t.card.kitchens,
      value: formatNumber(p.kitchens, locale),
    },
    {
      icon: Maximize,
      label: t.card.area,
      value: `${formatNumber(p.area, locale)} ${t.card.area}`,
    },
    { icon: Tag, label: t.detail.type, value: tr(typeNames[p.type]) },
  ].filter(Boolean) as { icon: typeof BedDouble; label: string; value: string }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{t.nav.home}</Link>
        <span>/</span>
        <Link href="/properties" className="hover:text-foreground">{t.nav.properties}</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{tr(p.title)}</span>
      </nav>

      {/* Gallery */}
      <div className="grid gap-3 lg:grid-cols-[1fr_120px]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={p.images[active]}
            alt={tr(p.title)}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 70vw"
            className="object-cover"
          />
          <span
            className={
              "absolute start-4 top-4 rounded-full px-3 py-1 text-sm font-bold shadow-lg " +
              (p.purpose === "sale"
                ? "bg-primary text-primary-foreground"
                : "bg-gold text-gold-foreground")
            }
          >
            {p.purpose === "sale" ? t.card.forSale : t.card.forRent}
          </span>
          {p.images.length > 1 && (
            <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
              <button
                onClick={() => setActive((a) => (a - 1 + p.images.length) % p.images.length)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActive((a) => (a + 1) % p.images.length)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="flex gap-3 overflow-x-auto lg:flex-col">
          {p.images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 lg:w-full cursor-pointer ${
                i === active ? "border-primary" : "border-transparent opacity-70"
              }`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{tr(p.title)}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {tr(cityNames[p.city])}
                {p.district && <span>· {tr(p.district)}</span>}
              </p>
            </div>
            <div className="text-end">
              {pct > 0 && p.discount && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatIQD(p.discount.oldPriceIQD, locale)}
                </p>
              )}
              <p className="text-2xl font-extrabold text-gold sm:text-3xl">
                {formatIQD(p.priceIQD, locale)}
                {p.purpose === "rent" && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {t.card.perMonth}
                  </span>
                )}
              </p>
              {pct > 0 && (
                <span className="mt-1 inline-block rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold text-white">
                  -{formatNumber(pct, locale)}% {t.card.off}
                </span>
              )}
            </div>
          </div>

          {/* Specs */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {specs.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 text-center">
                <s.icon className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold">{t.detail.description}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{tr(p.description)}</p>
          </section>

          {/* Videos */}
          {p.videos && p.videos.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t.detail.videos}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {p.videos.map((v, i) => {
                  const embed = youtubeEmbed(v);
                  return (
                    <div
                      key={i}
                      className="aspect-video overflow-hidden rounded-xl border border-border bg-black"
                    >
                      {embed ? (
                        <iframe
                          src={embed}
                          title={`${tr(p.title)} — video ${i + 1}`}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video src={v} controls className="h-full w-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Amenities */}
          {p.amenities.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t.detail.amenities}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {p.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {tr(amenityNames[a])}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Location */}
          {typeof p.lat === "number" && typeof p.lng === "number" && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">{t.detail.location}</h2>
              <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                <iframe
                  title={`${tr(p.title)} — map`}
                  src={`https://maps.google.com/maps?q=${p.lat},${p.lng}&z=14&output=embed`}
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <MapPin className="h-4 w-4" />
                {tr(cityNames[p.city])} — Google Maps
              </a>
            </section>
          )}

          {/* Meta */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {t.detail.posted}: {formatDate(p.createdAt, locale)}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" /> {t.detail.purpose}: {tr(purposeNames[p.purpose])}
            </span>
            <span>{t.detail.reference}: {p.id}</span>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold">{t.detail.contactAgent}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.agent.name}</p>
            <div className="mt-4 grid gap-2">
              <a href={`tel:${p.agent.phone}`}>
                <Button className="w-full">
                  <Phone className="h-4 w-4" /> {t.detail.call}
                </Button>
              </a>
              {p.agent.whatsapp && (
                <a
                  href={`https://wa.me/${p.agent.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4" /> {t.detail.whatsapp}
                  </Button>
                </a>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <InquiryForm propertyId={p.id} />
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">{t.detail.similar}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <PropertyCard key={s.id} p={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

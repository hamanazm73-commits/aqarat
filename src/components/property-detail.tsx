"use client";

import { useEffect, useRef, useState } from "react";
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
  Building2,
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
import { isRawSrc } from "@/lib/utils";
import { PropertyCard } from "./property-card";
import { Button } from "./ui/button";
import { fsCountView } from "@/lib/firebase/db";

/**
 * How wide the main photograph actually is, so the optimizer sends that much.
 *
 * Measured rather than guessed: the gallery runs the full width of the
 * container on every screen — the contact panel sits below it, not beside it —
 * so at a 1280px window the picture is about 1230px. A first guess of 800px
 * here had the browser stretching an 800px file across 1230px of screen.
 *
 * Next never upscales past the stored file, so a small photograph still
 * arrives at its own size; this only stops a large one being sent short.
 */
const HERO_SIZES = "(max-width: 1280px) 100vw, 1280px";

export function PropertyDetail({
  p,
  similar,
}: {
  p: Property;
  similar: Property[];
}) {
  const { t, locale, tr } = useI18n();
  const [active, setActive] = useState(0);

  /*
   * Only clips this site can actually play.
   *
   * Listings made before today may hold a YouTube address in `videos` — the
   * form used to accept one. Handed to a <video> element that is a player that
   * never starts, which is worse on the page than no video at all. Anything
   * that is not a file we host is left out until somebody removes it in the
   * editor.
   */
  const playable = (p.videos ?? []).filter(
    (v) => v.startsWith("/api/img/") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(v),
  );

  /**
   * One view per listing per mount.
   *
   * Guarded by a ref because React runs effects twice in development, and a
   * counter that doubles every time someone opens a house is worse than no
   * counter. Fire-and-forget: nothing on this page waits for it.
   */
  const counted = useRef<string | null>(null);
  useEffect(() => {
    if (counted.current === p.id) return;
    counted.current = p.id;
    void fsCountView(p.id);
  }, [p.id]);

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

      {/*
        Gallery, built the way the hotels site builds its.

        The photograph is contained, not cropped. A seller shoots a house
        portrait, or with the price written across it, and object-cover took a
        16:10 bite out of the middle — on the first listing that went up it cut
        the price off the top of the picture. Whatever shape the photograph is,
        all of it shows.

        A blurred copy of the same image fills the space either side, so a
        portrait photo sits in something that belongs to it rather than in two
        grey bars.

        One large picture, then a row underneath: the exterior is what a buyer
        is deciding on, and the rooms are what they look at next. Down the side
        the thumbnails were competing with it for the same glance.
      */}
      <div>
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted">
          {/*
            The backdrop and the photograph are the same file, deliberately.

            Both were plain elements pointed straight at the stored image, so
            every visitor downloaded the full 92KB whatever they were looking
            at it on. They are `Image` now, with the same src and the same
            `sizes`, so they resolve to one identical URL and the browser
            fetches it once — as it did before, but at the size actually shown.
          */}
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={p.images[active]}
              alt=""
              aria-hidden
              fill
              sizes={HERO_SIZES}
              unoptimized={isRawSrc(p.images[active])}
              className="scale-110 object-cover opacity-45 blur-2xl"
            />
            <Image
              src={p.images[active]}
              alt={tr(p.title)}
              fill
              sizes={HERO_SIZES}
              unoptimized={isRawSrc(p.images[active])}
              // The one picture the page exists for; it should not wait its turn.
              priority
              className="object-contain"
            />
          </div>
          <span
            className={
              "absolute start-4 top-4 z-10 rounded-full px-3 py-1 text-sm font-bold shadow-lg " +
              (p.purpose === "sale"
                ? "bg-primary text-primary-foreground"
                : "bg-gold text-gold-foreground")
            }
          >
            {p.purpose === "sale" ? t.card.forSale : t.card.forRent}
          </span>
          {p.images.length > 1 && (
            /*
              The page is right-to-left, so `justify-between` puts the first
              child on the RIGHT. The icons are ordered for where the buttons
              land, not for the order they are written in — written the obvious
              way round, the left-hand button drew an arrow pointing right.

              Which one goes back also follows the script: content runs right to
              left, so moving rightwards is moving back through it.
            */
            <div className="absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 justify-between">
              {/* lands on the right */}
              <button
                onClick={() => setActive((a) => (a - 1 + p.images.length) % p.images.length)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                aria-label="Previous"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {/* lands on the left */}
              <button
                onClick={() => setActive((a) => (a + 1) % p.images.length)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                aria-label="Next"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {p.images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {p.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                className={`relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-muted transition ${
                  i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {/*
                  These are eighty pixels square and were downloading the whole
                  photograph — 92KB each, so a listing with ten pictures spent
                  most of a megabyte on a strip of thumbnails smaller than a
                  postage stamp. `sizes` tells the optimizer the truth about
                  how big they are.
                */}
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="80px"
                  unoptimized={isRawSrc(src)}
                  className="object-contain"
                />
              </button>
            ))}
          </div>
        )}

        {/*
          The walk-through, directly beneath the photographs.

          It was down past the description under a heading of its own, which
          read as an afterthought — a buyer who had already decided by then
          never scrolled that far. Here it is plainly one more thing to look at
          about the same house, and it is given a shade more height than the
          picture above so it is clearly the moving one.

          Framed rather than left to its own size: phone footage is as often
          held upright as sideways, and a portrait clip at full width would
          stand two thousand pixels tall on a desktop and push the whole
          listing off the screen. The frame is fixed, the video is contained
          inside it, and black fills whatever is left either side.
        */}
        {playable.length > 0 && (
          <div className="mt-3 space-y-3">
            {playable.map((v) => (
              <video
                key={v}
                src={v}
                controls
                playsInline
                preload="metadata"
                className="aspect-[3/2] max-h-[80vh] w-full rounded-2xl border border-border bg-black object-contain"
              />
            ))}
          </div>
        )}
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

          {/*
            What the house has, before what somebody wrote about it.

            The description is prose and gets skimmed; the list is the part a
            buyer is actually checking — parking, a garden, a lift. Underneath
            the paragraph it was being scrolled past.
          */}
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

          {/* Description */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold">{t.detail.description}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{tr(p.description)}</p>
          </section>

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
            {/* "the office of X", not a bare name — a name on its own beneath a
                heading reads as the person you are calling, and it is a firm. */}
            <p className="mt-1.5 flex items-center gap-1.5 text-sm">
              <Building2 className="size-4 shrink-0 text-gold" aria-hidden />
              <span className="text-muted-foreground">{t.detail.officeLabel}</span>
              <span className="font-semibold text-foreground">{p.agent.name}</span>
            </p>
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

          {/* There is no enquiry form here. A buyer who wants this property
              rings the number or opens WhatsApp, both of which are directly
              above — a form asking for a name and a number is a slower version
              of what they already had, and it answers into an inbox rather
              than a phone. The inbox is gone with it. */}
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

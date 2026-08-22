"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { typeNames } from "@/lib/i18n/dictionaries";
import { isRawSrc } from "@/lib/utils";
import type { PropertyType } from "@/lib/types";

/**
 * A listing's photograph, or the drawn stand-in when it has none.
 *
 * The stand-ins live in /public/img — one per kind of property — and used to
 * carry their label inside the drawing: the word "Land" and the brand, set as
 * SVG text. Which meant the label was English on the Kurdish site, English on
 * the Arabic site, and English on the Turkmen one. A picture that says "Land"
 * on a page that says everything else in Kurdish is the one thing on it that
 * did not translate.
 *
 * The artwork is unchanged and the text is gone from it. The label is drawn
 * here instead, as ordinary elements over the picture, so it reads in whatever
 * language the visitor chose — and so a language added later needs nothing
 * doing to nine SVG files.
 *
 * A real photograph goes straight through; none of this applies to it.
 */
export function ListingImage({
  src,
  alt,
  type,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  type: PropertyType;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const { t, tr } = useI18n();
  const placeholder = /^\/img\/[a-z0-9-]+\.svg$/i.test(src);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        // The optimizer answers 400 for SVG, and every stand-in is one.
        unoptimized={isRawSrc(src)}
        priority={priority}
        className={className}
      />
      {placeholder && (
        /*
          `pointer-events-none` because the whole card is a link — a label
          sitting over it must not be what a tap lands on.

          Sized against the picture rather than the page: this same stand-in
          appears in a card a third of a column wide and again as the hero on
          the listing page, and one fixed size is wrong in one of those two.
          The overlay declares itself the container, so `cqw` measures the
          picture, and the label keeps the proportions the SVG text had.
        */
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-[12%] text-white [container-type:inline-size]">
          <span className="text-[clamp(0.9rem,5cqw,3rem)] font-bold opacity-95">
            {tr(typeNames[type])}
          </span>
          <span className="mt-[0.4em] text-[clamp(0.5rem,2.5cqw,1.5rem)] uppercase tracking-wider opacity-70">
            {t.brand}
          </span>
        </div>
      )}
    </>
  );
}

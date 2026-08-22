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
 * carry their label inside the drawing, set as SVG text. Which meant a Kurdish
 * page said "Land" and a Turkmen page said "Land": the picture was the one
 * thing on the page that never translated.
 *
 * The text is out of the artwork and drawn here instead, so it reads in
 * whatever language the visitor chose and a language added later needs nothing
 * doing to nine SVG files.
 *
 * The label is an SVG of its own, sharing the drawing's viewBox and its
 * `preserveAspectRatio`. First attempt laid the words over the box in ordinary
 * elements, positioned against the container — which is right only while the
 * drawing fills the container exactly. It does not: the listing page frames it
 * 16:10 and the drawing is 4:3, so it is letterboxed, and the label climbed up
 * into the dashed frame. Two SVGs with the same viewBox scale and letterbox
 * together, so the words land where the original text did whatever shape the
 * frame is.
 *
 * A real photograph goes straight through; none of this applies to it.
 */

/**
 * The drawing's own coordinate space, and where the two lines sit in it.
 *
 * The original SVG text was at 740 and 800 — sixty apart, which is enough for
 * Latin and not for Kurdish or Arabic. Measured in the page, "زەوی" and
 * "نووسینگەی لای حەمە" overlapped by eight pixels at those numbers: the script
 * carries taller ascenders and deeper descenders than the spacing was cut for.
 * Ninety apart clears both, and there is room below because the frame above
 * ends at 640.
 */
const ART_BOX = "0 0 1200 900";
const TYPE_Y = 725;
const BRAND_Y = 815;

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
  const { t, tr, dir } = useI18n();
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
        /*
          A stand-in is drawing, not a photograph: cropping it cuts the frame
          off its own edges, and it has to letterbox the same way the label
          does for the two to line up.
        */
        className={placeholder ? "object-contain" : className}
      />
      {placeholder && (
        <svg
          viewBox={ART_BOX}
          preserveAspectRatio="xMidYMid meet"
          // Decorative: the alt text on the picture already names the listing.
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <text
            x="600"
            y={TYPE_Y}
            direction={dir}
            textAnchor="middle"
            fontSize="60"
            fontWeight="700"
            fill="#ffffff"
            opacity="0.95"
          >
            {tr(typeNames[type])}
          </text>
          <text
            x="600"
            y={BRAND_Y}
            direction={dir}
            textAnchor="middle"
            fontSize="30"
            fill="#ffffff"
            opacity="0.7"
          >
            {t.brand}
          </text>
        </svg>
      )}
    </>
  );
}

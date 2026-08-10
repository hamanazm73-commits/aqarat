/**
 * The Lay Hama Homes emblem: a solid house with its door cut out of it,
 * beneath three stars, inside a fine gold double ring on a deep-navy badge.
 *
 * Deliberately the same badge, ring and palette as the sister site's citadel
 * mark, so the two brands read as one family at a glance — only the motif
 * inside changes. Pass sizing via `className`.
 *
 * The house is a filled shape rather than an outline, and the door is punched
 * out in the badge colour instead of drawn: at favicon size, thin gold strokes
 * close up into a smudge, while a solid silhouette keeps its shape.
 */

/** One star, drawn once and placed three times. Tip at (50,20), centre near
 *  (50,27.5) — the transforms below position and scale it around that centre. */
const STAR_D =
  "M50 20 l2.3 4.8 5.3.8-3.8 3.7 1 5.3-4.8-2.5-4.8 2.5 1-5.3-3.8-3.7 5.3-.8Z";

/** Sit a copy of the star at (cx,cy), scaled by s about its own centre. */
const place = (cx: number, cy: number, s: number) =>
  `translate(${cx} ${cy}) scale(${s}) translate(-50 -27.5)`;

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={
        "grid shrink-0 place-items-center overflow-hidden rounded-xl bg-[#15304A] shadow-md " +
        (className ?? "")
      }
    >
      <svg viewBox="0 0 100 100" className="size-[82%]" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="#DFB250"
          strokeWidth="2.4"
        />
        <circle
          cx="50"
          cy="50"
          r="37"
          fill="none"
          stroke="#DFB250"
          strokeWidth="1"
        />

        {/* Three stars: one leading, two flanking and smaller, so the group
            reads as an arc over the roof rather than a row of equals. */}
        <g fill="#DFB250">
          <path d={STAR_D} transform={place(50, 23, 1)} />
          <path d={STAR_D} transform={place(34.5, 30, 0.62)} />
          <path d={STAR_D} transform={place(65.5, 30, 0.62)} />
        </g>

        {/* House: eaves overhanging the walls, in one filled path. */}
        <path
          d="M50 36 L27 55 L33 55 L33 72 L67 72 L67 55 L73 55 Z"
          fill="#DFB250"
        />
        {/* Door, punched out in the badge colour. */}
        <rect x="45" y="59" width="10" height="13" rx="1.4" fill="#15304A" />
      </svg>
    </span>
  );
}

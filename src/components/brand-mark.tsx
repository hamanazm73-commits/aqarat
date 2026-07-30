/**
 * The Kurdistan Estates emblem: a peaked-roof house under a star, inside a
 * fine gold double ring, on a deep-navy rounded badge.
 *
 * Deliberately the same badge, ring and star as the sister site's citadel
 * mark — only the motif inside changes — so the two brands read as one family
 * at a glance. Pass sizing via `className`.
 */
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
        {/* star — shared with the hotels mark */}
        <path
          d="M50 25 l1.9 4 4.4.6-3.2 3.1.8 4.4-3.9-2.1-3.9 2.1.8-4.4-3.2-3.1 4.4-.6Z"
          fill="#DFB250"
        />
        {/* roof beams, notched at the apex */}
        <g
          stroke="#DFB250"
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M31 62 L47 47" />
          <path d="M53 47 L69 62" />
        </g>
        {/* window grid */}
        <g fill="#DFB250">
          <rect x="42" y="56" width="5" height="5" rx="0.8" />
          <rect x="49.5" y="56" width="5" height="5" rx="0.8" />
          <rect x="42" y="63.5" width="5" height="5" rx="0.8" />
          <rect x="49.5" y="63.5" width="5" height="5" rx="0.8" />
        </g>
        {/* base sweep */}
        <path
          d="M29 74 Q50 80 71 74"
          fill="none"
          stroke="#DFB250"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

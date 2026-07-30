/**
 * Kurdistan, with a location pin planted on Erbil — the flag carried inside
 * the pin rather than beside it, so the mark says "property, here" in one
 * shape instead of two.
 *
 * The outline is a stylised silhouette traced from the wall map the owner
 * supplied. It is deliberately smooth: at hero size a fully detailed border
 * would read as noise, and inventing detail would only fake a precision this
 * drawing doesn't have. Drawn rather than photographed so it stays sharp,
 * costs a few kilobytes, and is the site's own artwork.
 */

/** The 21 rays of the flag's sun. */
const RAYS = Array.from({ length: 21 }, (_, i) => (i * 360) / 21);

/** Teardrop pin in its own 200×200 space; its tip sits at (100,166). */
const PIN =
  "M100,26 C74,26 54,47 54,72 C54,106 100,166 100,166 C100,166 146,106 146,72 C146,47 126,26 100,26 Z";

const MAP = `M96,300
  C104,262 112,222 130,188 C150,150 176,124 208,112
  C246,98 286,90 326,84 C368,78 406,70 444,66
  C482,62 512,52 546,42 C582,32 616,44 646,74
  C670,98 684,130 693,166 C702,206 706,241 715,276
  C723,313 736,346 754,373 C774,403 797,425 821,449
  C849,477 879,495 899,521 C913,541 909,567 895,593
  C879,623 857,649 835,677 C819,697 807,713 797,725
  C781,707 765,685 749,661 C729,631 713,601 695,573
  C677,545 661,517 641,495 C621,473 599,453 575,439
  C553,427 529,419 503,411 C463,399 421,391 379,385
  C337,379 295,375 253,373 C215,371 179,375 147,383
  C117,391 89,401 67,413 C49,407 41,393 47,377
  C55,359 73,349 87,335 C97,325 99,313 96,300 Z`;

export function KurdistanMapMark({
  className,
  /** Fades the land only. Behind hero copy it drops to a watermark while the
      pin stays at full strength, so the mark still has a focal point. */
  mapOpacity = 1,
}: {
  className?: string;
  mapOpacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 1000 750"
      className={className}
      role="img"
      aria-label="نەخشەی کوردستان و نیشانەی شوێن لەسەر هەولێر · Kurdistan with a location pin on Erbil"
    >
      <defs>
        <linearGradient id="kmm-fill" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#2a5578" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#16334e" stopOpacity="0.95" />
        </linearGradient>
        <filter id="kmm-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="9"
            floodColor="#e0b84c"
            floodOpacity="0.35"
          />
        </filter>
        <radialGradient id="kmm-pinglow">
          <stop offset="0%" stopColor="#e0b84c" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#e0b84c" stopOpacity="0" />
        </radialGradient>
        <filter id="kmm-shadow" x="-60%" y="-30%" width="220%" height="180%">
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="12"
            floodColor="#000"
            floodOpacity="0.45"
          />
        </filter>
        {/* the cloth inside the pin breathes, so the mark isn't dead still */}
        <filter id="kmm-cloth" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.05"
            numOctaves={2}
            seed={4}
            result="n"
          >
            <animate
              attributeName="baseFrequency"
              dur="10s"
              repeatCount="indefinite"
              values="0.02 0.05;0.028 0.062;0.02 0.05"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <clipPath id="kmm-pinclip">
          <path d={PIN} />
        </clipPath>
      </defs>

      <g opacity={mapOpacity}>
        <path
          d={MAP}
          fill="url(#kmm-fill)"
          stroke="#e0b84c"
          strokeWidth="3.5"
          strokeLinejoin="round"
          filter="url(#kmm-glow)"
        />
      </g>

      {/* the pin, planted on Erbil (660,442) */}
      {/* glow centred on the pin's head — 259.4 + 72×1.1 */}
      <circle cx="660" cy="339" r="88" fill="url(#kmm-pinglow)" />
      <g transform="translate(550,259.4) scale(1.1)" filter="url(#kmm-shadow)">
        <g clipPath="url(#kmm-pinclip)" filter="url(#kmm-cloth)">
          {/* the white band is centred on the pin's head, so the sun lands
              where the eye does rather than riding up onto the red */}
          <rect x="40" y="14" width="120" height="41" fill="#ED2024" />
          <rect x="40" y="55" width="120" height="35" fill="#FFFFFF" />
          <rect x="40" y="90" width="120" height="88" fill="#278E43" />
          <g transform="translate(100,72)">
            {RAYS.map((deg) => (
              <path
                key={deg}
                d="M0,-29 L3.3,-15.08 L-3.3,-15.08 Z"
                fill="#FEBD11"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle r="14.5" fill="#FEBD11" />
          </g>
        </g>
        <path d={PIN} fill="none" stroke="#e0b84c" strokeWidth="6" />
      </g>
    </svg>
  );
}

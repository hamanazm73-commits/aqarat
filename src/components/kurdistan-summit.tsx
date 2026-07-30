/**
 * The Kurdistan summit scene that closes the hero: a figure on the highest
 * ridge planting the Kurdistan flag, with the ranges receding into haze behind
 * a low sun.
 *
 * Drawn rather than photographed, for three reasons: the flag can actually
 * move, it stays sharp on any screen, and it costs a few kilobytes instead of
 * a few hundred. The sky starts at the same navy the hero fades to, so the
 * band reads as the bottom of the hero rather than a picture pasted under it.
 *
 * Rendered in normal flow (not absolutely positioned) so it can never collide
 * with the headline, at any width.
 */
export function KurdistanSummit({ className }: { className?: string }) {
  // 21 rays, the sun of the Kurdistan flag
  const rays = Array.from({ length: 21 }, (_, i) => (i * 360) / 21);

  return (
    <svg
      viewBox="0 0 1200 420"
      // On a phone the band would otherwise be ~130px tall and the figure a
      // speck, so there it gets a fixed height and crops in from the sides
      // instead — the summit stays centred and readable. From `sm` up the
      // height is auto, the viewport matches the viewBox, and nothing crops.
      preserveAspectRatio="xMidYMax slice"
      className={className}
      role="img"
      aria-label="ئاڵای کوردستان لەسەر لووتکەی شاخەکان · The Kurdistan flag raised on a mountain summit"
    >
      <defs>
        <linearGradient id="ks-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#173c5c" />
          <stop offset="38%" stopColor="#2f5a73" />
          <stop offset="66%" stopColor="#9a6b40" />
          <stop offset="86%" stopColor="#dcb355" />
          <stop offset="100%" stopColor="#f0d089" />
        </linearGradient>

        <radialGradient id="ks-sun">
          <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.95" />
          <stop offset="38%" stopColor="#e0b84c" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#e0b84c" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="ks-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6e8aa2" />
          <stop offset="100%" stopColor="#4e6e89" />
        </linearGradient>
        <linearGradient id="ks-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d5d79" />
          <stop offset="100%" stopColor="#2a4761" />
        </linearGradient>
        <linearGradient id="ks-fore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f2133" />
          <stop offset="100%" stopColor="#081422" />
        </linearGradient>
        <linearGradient id="ks-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0b84c" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#e0b84c" stopOpacity="0" />
        </linearGradient>

        {/* cloth ripple — animated noise nudges the flag's pixels around */}
        <filter id="ks-wave" x="-18%" y="-45%" width="136%" height="190%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014 0.05"
            numOctaves={2}
            seed={7}
            result="n"
          >
            <animate
              attributeName="baseFrequency"
              dur="9s"
              repeatCount="indefinite"
              values="0.014 0.05; 0.022 0.066; 0.014 0.05"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <rect width="1200" height="420" fill="url(#ks-sky)" />

      {/* sun */}
      <circle cx="290" cy="252" r="160" fill="url(#ks-sun)" />
      <circle cx="290" cy="252" r="40" fill="#ffdf95" />
      <circle cx="290" cy="252" r="40" fill="#ffeec2" opacity="0.5" />

      {/* far range */}
      <path
        fill="url(#ks-far)"
        opacity="0.85"
        d="M0,262 L80,224 L145,248 L235,196 L318,238 L405,206 L500,246 L595,208 L688,244 L790,198 L878,238 L978,204 L1075,242 L1200,212 L1200,420 L0,420 Z"
      />
      <rect y="196" width="1200" height="72" fill="url(#ks-haze)" />

      {/* mid range */}
      <path
        fill="url(#ks-mid)"
        d="M0,300 L110,262 L200,288 L300,242 L400,284 L500,250 L610,288 L720,246 L820,284 L930,246 L1040,286 L1140,258 L1200,278 L1200,420 L0,420 Z"
      />
      <rect y="242" width="1200" height="70" fill="url(#ks-haze)" opacity="0.65" />

      {/* near range */}
      <path
        fill="#17304a"
        d="M0,338 L120,306 L245,332 L365,292 L470,326 L580,296 L700,330 L810,294 L925,328 L1040,300 L1150,330 L1200,316 L1200,420 L0,420 Z"
      />

      {/* foreground ridge — the summit the figure stands on */}
      <path
        fill="url(#ks-fore)"
        d="M0,420 L0,376 L150,352 L320,318 L500,268 L648,214 L790,150 L884,196 L1000,258 L1105,300 L1200,326 L1200,420 Z"
      />
      {/* rim light, catching the low sun along the crest */}
      <path
        fill="none"
        stroke="#e0b84c"
        strokeOpacity="0.5"
        strokeWidth="2.2"
        d="M500,268 L648,214 L790,150 L884,196 L1000,258"
      />

      {/* ---- flag ---- */}
      <g className="ks-pole">
        <line
          x1="802"
          y1="154"
          x2="802"
          y2="48"
          stroke="#0a1622"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <circle cx="802" cy="45" r="3.8" fill="#e0b84c" />

        <g filter="url(#ks-wave)">
          <rect x="804" y="55" width="134" height="26" fill="#ED2024" />
          <rect x="804" y="81" width="134" height="26" fill="#FFFFFF" />
          <rect x="804" y="107" width="134" height="26" fill="#278E43" />
          <g transform="translate(871,94)">
            {rays.map((deg) => (
              <path
                key={deg}
                d="M0,-24 L2.7,-12.4 L-2.7,-12.4 Z"
                fill="#FEBD11"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle r="12.4" fill="#FEBD11" />
          </g>
        </g>
        {/* the cloth sits in its own shadow where it meets the pole */}
        <rect x="804" y="55" width="8" height="78" fill="#000" opacity="0.18" />
      </g>

      {/* ---- the figure ---- */}
      <g
        stroke="#0a1622"
        strokeWidth="4.6"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M785,150 L788,134" />
        <path d="M795,150 L791.5,134" />
        <path d="M789.5,134 L790,116" />
        <path d="M790.5,119 L799,111" />
        <path d="M790.5,119 L783,128" />
      </g>
      <circle cx="790.5" cy="110" r="5.4" fill="#0a1622" />

      {/* birds */}
      <g
        stroke="#0a1622"
        strokeOpacity="0.45"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M1010,96 q6,-5 12,0 q6,-5 12,0" />
        <path d="M1068,132 q4.6,-3.8 9.2,0 q4.6,-3.8 9.2,0" />
        <path d="M1030,152 q3.8,-3 7.6,0 q3.8,-3 7.6,0" />
      </g>
    </svg>
  );
}

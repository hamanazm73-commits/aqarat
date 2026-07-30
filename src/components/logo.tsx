/** Aqarat Shivan mark — a gold peaked-roof house with window grid. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      role="img"
      aria-label="Aqarat Shivan"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="#c8a951" stroke="#c8a951">
        {/* roof beams with a notch at the apex */}
        <path
          d="M24 104 L94 44"
          fill="none"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M106 44 L176 104"
          fill="none"
          strokeWidth="15"
          strokeLinecap="round"
        />
        {/* window grid (3 x 2) */}
        <rect x="79" y="64" width="10" height="10" rx="1.5" />
        <rect x="95" y="64" width="10" height="10" rx="1.5" />
        <rect x="111" y="64" width="10" height="10" rx="1.5" />
        <rect x="79" y="80" width="10" height="10" rx="1.5" />
        <rect x="95" y="80" width="10" height="10" rx="1.5" />
        <rect x="111" y="80" width="10" height="10" rx="1.5" />
        {/* base sweep */}
        <path
          d="M18 116 Q100 140 182 116"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

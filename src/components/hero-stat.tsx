"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A hero figure that counts up the first time it's seen.
 *
 * A number that lands on screen already finished is just text; one that runs
 * up to its value reads as something being measured. Matched to the hotel
 * site's hero, which does the same.
 */
export function HeroStat({
  value,
  label,
  format,
}: {
  value: number;
  label: string;
  /** locale-aware formatter, so Kurdish and Arabic get their own digits */
  format: (n: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0) {
      setN(value);
      return;
    }
    // Someone who asked for less motion gets the figure, not the performance.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }

    let raf = 0;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1400);
        setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return () => cancelAnimationFrame(raf);
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-extrabold text-gold tabular-nums sm:text-4xl">
        {format(n)}
      </p>
      <p className="mt-0.5 text-sm text-white/70">{label}</p>
    </div>
  );
}

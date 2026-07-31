"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** Live read of the reduced-motion preference, without setState in an effect. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false, // server render: assume motion is fine
  );
}

/**
 * A hero figure that counts up when it scrolls into view.
 *
 * The real number is what renders until the count actually starts — on the
 * server, before hydration, and for anyone who asked for less motion. An
 * earlier version began at zero, which meant the HTML Google reads said
 * "0+ properties"; a decoration is not worth a wrong number.
 *
 * That also decides when it animates: only when the figure arrives from
 * off-screen. If it's already on screen at load, counting would mean showing
 * the true number and then yanking it back to zero, so it just stands.
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
  const [running, setRunning] = useState(false);
  const reduced = usePrefersReducedMotion();
  const animates = value > 0 && !reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el || !animates) return;
    if (typeof IntersectionObserver === "undefined") return;

    // already in view on load — leave the number where it is
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;

    let raf = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        setRunning(true);
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / 1400);
          setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, animates]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-extrabold text-gold tabular-nums sm:text-4xl">
        {format(running ? n : value)}
      </p>
      <p className="mt-0.5 text-sm text-white/70">{label}</p>
    </div>
  );
}

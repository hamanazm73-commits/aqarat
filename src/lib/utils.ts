import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Whether a source must skip Next's image optimizer.
 *
 * Three kinds, and each errors rather than degrades if it goes through:
 *
 *  - `.svg` — the optimizer refuses SVG unless dangerouslyAllowSVG is set,
 *    and it is not, because an SVG is a document that can carry script. The
 *    seed listings and the empty-state art in /public/img are all SVG, so
 *    this is not a hypothetical.
 *  - `data:` and `blob:` — the bytes are already in the page or in memory.
 *    There is no URL for the optimizer to fetch, so it fails.
 *
 * Everything else is a real photograph in the bucket, which is exactly what
 * the optimizer is for.
 */
export function isRawSrc(src: string | undefined | null): boolean {
  if (!src) return true;
  return (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    /\.svg(\?|$)/i.test(src)
  );
}

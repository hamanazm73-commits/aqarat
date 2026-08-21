import type { Property, PropertyFilters } from "./types";
import { looseMatch } from "./search-normalise";
import { FLOORS_MAX } from "./constants";

/**
 * Listings shown when Firestore has none.
 *
 * Empty, and meant to stay empty. Twelve invented properties used to live
 * here — placeholder villas and shops with drawn SVGs for photographs —
 * and because the read layer falls back to this list whenever the
 * collection comes back empty, they were what the public site actually
 * served. Real listings are entered through /hq and live in Firestore.
 *
 * The fallback itself is worth keeping: if a Firestore read fails, the
 * site shows nothing rather than an error.
 */
export const SEED_PROPERTIES: Property[] = [];

/** Pure filter+sort used client-side and server-side. */
export function filterProperties(
  list: Property[],
  f: PropertyFilters,
): Property[] {
  let out = list.filter((p) => !p.hidden);

  if (f.purpose && f.purpose !== "all") out = out.filter((p) => p.purpose === f.purpose);
  if (f.type && f.type !== "all") out = out.filter((p) => p.type === f.type);
  if (f.city && f.city !== "all") out = out.filter((p) => p.city === f.city);
  if (typeof f.minPrice === "number") out = out.filter((p) => p.priceIQD >= f.minPrice!);
  if (typeof f.maxPrice === "number") out = out.filter((p) => p.priceIQD <= f.maxPrice!);
  if (typeof f.bedrooms === "number") out = out.filter((p) => (p.bedrooms ?? 0) >= f.bedrooms!);
  if (typeof f.floors === "number") {
    const want = f.floors;
    out = out.filter((p) =>
      want >= FLOORS_MAX ? (p.floors ?? 0) >= want : p.floors === want,
    );
  }
  if (f.q) {
    const q = f.q.trim();
    // Field by field rather than one joined string: joining lets a query match
    // across a seam that isn't there — the end of a title and the start of a
    // description are not adjacent in any sense a searcher means. `looseMatch`
    // is what lets an Arabic keyboard find a Kurdish spelling.
    out = out.filter((p) =>
      [
        p.title.ku, p.title.en, p.title.ar,
        p.description.ku, p.description.en, p.description.ar,
        p.district?.ku ?? "", p.district?.en ?? "", p.district?.ar ?? "",
        p.city, p.type,
      ].some((v) => !!v && looseMatch(v, q)),
    );
  }

  switch (f.sort) {
    case "price_asc":
      out = [...out].sort((a, b) => a.priceIQD - b.priceIQD);
      break;
    case "price_desc":
      out = [...out].sort((a, b) => b.priceIQD - a.priceIQD);
      break;
    case "area_desc":
      out = [...out].sort((a, b) => b.area - a.area);
      break;
    default:
      out = [...out].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
  }
  return out;
}

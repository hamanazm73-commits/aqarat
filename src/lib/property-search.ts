import type {
  CityKey,
  Locale,
  PropertyFilters,
  PropertyType,
  Purpose,
} from "./types";
import { CITY_KEYS, PROPERTY_TYPE_KEYS } from "./constants";
import { cityNames, typeNames, purposeNames } from "./i18n/dictionaries";

export type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(sp: SP): PropertyFilters {
  const purpose = one(sp.purpose);
  const type = one(sp.type);
  const city = one(sp.city);
  const bedrooms = one(sp.bedrooms);
  const floors = one(sp.floors);
  const minPrice = one(sp.minPrice);
  const maxPrice = one(sp.maxPrice);

  return {
    q: one(sp.q),
    purpose:
      purpose === "sale" || purpose === "rent" ? (purpose as Purpose) : undefined,
    type: PROPERTY_TYPE_KEYS.includes(type as PropertyType)
      ? (type as PropertyType)
      : undefined,
    city: CITY_KEYS.includes(city as CityKey) ? (city as CityKey) : undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    floors: floors ? Number(floors) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: "newest",
  };
}

/** "all" is how the explorer spells "no filter" — not a facet worth indexing. */
const set = <T extends string>(v: T | "all" | undefined): T | undefined =>
  v && v !== "all" ? (v as T) : undefined;

/** Sentence frames per language. Kurdish and Arabic put the place last the
 *  same way English does, so one shape carries all three. */
const FRAME: Record<
  Locale,
  { anything: string; forWhat: string; in: string; region: string; tail: string }
> = {
  ku: {
    anything: "خانووبەرە",
    forWhat: "بۆ",
    in: "لە",
    region: "کوردستان",
    tail: "نرخ، وێنە، ڕووبەر و ژمارەی ژوور، لەگەڵ پەیوەندیی ڕاستەوخۆ بە خاوەنەکەی.",
  },
  en: {
    anything: "Property",
    forWhat: "for",
    in: "in",
    region: "Kurdistan",
    tail: "Prices, photos, area and room counts, with direct contact to the owner.",
  },
  ar: {
    anything: "عقارات",
    forWhat: "لل",
    in: "في",
    region: "كردستان",
    tail: "الأسعار والصور والمساحة وعدد الغرف، مع تواصل مباشر مع المالك.",
  },
};

/**
 * What a filtered listing page is called, and which of its parameters deserve
 * to be in the canonical URL.
 *
 * Only purpose, type and city make a page worth its own entry in the index.
 * Price and bedroom filters multiply into thousands of near-identical lists,
 * so they are dropped from the canonical; a text search is not indexed at all.
 */
export function facetTitle(f: PropertyFilters, locale: Locale) {
  const frame = FRAME[locale];
  const type = set<PropertyType>(f.type);
  const purpose = set<Purpose>(f.purpose);
  const city = set<CityKey>(f.city);

  const thing = type ? typeNames[type][locale] : frame.anything;
  // Arabic attaches its preposition to the word: "للبيع", not "لل بيع".
  const joiner = locale === "ar" ? "" : " ";
  const forWhat = purpose
    ? ` ${frame.forWhat}${joiner}${purposeNames[purpose][locale]}`
    : "";
  const where = ` ${frame.in} ${city ? cityNames[city][locale] : frame.region}`;
  const title = `${thing}${forWhat}${where}`;

  const params = new URLSearchParams();
  if (purpose) params.set("purpose", purpose);
  if (type) params.set("type", type);
  if (city) params.set("city", city);

  return {
    title,
    description: `${title} — ${frame.tail}`,
    query: params.toString(),
    hasSearch: Boolean(f.q),
  };
}

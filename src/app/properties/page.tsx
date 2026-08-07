import { getAllProperties, getEnabledCities } from "@/lib/repo";
import { PropertyExplorer } from "@/components/property-explorer";
import type {
  CityKey,
  PropertyFilters,
  PropertyType,
  Purpose,
} from "@/lib/types";
import { CITY_KEYS, PROPERTY_TYPE_KEYS } from "@/lib/constants";
import { cityNames, typeNames, purposeNames } from "@/lib/i18n/dictionaries";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://homeskurdistan.com";

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseFilters(sp: SP): PropertyFilters {
  const purpose = one(sp.purpose);
  const type = one(sp.type);
  const city = one(sp.city);
  const bedrooms = one(sp.bedrooms);
  const minPrice = one(sp.minPrice);
  const maxPrice = one(sp.maxPrice);

  return {
    q: one(sp.q),
    purpose: purpose === "sale" || purpose === "rent" ? (purpose as Purpose) : undefined,
    type: PROPERTY_TYPE_KEYS.includes(type as PropertyType)
      ? (type as PropertyType)
      : undefined,
    city: CITY_KEYS.includes(city as CityKey) ? (city as CityKey) : undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: "newest",
  };
}

/**
 * A filtered listing page describing itself.
 *
 * "خانوو بۆ فرۆشتن لە هەولێر" is what someone actually types into Google, and
 * the filtered URL is already the page that answers it — it just used to call
 * itself "Properties" in English and say nothing else.
 *
 * The canonical URL keeps only the three facets worth having their own page
 * (purpose, type, city) and drops the rest. Price and bedroom filters multiply
 * into thousands of URLs showing near-identical lists; pointing them all at
 * the clean facet keeps the crawler on the pages that matter. A `q=` search is
 * left out of the index entirely — internal search results are not content.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const f = parseFilters(sp);

  // "all" is how the explorer spells "no filter"; it is not a facet, and
  // indexing it would just duplicate the unfiltered page.
  const set = <T extends string>(v: T | "all" | undefined): T | undefined =>
    v && v !== "all" ? (v as T) : undefined;
  const type = set<PropertyType>(f.type);
  const purpose = set<Purpose>(f.purpose);
  const city = set<CityKey>(f.city);

  const thing = type ? typeNames[type].ku : "خانووبەرە";
  const forWhat = purpose ? ` بۆ ${purposeNames[purpose].ku}` : "";
  const where = city ? ` لە ${cityNames[city].ku}` : " لە کوردستان";
  const title = `${thing}${forWhat}${where}`;

  const params = new URLSearchParams();
  if (purpose) params.set("purpose", purpose);
  if (type) params.set("type", type);
  if (city) params.set("city", city);
  const qs = params.toString();

  return {
    title,
    description: `${title} — نرخ، وێنە، ڕووبەر و ژمارەی ژوور، لەگەڵ پەیوەندیی ڕاستەوخۆ بە خاوەنەکەی.`,
    alternates: { canonical: `${SITE_URL}/properties${qs ? `?${qs}` : ""}` },
    ...(f.q ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description: `${title} — لە نووسینگەی ئۆنڵاین.`,
      url: `${SITE_URL}/properties${qs ? `?${qs}` : ""}`,
    },
  };
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const [all, sp, cities] = await Promise.all([
    getAllProperties(),
    searchParams,
    getEnabledCities(),
  ]);
  const initial = parseFilters(sp);

  // Remount the explorer when the query changes (e.g. header "For Rent" link)
  // so its internal filter state re-seeds from the new URL.
  const key = JSON.stringify(sp);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PropertyExplorer key={key} all={all} initial={initial} cities={cities} />
    </div>
  );
}

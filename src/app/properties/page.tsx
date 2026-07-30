import { getAllProperties, getEnabledCities } from "@/lib/repo";
import { PropertyExplorer } from "@/components/property-explorer";
import type {
  CityKey,
  PropertyFilters,
  PropertyType,
  Purpose,
} from "@/lib/types";
import { CITY_KEYS, PROPERTY_TYPE_KEYS } from "@/lib/constants";

export const metadata = { title: "Properties" };

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

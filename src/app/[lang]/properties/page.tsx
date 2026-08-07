import { getAllProperties, getEnabledCities } from "@/lib/repo";
import { PropertyExplorer } from "@/components/property-explorer";
import { parseFilters, facetTitle, type SP } from "@/lib/property-search";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/lib/types";

/**
 * The listing page in English and Arabic. "houses for sale in Erbil" and
 * "منازل للبيع في أربيل" are queries with nothing on this site answering them
 * until these exist.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ lang }, sp] = await Promise.all([params, searchParams]);
  const locale = lang as Locale;
  const { title, description, query, hasSearch } = facetTitle(
    parseFilters(sp),
    locale,
  );
  const path = `/properties${query ? `?${query}` : ""}`;

  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    ...(hasSearch ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      url: alternatesFor(locale, path).canonical,
    },
  };
}

export default async function LocalisedPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const [all, sp, cities] = await Promise.all([
    getAllProperties(),
    searchParams,
    getEnabledCities(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PropertyExplorer
        key={JSON.stringify(sp)}
        all={all}
        initial={parseFilters(sp)}
        cities={cities}
      />
    </div>
  );
}

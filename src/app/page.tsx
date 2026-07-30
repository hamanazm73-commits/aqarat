import { getAllProperties, getEnabledCities } from "@/lib/repo";
import { HomeContent } from "@/components/home-content";

// Refresh Firestore data at most every 30s so newly-added listings appear
// without a rebuild (ISR).
export const revalidate = 30;

export default async function HomePage() {
  const [all, cities] = await Promise.all([
    getAllProperties(),
    getEnabledCities(),
  ]);

  return (
    <HomeContent
      properties={all}
      counts={{ listings: all.length, cities: cities.length }}
      cities={cities}
    />
  );
}

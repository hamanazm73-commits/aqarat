import { getAllProperties, getEnabledCities } from "@/lib/repo";
import { HomeContent } from "@/components/home-content";
import { SITE_URL, alternatesFor } from "@/lib/seo";

// Refresh Firestore data at most every 30s so newly-added listings appear
// without a rebuild (ISR).
export const revalidate = 30;

export const metadata = { alternates: alternatesFor("ku", "/") };

/**
 * Who runs this site, in the vocabulary a crawler reads. Without it the
 * homepage is an anonymous page of houses; with it, the name, the phone
 * number and the area served belong to one identifiable business — which is
 * what Google wants before it will show any of them beside a result.
 */
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${SITE_URL}/#organization`,
  name: "Lay Hama Homes — لای حەمە هۆمز",
  // The old names stay listed: this is a rename, not a new company, and it is
  // how Google learns the two refer to the same thing.
  alternateName: [
    "عند حمة للعقارات",
    "Lay Hama",
    "Homes Kurdistan",
    "نووسینگەی ئۆنڵاین",
    "المكتب الإلكتروني",
    "Online Office",
  ],
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  telephone: "+9647502202191",
  email: "info@homeskurdistan.com",
  areaServed: { "@type": "AdministrativeArea", name: "Kurdistan Region, Iraq" },
  address: { "@type": "PostalAddress", addressCountry: "IQ" },
};

export default async function HomePage() {
  const [all, cities] = await Promise.all([
    getAllProperties(),
    getEnabledCities(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <HomeContent
        properties={all}
        counts={{ listings: all.length, cities: cities.length }}
        cities={cities}
      />
    </>
  );
}

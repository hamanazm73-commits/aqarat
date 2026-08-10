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
  name: "Lay Hama Homes — نووسینگەی لای حەمە",
  /*
   * Every way someone asks for this place.
   *
   * "Lay Hama" is a spoken name, so there is no correct way to write it in
   * Latin letters — people type what they heard, and `lay hma` and `lyhma`
   * are the same person looking for the same office.
   *
   * The property words are listed for the same reason. Someone who knows the
   * hotels will search "خانووی لای حەمە" or "زەوی لای حەمە" and expect to land
   * here, because to them it is one business with two halves. Saying so is how
   * Google learns it too.
   *
   * The old names stay: this was a rename, not a new company.
   */
  alternateName: [
    // The office, written properly.
    "نووسینگەی لای حەمە",
    "يم حمة للعقارات",
    "يم حمة",
    "عند حمة للعقارات",
    "Lay Hama Homes",
    "Lay Hama Real Estate",

    // How people ask: the thing, then whose it is.
    "خانووی لای حەمە",
    "خانوی لای حەمە",
    "زەوی لای حەمە",
    "عەقاری لای حەمە",
    "موڵکی لای حەمە",
    "شوقەی لای حەمە",
    "هۆتێلەکانی لای حەمە",
    "عقارات لاي حمة",
    "بيوت لاي حمة",
    "اراضي لاي حمة",

    // The name by ear, in Latin letters.
    "Lay Hama",
    "Layhama",
    "Lay Hma",
    "Layhma",
    "Lyhma",
    "Laihama",
    "Lai Hama",
    "Layhama Homes",
    "Lay Hama Kurdistan",

    // And by ear, in Kurdish and Arabic script.
    "لای حەمە",
    "لایحەمە",
    "لای حمه",
    "لاي حمة",
    "لاي حمه",

    // What it has also been called.
    "نووسینگەی ئۆنڵاین",
    "المكتب الإلكتروني",
    "Online Office",
    "Homes Kurdistan",
    "homeskurdistan",
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

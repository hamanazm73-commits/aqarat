import { notFound } from "next/navigation";
import { getProperty, getSimilar } from "@/lib/repo";
import { SEED_PROPERTIES } from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { PropertyDetail } from "@/components/property-detail";
import type { Property } from "@/lib/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://homeskurdistan.com";

// Keep listing pages fresh (ISR) so edits show up without a rebuild.
export const revalidate = 30;

// Prerender the seed listings only in seed mode. With Firebase, listings are
// dynamic and rendered on demand.
export function generateStaticParams() {
  if (isFirebaseConfigured()) return [];
  return SEED_PROPERTIES.map((p) => ({ id: p.id }));
}

/** Kurdish first, then English, then Arabic — the page ships as lang="ku",
 *  so a Kurdish title is what a searcher should see. Some listings are only
 *  filled in in one language, hence the walk. */
const pick = (v: { ku: string; en: string; ar: string }) =>
  v.ku?.trim() || v.en?.trim() || v.ar?.trim() || "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) return { title: "Not found" };

  const title = pick(p.title);
  const description = pick(p.description).slice(0, 200);
  const url = `${SITE_URL}/properties/${encodeURIComponent(p.id)}`;

  return {
    title,
    description,
    // Without this, a shared listing is a bare blue link. The first photo is
    // the reason anyone clicks a house.
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: p.images?.length ? [p.images[0]] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: p.images?.length ? [p.images[0]] : undefined,
    },
  };
}

/**
 * What the listing is, in the vocabulary search engines read. Google will not
 * draw a price box from this the way it does for shop products, but it is how
 * a crawler learns that this page is one house in Erbil at one price, rather
 * than an article that happens to mention both.
 */
function listingJsonLd(p: Property) {
  const url = `${SITE_URL}/properties/${encodeURIComponent(p.id)}`;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    url,
    name: pick(p.title),
    description: pick(p.description),
    datePosted: p.createdAt,
    ...(p.images?.length ? { image: p.images } : {}),
    offers: {
      "@type": "Offer",
      price: p.priceIQD,
      priceCurrency: "IQD",
      availability: "https://schema.org/InStock",
      url,
      businessFunction:
        p.purpose === "rent"
          ? "https://purl.org/goodrelations/v1#LeaseOut"
          : "https://purl.org/goodrelations/v1#Sell",
    },
    about: {
      "@type": "Accommodation",
      name: pick(p.title),
      ...(p.bedrooms ? { numberOfBedroomsTotal: p.bedrooms } : {}),
      ...(p.bathrooms ? { numberOfBathroomsTotal: p.bathrooms } : {}),
      floorSize: { "@type": "QuantitativeValue", value: p.area, unitCode: "MTK" },
      address: {
        "@type": "PostalAddress",
        addressLocality: p.city,
        addressCountry: "IQ",
      },
      ...(p.lat && p.lng
        ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } }
        : {}),
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();

  const similar = await getSimilar(p, 3);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd(p)) }}
      />
      <PropertyDetail p={p} similar={similar} />
    </>
  );
}

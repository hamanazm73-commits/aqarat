import type { Locale, Property } from "./types";
import { urlFor } from "./seo";
import { titleFor, descriptionFor } from "./listing-text";

/**
 * What the listing is, in the vocabulary search engines read. Google will not
 * draw a price box from this for property the way it does for shop goods, but
 * it is how a crawler learns the page is one house, in one city, at one
 * price — rather than an article that happens to mention all three.
 */
export function listingJsonLd(p: Property, locale: Locale) {
  const url = urlFor(locale, `/properties/${encodeURIComponent(p.id)}`);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    url,
    name: titleFor(p, locale),
    description: descriptionFor(p, locale),
    inLanguage: locale,
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
      name: titleFor(p, locale),
      ...(p.bedrooms ? { numberOfBedroomsTotal: p.bedrooms } : {}),
      ...(p.bathrooms ? { numberOfBathroomsTotal: p.bathrooms } : {}),
      floorSize: {
        "@type": "QuantitativeValue",
        value: p.area,
        unitCode: "MTK",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: p.city,
        addressCountry: "IQ",
      },
      ...(p.lat && p.lng
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: p.lat,
              longitude: p.lng,
            },
          }
        : {}),
    },
  };
}

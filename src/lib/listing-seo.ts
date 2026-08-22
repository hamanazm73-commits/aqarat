import type { Locale, Localized, Property } from "./types";
import { urlFor } from "./seo";

/**
 * The listing's own words in the reader's language, falling back rather than
 * showing nothing. Owners often fill in one language and leave the others
 * empty, so an English page may honestly have to show the Kurdish title —
 * which still beats a blank one.
 */
export function pickLocalized(v: Localized | undefined, locale: Locale) {
  if (!v) return "";
  /*
   * The reader's own language first, then the rest.
   *
   * A chain of ternaries stopped being readable at three languages and would
   * be worse at four, so the order is built rather than spelled out: what was
   * asked for, then everything else. Kurdish and Arabic lead the fallback
   * because a listing that only has one language almost always has one of
   * those.
   */
  const rest: Locale[] = ["ku", "ar", "en", "tk"];
  const order = [locale, ...rest.filter((l) => l !== locale)];
  for (const l of order) {
    const s = v[l]?.trim();
    if (s) return s;
  }
  return "";
}

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
    name: pickLocalized(p.title, locale),
    description: pickLocalized(p.description, locale),
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
      name: pickLocalized(p.title, locale),
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

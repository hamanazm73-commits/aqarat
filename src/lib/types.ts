/** Core domain types for the real-estate site. Shared by the seed data,
 *  the Firestore layer, and the UI. */

/**
 * `tk` is Iraqi Turkmen, written in the Latin alphabet.
 *
 * Kirkuk is one of the three cities this site covers and Turkmen is one of
 * the languages spoken there, so it belongs beside the other three rather
 * than bolted on after them.
 */
export type Locale = "ku" | "en" | "ar" | "tk";

export const LOCALES: Locale[] = ["ku", "ar", "en", "tk"];

/** Kurdish (Sorani) and Arabic are right-to-left; Turkmen here is Latin. */
export const RTL_LOCALES: Locale[] = ["ku", "ar"];

/**
 * A string that exists in every supported language.
 *
 * Partial, because listings saved before a language was added do not have it
 * — a district typed in when there were three languages has no Turkmen. The
 * reader falls back rather than showing a blank, so the missing one costs a
 * word in another language instead of an empty line.
 */
export type Localized = Partial<Record<Locale, string>>;

export type Purpose = "sale" | "rent";

export type PropertyType =
  | "house"
  | "apartment"
  | "villa"
  | "land"
  | "shop"
  | "office";

/** City keys — labels live in the i18n dictionaries. */
export type CityKey =
  | "baghdad"
  | "erbil"
  | "sulaymaniyah"
  | "duhok"
  | "kirkuk"
  | "basra"
  | "mosul"
  | "najaf"
  | "karbala"
  | "halabja"
  | "ramadi"
  | "fallujah"
  | "hilla"
  | "baqubah"
  | "nasiriyah"
  | "amarah"
  | "samawah"
  | "diwaniyah"
  | "tikrit"
  | "samarra"
  | "kut"
  | "zakho"
  | "chamchamal"
  | "ranya"
  | "kalar"
  | "koya"
  | "soran"
  | "shaqlawa";

/**
 * What a listing has, ticked on the form.
 *
 * Two sets, because a plot of land and a house are not asked the same
 * questions. A lift or a fitted kitchen means nothing on empty ground; what a
 * buyer wants to know there is whether the water and the power reach it, what
 * the road is like, and whether the papers are in order. AMENITIES_FOR_TYPE in
 * constants decides which set a type is shown.
 */
export type AmenityKey =
  // buildings
  | "parking"
  | "garden"
  | "elevator"
  | "furnished"
  | "ac"
  | "heating"
  | "security"
  | "pool"
  | "generator"
  | "water_tank"
  | "solar"
  | "balcony"
  // land
  | "water_mains"
  | "electricity"
  | "sewage"
  | "paved_road"
  | "walled"
  | "level_ground"
  | "title_deed"
  | "build_ready";

export interface Discount {
  active: boolean;
  /** The original price before the discount, in IQD. */
  oldPriceIQD: number;
}

export interface Agent {
  name: string;
  phone: string;
  whatsapp?: string;
}

export interface Property {
  id: string;
  /*
   * Both are built from the record now, not typed — see lib/listing-text.ts.
   * They stay on the document because everything that reads a listing reads
   * these: the card, the heading, the search index, the JSON-LD, the share
   * card. Generating them on save rather than on render means all of that
   * keeps working untouched, and a listing written before this still shows
   * whatever it was given.
   */
  title: Localized;
  description: Localized;
  /** The ticked phrases the description is assembled from. */
  features?: string[];
  purpose: Purpose;
  type: PropertyType;
  city: CityKey;
  district?: Localized;
  /** Current asking price (per month for rentals), in Iraqi Dinar. */
  priceIQD: number;
  /** Built-up / land area in square metres. */
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  /** Storeys the building has. */
  floors?: number;
  kitchens?: number;
  images: string[];
  /** Video the seller uploaded, served back through /api/img. */
  videos?: string[];
  amenities: AmenityKey[];
  featured?: boolean;
  recommended?: boolean;
  discount?: Discount;
  agent: Agent;
  /** ISO date string. */
  createdAt: string;
  lat?: number;
  lng?: number;
  /** Hidden listings never show on the public site. */
  hidden?: boolean;
  /** How many times the detail page has been opened. */
  views?: number;
  /**
   * The account that entered this listing, when it was not an administrator.
   *
   * A seller reaches the dashboard through a link of their own and sees only
   * the rows carrying their address here. Absent on anything an admin enters,
   * which is why the seller's view filters on a match rather than on the
   * field merely being present.
   */
  sellerEmail?: string;
}

/** Filters used by the listing page. */
export interface PropertyFilters {
  q?: string;
  purpose?: Purpose | "all";
  type?: PropertyType | "all";
  city?: CityKey | "all";
  minPrice?: number;
  maxPrice?: number;
  /*
   * How many bedrooms, exactly — not a minimum.
   *
   * It used to be a minimum, and every chip carried a plus to say so: asking
   * for two returned every three- and four-bedroom house as well. Somebody
   * choosing two bedrooms is choosing two, and a filter that quietly widens
   * what you asked for is one you stop trusting.
   *
   * BEDROOMS_MAX is the exception, for the same reason FLOORS_MAX is: the top
   * chip means that many or more, and without it a six-bedroom house could not
   * be reached from the filter at all.
   */
  bedrooms?: number;
  /*
   * How many storeys, exactly — the same rule.
   *
   * Somebody asking for a single-storey house is usually asking because of
   * stairs, and a three-storey one is not a better version of what they
   * wanted. FLOORS_MAX is the "or more" rung.
   */
  floors?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "area_desc";
}

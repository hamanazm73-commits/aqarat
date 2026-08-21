/** Core domain types for the real-estate site. Shared by the seed data,
 *  the Firestore layer, and the UI. */

export type Locale = "ku" | "en" | "ar";

export const LOCALES: Locale[] = ["ku", "en", "ar"];

/** Kurdish (Sorani) and Arabic are right-to-left. */
export const RTL_LOCALES: Locale[] = ["ku", "ar"];

/** A string that exists in every supported language. */
export type Localized = Record<Locale, string>;

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

export type AmenityKey =
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
  | "balcony";

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
  title: Localized;
  description: Localized;
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
  bedrooms?: number; // minimum
  /*
   * How many storeys, exactly — not a minimum.
   *
   * Bedrooms reads as "at least this many": four bedrooms will do if you asked
   * for three. Storeys does not. Somebody asking for a single-storey house is
   * usually asking because of stairs, and a three-storey one is not a better
   * version of what they wanted.
   *
   * FLOORS_MAX is the one exception — the top chip means that many or more,
   * because past it the exact number stops being what anyone is choosing on.
   */
  floors?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "area_desc";
}

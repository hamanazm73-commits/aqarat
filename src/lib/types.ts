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
  images: string[];
  /** Video URLs — YouTube links or direct MP4 URLs. */
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
}

/** Inbound inquiry from the contact / booking form. */
export interface Inquiry {
  id?: string;
  propertyId: string;
  name: string;
  phone: string;
  message?: string;
  createdAt: string;
}

/** A property submitted by a visitor (single language), awaiting admin review. */
export interface Submission {
  id?: string;
  title: string;
  description?: string;
  purpose: Purpose;
  type: PropertyType;
  city: CityKey;
  district?: string;
  priceIQD: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  images: string[];
  name: string;
  phone: string;
  whatsapp?: string;
  createdAt: string;
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
  sort?: "newest" | "price_asc" | "price_desc" | "area_desc";
}

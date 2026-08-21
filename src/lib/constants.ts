import type {
  AmenityKey,
  CityKey,
  Purpose,
  PropertyType,
} from "./types";

export const CITY_KEYS: CityKey[] = [
  "baghdad",
  "erbil",
  "sulaymaniyah",
  "duhok",
  "kirkuk",
  "basra",
  "mosul",
  "najaf",
  "karbala",
  "halabja",
  "ramadi",
  "fallujah",
  "hilla",
  "baqubah",
  "nasiriyah",
  "amarah",
  "samawah",
  "diwaniyah",
  "tikrit",
  "samarra",
  "kut",
  "zakho",
  "chamchamal",
  "ranya",
  "kalar",
  "koya",
  "soran",
  "shaqlawa",
];

/** Default cities shown publicly until the owner customises them in /hq/cities. */
export const DEFAULT_ENABLED_CITIES: CityKey[] = [
  "erbil",
  "sulaymaniyah",
  "kirkuk",
  "chamchamal",
  "duhok",
  "halabja",
];

export const PROPERTY_TYPE_KEYS: PropertyType[] = [
  "house",
  "apartment",
  "villa",
  "land",
  "shop",
  "office",
];

export const PURPOSE_KEYS: Purpose[] = ["sale", "rent"];

export const AMENITY_KEYS: AmenityKey[] = [
  "parking",
  "garden",
  "elevator",
  "furnished",
  "ac",
  "heating",
  "security",
  "pool",
  "generator",
  "balcony",
];

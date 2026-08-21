import type {
  AmenityKey,
  CityKey,
  Purpose,
  PropertyType,
} from "./types";

/*
 * Where the office works, and nowhere else.
 *
 * This ran to twenty-eight cities — Basra, Najaf, Samawah, the lot. Every one
 * of them appeared in the city filter and in the form, and behind all but a
 * few there was nothing to find: a buyer picking Najaf got an empty page, and
 * a seller could file a listing somewhere the office cannot show a house.
 *
 * `CityKey` still names them all and so does `cityNames`, so a listing already
 * filed under one keeps its name on the page. Adding a city back is adding a
 * line here.
 */
export const CITY_KEYS: CityKey[] = ["erbil", "sulaymaniyah", "kirkuk"];

/** Cities shown publicly until the owner narrows them further in /hq/cities. */
export const DEFAULT_ENABLED_CITIES: CityKey[] = ["erbil", "sulaymaniyah", "kirkuk"];

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
  "balcony",
];

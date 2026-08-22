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

/**
 * The top rung on the storeys filter, and the point it stops counting.
 *
 * One, two and three are what somebody is actually choosing between — a
 * bungalow, a house with an upstairs, a house with two. Past that the exact
 * number is not what anyone is deciding on, so the chip means "this many or
 * more" and the listings above it are not split into chips nobody taps.
 */
export const FLOORS_MAX = 4;

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

/**
 * Which room counts a type of property actually has.
 *
 * A plot of land has no bedrooms. Asking anyway is how a listing ends up
 * claiming one — the field is there, somebody fills it, and a card advertises
 * a bedroom on an empty plot.
 *
 * A shop or an office has no bedroom and no kitchen either. But it usually
 * does have a toilet, and it is quite often on two floors, so those two are
 * worth asking about and worth showing.
 *
 * Area is not here because every one of them has an area — it is the one
 * measurement a plot of land is actually sold on.
 */
export interface RoomFields {
  bedrooms: boolean;
  bathrooms: boolean;
  floors: boolean;
  kitchens: boolean;
}

const LIVED_IN: RoomFields = {
  bedrooms: true,
  bathrooms: true,
  floors: true,
  kitchens: true,
};

const COMMERCIAL: RoomFields = {
  bedrooms: false,
  bathrooms: true,
  floors: true,
  kitchens: false,
};

const BARE_LAND: RoomFields = {
  bedrooms: false,
  bathrooms: false,
  floors: false,
  kitchens: false,
};

export const ROOM_FIELDS: Record<PropertyType, RoomFields> = {
  house: LIVED_IN,
  apartment: LIVED_IN,
  villa: LIVED_IN,
  shop: COMMERCIAL,
  office: COMMERCIAL,
  land: BARE_LAND,
};

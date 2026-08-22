import { unstable_cache } from "next/cache";
import type { CityKey, Property } from "./types";
import { SEED_PROPERTIES } from "./data";
import { CITY_KEYS, DEFAULT_ENABLED_CITIES } from "./constants";
import { isFirebaseConfigured } from "./firebase/client";
import {
  fsListProperties,
  fsGetProperty,
  fsGetEnabledCities,
} from "./firebase/db";

/**
 * Read layer for the public site. Uses Firestore when Firebase is configured,
 * otherwise falls back to the local seed so the site always works. If a live
 * Firestore read fails for any reason, we degrade to the seed rather than error.
 */

const visible = (list: Property[]) => list.filter((p) => !p.hidden);

/**
 * The read itself, held for a minute and shared by everyone.
 *
 * Without this, every visitor to the home page or the listings page pulled the
 * whole properties collection out of Firestore. Firestore's free tier allows
 * 50,000 document reads a day, and one visitor costs one read per listing — so
 * the site's capacity fell as its content grew: 100 listings meant 500 visitors
 * a day, 500 listings meant 100. The busier it got, the sooner it stopped.
 *
 * Held for a minute rather than an hour, and the minute is chosen against the
 * seller rather than the visitor: somebody who has just added a house wants to
 * see it, and waiting a minute is tolerable where waiting an hour is alarming.
 *
 * It throws rather than returning the seed when the read fails, so a momentary
 * outage is not what gets stored for the next minute.
 */
const readLive = unstable_cache(
  async (): Promise<Property[]> => {
    const live = await fsListProperties();
    if (!live.length) throw new Error("empty");
    return live;
  },
    ["public-properties"],
    /*
     * An hour, not a minute — with the tag cleared the moment somebody saves.
     *
     * A minute sounded harmless and does not scale: the whole collection is
     * re-read on every refresh, so the daily read count is 1440 × however many
     * listings exist. Firestore's free tier allows 50,000 reads a day, which
     * this crosses at about 35 listings — and the office intends to have far
     * more than 35. At an hour the same limit is not reached until roughly
     * 2,000.
     *
     * The minute was there so an office that had just added a house could see
     * it. That is what the tag is for: the dashboard clears it on save, so the
     * listing appears at once and the interval is only a floor for changes
     * made outside the dashboard.
     */
    { revalidate: 3600, tags: ["properties"] },
  );

async function source(): Promise<Property[]> {
  if (isFirebaseConfigured()) {
    try {
      return await readLive();
    } catch {
      // Empty collection, or unreachable — the seed answers either way.
    }
  }
  return SEED_PROPERTIES;
}

export async function getAllProperties(): Promise<Property[]> {
  return visible(await source());
}

export async function getProperty(id: string): Promise<Property | null> {
  if (isFirebaseConfigured()) {
    try {
      const p = await fsGetProperty(id);
      if (p) return p.hidden ? null : p;
    } catch {
      /* fall through to seed */
    }
  }
  return SEED_PROPERTIES.find((p) => p.id === id && !p.hidden) ?? null;
}

export async function getFeatured(limit = 6): Promise<Property[]> {
  return (await getAllProperties()).filter((p) => p.featured).slice(0, limit);
}

export async function getSimilar(
  property: Property,
  limit = 3,
): Promise<Property[]> {
  return (await getAllProperties())
    .filter(
      (p) =>
        p.id !== property.id &&
        (p.city === property.city || p.type === property.type) &&
        p.purpose === property.purpose,
    )
    .slice(0, limit);
}

/** Cities shown in the public filters. Owner-configured (settings/site) with a
 *  sensible Kurdistan default. Falls back to the default on any error. */
export async function getEnabledCities(): Promise<CityKey[]> {
  const valid = (list: string[]) =>
    list.filter((c): c is CityKey => (CITY_KEYS as string[]).includes(c));

  if (isFirebaseConfigured()) {
    try {
      const saved = await fsGetEnabledCities();
      if (saved && saved.length) {
        const cities = valid(saved);
        if (cities.length) return cities;
      }
    } catch {
      /* fall through to default */
    }
  }
  return DEFAULT_ENABLED_CITIES;
}

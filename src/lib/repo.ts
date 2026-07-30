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

async function source(): Promise<Property[]> {
  if (isFirebaseConfigured()) {
    try {
      const live = await fsListProperties();
      // If the collection is empty (not seeded yet), fall back to the seed.
      if (live.length) return live;
    } catch {
      /* fall through to seed */
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

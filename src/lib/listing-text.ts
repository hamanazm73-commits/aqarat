import type { Locale, Localized, Property, PropertyType, Purpose } from "./types";
import {
  cityNames,
  typeNames,
  purposeNames,
  featureNames,
  type FeatureKey,
} from "./i18n/dictionaries";

/**
 * The title and the description, built rather than typed.
 *
 * They used to be six boxes on the form — a title and a description in each of
 * three languages — and nobody fills in six boxes. What actually happened is
 * that an office wrote one language and the other two stayed empty, so a
 * visitor reading Arabic was shown Kurdish, or nothing.
 *
 * A model was translating them for a while. That cost money per listing, which
 * is not a thing a directory should charge itself for, and it is gone.
 *
 * What is left is the observation that made the whole problem unnecessary:
 * everything a listing actually says is already in its own fields, and every
 * one of those fields is already a key with three translations sitting beside
 * it. The one Hama wrote by hand read "خانوو بۆ فرۆشتن" — a house, for sale.
 * Both of those are fields. So the sentence is assembled from the record, in
 * whichever language is being read, for nothing, and spelled the same way
 * every time because it is written here once rather than typed again per
 * listing.
 */

/** Word order differs, so each language gets its own sentence, not a template. */
function titleIn(
  locale: Locale,
  type: PropertyType,
  purpose: Purpose,
  district: string | undefined,
  city: Property["city"],
): string {
  const t = typeNames[type][locale];
  const p = purposeNames[purpose][locale];
  const c = cityNames[city][locale];
  const where = district ? `${district}، ${c}` : c;
  const whereEn = district ? `${district}, ${c}` : c;

  switch (locale) {
    // "خانوو بۆ فرۆشتن لە عەنکاوا، هەولێر"
    case "ku":
      return `${t} بۆ ${p} لە ${where}`;
    // "منزل للبيع في عنكاوا، أربيل" — the article rides on the purpose word.
    case "ar":
      return `${t} لل${p} في ${where}`;
    // "House for sale in Ankawa, Erbil"
    default:
      return `${t} for ${p.toLowerCase()} in ${whereEn}`;
  }
}

/** The heading a reader sees, in all three languages at once. */
export function buildTitle(
  p: Pick<Property, "type" | "purpose" | "city" | "district">,
): Localized {
  const district = p.district?.ku?.trim() || undefined;
  return {
    ku: titleIn("ku", p.type, p.purpose, district, p.city),
    ar: titleIn("ar", p.type, p.purpose, district, p.city),
    en: titleIn("en", p.type, p.purpose, district, p.city),
  };
}

/**
 * The description, from the features the office ticked.
 *
 * Joined with the list separator each script actually uses: Arabic and Kurdish
 * take the Arabic comma, English the Latin one. An empty list gives an empty
 * string rather than a stray full stop.
 */
export function buildDescription(features: readonly string[] = []): Localized {
  /*
   * A plain loop, not map-then-filter.
   *
   * featureNames is `as const`, so its values are literal string types and a
   * `s is string` predicate is not assignable to them. Pushing into a typed
   * array says the same thing without arguing with the checker, and it drops
   * a key that is no longer in the list — which is what happens to a listing
   * saved before a phrase was renamed.
   */
  const pick = (locale: Locale): string[] => {
    const out: string[] = [];
    for (const f of features) {
      const label = featureNames[f as FeatureKey]?.[locale];
      if (label) out.push(label);
    }
    return out;
  };

  const join = (parts: string[], sep: string) =>
    parts.length ? `${parts.join(sep)}.` : "";

  /*
   * English runs one sentence, so only the first phrase keeps its capital.
   *
   * Each label is written as though it stood alone — "Newly built", "On a main
   * street" — which is right in a list of ticks and wrong strung together:
   * "Newly built, On a main street, Near a school" reads as three fragments.
   * Neither Kurdish nor Arabic has the problem, and none of these phrases
   * begins with a proper noun, so lowering the first letter is safe.
   */
  const asSentence = (parts: string[]) =>
    parts.map((p, i) => (i === 0 ? p : p.charAt(0).toLowerCase() + p.slice(1)));

  return {
    ku: join(pick("ku"), "، "),
    ar: join(pick("ar"), "، "),
    en: join(asSentence(pick("en")), ", "),
  };
}

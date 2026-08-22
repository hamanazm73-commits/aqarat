import {
  LOCALES,
  RTL_LOCALES,
  type Locale,
  type Localized,
  type Property,
  type PropertyType,
  type Purpose,
} from "./types";
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

/**
 * "Kerkük" → "Kerkük'te", "Erbil" → "Erbil'de", "Bağdat" → "Bağdat'ta".
 *
 * Turkish vowel harmony picks the suffix from the last vowel in the word —
 * back vowels take -da/-ta, front vowels -de/-te — and a word ending in a
 * voiceless consonant hardens the d to a t. A place name takes an apostrophe
 * before it.
 *
 * When the place is "district, city" the suffix belongs to the whole phrase,
 * so it is the last vowel of the city that decides.
 */
function locativeTr(place: string): string {
  const vowels = "aeıioöuüAEIİOÖUÜ";
  let last = "";
  for (const ch of place) if (vowels.includes(ch)) last = ch.toLocaleLowerCase("tr");
  const back = "aıou".includes(last);
  const voiceless = "pçtkfhsş".includes(place.slice(-1).toLocaleLowerCase("tr"));
  const suffix = voiceless ? (back ? "ta" : "te") : back ? "da" : "de";
  return `${place}'${suffix}`;
}

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
    /*
     * "Ankawa, Erbil'de satılık ev" — Turkish runs the other way round: place
     * first, then the purpose, and the noun last. The same three words in the
     * English order would read as nonsense, so this is its own sentence rather
     * than a translation of the template.
     *
     * The locative suffix is chosen by vowel harmony, which is why it comes
     * from a function instead of being a fixed "'de".
     */
    case "tk":
      return `${locativeTr(whereEn)} ${p.toLocaleLowerCase("tr")} ${t.toLocaleLowerCase("tr")}`;
    // "House for sale in Ankawa, Erbil"
    default:
      return `${t} for ${p.toLowerCase()} in ${whereEn}`;
  }
}

/**
 * The heading a reader sees, in every language at once.
 *
 * Built from LOCALES rather than listed by hand. Written out one key per
 * language, adding a language meant remembering to come back here — and
 * `Localized` is partial, so forgetting compiles cleanly and shows up as a
 * Kurdish headline on a Turkmen page instead of as an error. That is exactly
 * what happened when Turkmen was added. A loop cannot forget.
 */
export function buildTitle(
  p: Pick<Property, "type" | "purpose" | "city" | "district">,
): Localized {
  const district = p.district?.ku?.trim() || undefined;
  const out: Localized = {};
  for (const l of LOCALES) {
    out[l] = titleIn(l, p.type, p.purpose, district, p.city);
  }
  return out;
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

  /*
   * Built from LOCALES for the same reason the title is: a hand-written list
   * of keys is a list somebody forgets to extend, and a partial Localized
   * makes forgetting compile.
   *
   * The separator follows the script, not the language: Kurdish and Arabic
   * take the Arabic comma, the Latin ones take the Latin comma — and the
   * Latin ones also want the run-on fixed, since each phrase is written as
   * though it stood alone.
   */
  const out: Localized = {};
  for (const l of LOCALES) {
    const parts = pick(l);
    out[l] = RTL_LOCALES.includes(l)
      ? join(parts, "، ")
      : join(asSentence(parts), ", ");
  }
  return out;
}

/**
 * The listing's title, in the language being read — built, not looked up.
 *
 * The stored `title` is a copy of this, written when the listing was saved.
 * That was fine while the set of languages never changed, and stopped being
 * fine the moment Turkmen was added: every listing already in the database had
 * ku, ar and en and no tk, so a visitor who switched to Turkmen got a page of
 * Turkmen furniture with Kurdish headings on it. Backfilling would have fixed
 * those listings and not the next language.
 *
 * Nothing is lost by building it here. There is no hand-written title to
 * respect — the form has no title field, and has not had one since the six
 * boxes were taken out; `buildTitle` is what the save writes. Every part of
 * the sentence is a field on the record, so the sentence can be assembled
 * whenever it is needed, in whatever language is being read.
 *
 * The stored copy stays for anything reading the documents from outside.
 */
export function titleFor(
  p: Pick<Property, "type" | "purpose" | "city" | "district">,
  locale: Locale,
): string {
  return buildTitle(p)[locale] ?? "";
}

/** The description, same reasoning: assembled from the ticks, not stored. */
export function descriptionFor(
  p: Pick<Property, "features">,
  locale: Locale,
): string {
  return buildDescription(p.features)[locale] ?? "";
}

/**
 * Make two spellings of the same word compare equal.
 *
 * The site is searched in four languages by people typing on phone keyboards
 * that disagree with each other. A plain `includes` fails on all of this:
 *
 *   حەمە   vs  حمه    — Kurdish ە against Arabic ه
 *   ياسين  vs  یاسین  — Arabic ي against Persian/Kurdish ی
 *   كوردستان vs کوردستان — Arabic ك against Kurdish ک
 *   "Lay Hama" vs "layhama" — the space
 *   "Hôtel"  vs "hotel"  — the accent
 *
 * None of those is a different name; they are the same name typed on whatever
 * keyboard was to hand. Both sides go through this before they meet.
 */

/** Letters that are the same letter wearing a different keyboard's clothes. */
const SAME_LETTER: Record<string, string> = {
  // Arabic ة ends a word the way ه does.
  "ة": "ه",
  // Arabic ي / ى against Kurdish ی and ێ.
  "ي": "ی",
  "ى": "ی",
  "ێ": "ی",
  // Letters an Arabic keyboard cannot produce at all, so its users type the
  // nearest one it has: ڕ becomes ر, ڵ becomes ل, ڤ becomes ف.
  "ڕ": "ر",
  "ڵ": "ل",
  "ڤ": "ف",
  // Hamza forms — nobody types these consistently.
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  // Arabic ك against Kurdish ک.
  "ك": "ک",
  // Arabic و variants.
  "ؤ": "و",
  "ۆ": "و",
  // ئ is a carrier, not a sound anyone types on purpose.
  "ئ": "ی",
};

/**
 * The comparable form of a string: one case, one spelling per letter, no
 * marks, no spaces or punctuation.
 *
 * Spaces go too, which is what lets "lay hama", "layhama" and "lay  hama" all
 * land in the same place — the gap in a spoken name is not information.
 */
export function normalise(input: string): string {
  let s = input.toLowerCase().normalize("NFKD");

  // Strip combining marks: Latin accents and Arabic tashkil are both here.
  s = s.replace(/[̀-ًͯ-ٰٟۖ-ۭ]/g, "");

  s = s.replace(/[؀-ۿ]/g, (ch) => SAME_LETTER[ch] ?? ch);

  // Everything that is not a letter or a digit. Keeps Arabic-script letters,
  // which \w would throw away. Done before the vowel rules below so that word
  // endings are findable without spaces getting in the way.
  s = s.replace(/[^\p{L}\p{N}]/gu, "");

  /*
   * The Kurdish short vowel, and the Arabic ending that stands in for it.
   *
   * حەمە and حمه are one name. Kurdish writes the vowel with ە; Arabic leaves
   * it out and ends the word in ه. So ە is dropped wherever it appears, and ه
   * is dropped only at the end — in the middle or at the front it is a real
   * consonant, and removing it would turn هۆتێل into something else.
   */
  s = s.replace(/ە/g, "").replace(/ه$/, "");

  return s;
}

/**
 * The consonants of a Latin word, for when the vowels were guessed.
 *
 * "Lay Hama" is a name people have heard rather than read, so `layhma`,
 * `lyhma` and `laihama` all arrive in the search box. Dropping the vowels
 * makes those one string.
 *
 * Latin only. Arabic script already writes short vowels out or not at all, so
 * removing its long vowels would collapse words that genuinely differ.
 */
export function skeleton(input: string): string {
  return normalise(input).replace(/[aeiouy]/g, "");
}

/**
 * Does `haystack` contain `needle`, allowing for how it was spelled?
 *
 * Two passes. The normalised one is the real match. The skeleton is a fallback
 * and only for queries long enough to mean something — on two or three letters
 * it would match nearly everything, which is worse than finding nothing.
 */
export function looseMatch(haystack: string, needle: string): boolean {
  const n = normalise(needle);
  if (!n) return true;
  if (normalise(haystack).includes(n)) return true;

  if (n.length < 4) return false;
  const s = skeleton(needle);
  return s.length >= 3 && skeleton(haystack).includes(s);
}

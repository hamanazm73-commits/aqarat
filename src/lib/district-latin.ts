/**
 * District names in the Latin alphabet.
 *
 * The list of districts is written in Kurdish, which is right — it is what the
 * office picks from and what a Kurdish visitor reads. It was also what an
 * English or Turkmen visitor read, in the middle of an otherwise Latin
 * sentence: "ڕەحیماوا, Kerkük'te satılık ev".
 *
 * So each name gets a Latin form. Three rules, in this order:
 *
 *  1. If the place has a settled English spelling, use it. عەنکاوا is Ankawa,
 *     not Enkawa — a mechanical transliteration would have produced the second
 *     and been wrong in the way that matters, which is that nobody writes it
 *     that way.
 *  2. If the name is an English word that was borrowed into Kurdish, give it
 *     back. دریم سیتی is Dream City; it is what is written on the gate.
 *  3. If the name is a description rather than a name — the city centre, the
 *     bazaar, the industrial zone — translate it, and give Turkmen its own
 *     word instead of handing it the English one.
 *
 * Most names are the same in both Latin languages, so `tk` is only written
 * where it actually differs.
 */

interface Latin {
  en: string;
  /** Only when Turkmen wants a different word from English. */
  tk?: string;
}

const DISTRICT_LATIN: Record<string, Latin> = {
  // — descriptions, not names: translated, and Turkmen gets its own word —
  "ناوەندی شار": { en: "City Centre", tk: "Şehir merkezi" },
  "بازاڕ": { en: "Bazaar", tk: "Çarşı" },
  "بازاڕی سەرەکی": { en: "Main Bazaar", tk: "Ana çarşı" },
  "قەڵا": { en: "Citadel", tk: "Kale" },
  "ناوچەی پیشەسازی": { en: "Industrial Zone", tk: "Sanayi bölgesi" },
  "گەڕەکی سەربەخۆ": { en: "Sarbakho", tk: "Serbeho" },
  "هەولێری نوێ": { en: "New Erbil", tk: "Yeni Erbil" },
  "هەڵەبجەی نوێ": { en: "New Halabja", tk: "Yeni Halepçe" },
  "زانکۆی سەلاحەدین": {
    en: "Salahaddin University",
    tk: "Selahaddin Üniversitesi",
  },

  // — streets and roads —
  "شەقامی زانکۆ": { en: "University Street", tk: "Üniversite caddesi" },
  "شەقامی سالم": { en: "Salim Street", tk: "Salim caddesi" },
  "شەقامی شەقڵاوە": { en: "Shaqlawa Road", tk: "Şaklava yolu" },
  "شەقامی موسڵ": { en: "Mosul Road", tk: "Musul yolu" },
  "شەقامی مەسیف": { en: "Masif Road", tk: "Masif yolu" },
  "شەقامی مەولەوی": { en: "Mawlawi Street", tk: "Mevlevi caddesi" },
  "شەقامی کۆیە": { en: "Koya Road", tk: "Köysancak yolu" },
  "شەقامی کەرکووک": { en: "Kirkuk Road", tk: "Kerkük yolu" },
  "شەقامی گۆران": { en: "Goran Street", tk: "Goran caddesi" },
  "شەقامی ٦٠ مەتری": { en: "60m Street", tk: "60 metrelik cadde" },
  "١٠٠ مەتری": { en: "100m Street", tk: "100 metrelik cadde" },
  "٦٠ مەتری": { en: "60m Street", tk: "60 metrelik cadde" },
  "٣٠ مەتری": { en: "30m Street", tk: "30 metrelik cadde" },
  "ئەربیل ڕۆد": { en: "Erbil Road", tk: "Erbil yolu" },
  "بەغداد ڕۆد": { en: "Baghdad Road", tk: "Bağdat yolu" },

  // — English borrowed into Kurdish: given back as it is written on the gate —
  "دریم سیتی": { en: "Dream City" },
  "ئەمپایەر": { en: "Empire" },
  "ئینگلیش ڤیلیج": { en: "English Village" },
  "ئامریکن ڤیلیج": { en: "American Village", tk: "Amerikan Köyü" },
  "لەبنان ڤیلیج": { en: "Lebanon Village", tk: "Lübnan Köyü" },
  "ئیتاڵی ڤیلیجی یەکەم": { en: "Italian Village 1", tk: "İtalyan Köyü 1" },
  "ئیتاڵی ڤیلیجی دووەم": { en: "Italian Village 2", tk: "İtalyan Köyü 2" },
  "ژیان سیتی": { en: "Zhyan City" },
  "لالاڤ سیتی": { en: "Lalav City" },
  "ئاشتی سیتی": { en: "Ashti City" },
  "بەهار سیتی": { en: "Bahar City" },

  // — names —
  "ئازادی": { en: "Azadi" },
  "ئاشتی": { en: "Ashti" },
  "ئاڵماس": { en: "Almas" },
  "ئیبراهیم پاشا": { en: "Ibrahim Pasha", tk: "İbrahim Paşa" },
  "ئیسکان": { en: "Iskan", tk: "İskan" },
  "ئیماملار": { en: "Imamlar", tk: "İmamlar" },
  "ئەندازیاران": { en: "Andazyaran" },
  "باداوە": { en: "Badawa" },
  "برایەتی": { en: "Brayati" },
  "بنەسڵاوە": { en: "Binaslawa" },
  "بەحرکە": { en: "Bahrka" },
  "بەختیاری": { en: "Bakhtiari" },
  "بەرزنجە": { en: "Barzinja" },
  "بەریادی": { en: "Baryadi" },
  "بەکر": { en: "Bakir" },
  "بەکرەجۆ": { en: "Bakrajo" },
  "تاجیل": { en: "Tajil" },
  "تاسلوجە": { en: "Tasluja" },
  "تسعین": { en: "Tiseen" },
  "توێملە": { en: "Twemla" },
  "تەپە": { en: "Tapa" },
  "تەیراوە": { en: "Tayrawa" },
  "حەسارۆک": { en: "Hasarok" },
  "حەی عەسکەری": { en: "Hay Askari" },
  "حەی نەسر": { en: "Hay Nasr" },
  "حەی وەحدە": { en: "Hay Wahda" },
  "خانزاد": { en: "Khanzad" },
  "خەبات": { en: "Khabat" },
  "دارتو": { en: "Daratu" },
  "دانیال": { en: "Danyal" },
  "دۆمیز": { en: "Domiz" },
  "دەرگەزێن": { en: "Dargazen" },
  "زانکۆ": { en: "Zanko" },
  "زانیاری": { en: "Zanyari" },
  "زەرگەتا": { en: "Zergata" },
  "سەتەقان": { en: "Sataqan" },
  "سەرچنار": { en: "Sarchnar" },
  "سەرەکەریز": { en: "Sarakaris" },
  "سەیران": { en: "Sairan" },
  "شاتەرلوو": { en: "Shaterloo" },
  "شادی": { en: "Shadi" },
  "شارباژێڕ": { en: "Sharbazher" },
  "شۆراو": { en: "Shoraw" },
  "شۆرجە": { en: "Shorja" },
  "شۆرش": { en: "Shorsh" },
  "شێخ محەمەد": { en: "Sheikh Muhammad", tk: "Şeyh Muhammed" },
  "شێخان": { en: "Shekhan", tk: "Şeyhan" },
  "عەرەفە": { en: "Arafa" },
  "عەنکاوا": { en: "Ankawa" },
  "فەرمانبەران": { en: "Farmanbaran" },
  "قوشتەپە": { en: "Qushtapa" },
  "قەڵاوا": { en: "Qalawa" },
  "لالەزار": { en: "Lalazar" },
  "مامۆستایان": { en: "Mamostayan" },
  "ملا عومەر": { en: "Mala Omar" },
  "ملکەندی": { en: "Malkandi" },
  "موسەللا": { en: "Musalla" },
  "مەلیک مەحمود": { en: "Malik Mahmud", tk: "Melik Mahmud" },
  "مەنارە": { en: "Minara" },
  "نازناز": { en: "Naznaz" },
  "نیشتمان": { en: "Nishtiman" },
  "نەورۆز": { en: "Nawroz", tk: "Nevruz" },
  "هەوارە بەرزە": { en: "Hawara Barza" },
  "هەڤاڵان": { en: "Hawalan" },
  "واحد حوزەیران": { en: "Wahid Huzayran" },
  "پزیشکان": { en: "Pizishkan" },
  "پەنجا عەلی": { en: "Panja Ali" },
  "چوارباخ": { en: "Chwarbakh" },
  "چوارچرا": { en: "Chwarchra" },
  "ڕاپەڕین": { en: "Raparin" },
  "ڕزگاری": { en: "Rizgari" },
  "ڕوناکی": { en: "Runaki" },
  "ڕۆژهەڵات": { en: "Rozhhalat" },
  "ڕەحیماوا": { en: "Rahimawa" },
  "ژاڵە": { en: "Zhala" },
  "کانی سکان": { en: "Kani Skan" },
  "کانی گۆما": { en: "Kani Goma" },
  "کوردستان": { en: "Kurdistan", tk: "Kürdistan" },
  "کەسنەزان": { en: "Kasnazan" },
  "گوڵان": { en: "Gulan" },
  "گۆیژە": { en: "Goizha" },
  "گەردی": { en: "Gardi" },
};

/**
 * A district as it should read in this language.
 *
 * Kurdish and Arabic get the name as it was picked — both read the script, and
 * a place name is not translated between them. English and Turkmen get the
 * Latin form.
 *
 * A name that is not in the map falls back to the original rather than
 * disappearing. That happens for a district typed by hand before the picker
 * existed, and a Kurdish word in a Latin sentence is a great deal better than
 * a listing that does not say where it is.
 */
export function districtInLatin(name: string, forTurkmen = false): string {
  const hit = DISTRICT_LATIN[name.trim()];
  if (!hit) return name;
  return forTurkmen ? (hit.tk ?? hit.en) : hit.en;
}

/** Every district the map knows, for the check that it covers the picker. */
export const DISTRICT_LATIN_KEYS = Object.keys(DISTRICT_LATIN);

/**
 * The district for a listing, in the language being read.
 *
 * The record stores it in Kurdish because that is the list the office picks
 * from. Kurdish and Arabic read the script; English and Turkmen get the Latin
 * form. This is the same rule the title builder applies, in the one place the
 * district is printed on its own.
 */
export function districtFor(
  district: { ku?: string } | undefined,
  locale: string,
): string {
  const name = district?.ku?.trim();
  if (!name) return "";
  if (locale === "ku" || locale === "ar") return name;
  return districtInLatin(name, locale === "tk");
}

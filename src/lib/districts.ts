import type { CityKey, Locale } from "./types";

/**
 * Well-known neighbourhoods (گەڕەک / حي) per city. Not exhaustive — a
 * representative set that can be expanded any time. Names are kept in their
 * common local script (Kurdish for Kurdistan cities, Arabic for the rest).
 */
/*
 * Three cities, because three is where the office actually works.
 *
 * The list ran to twenty-eight, most of them nowhere near — Basra, Najaf,
 * Samawah. A city filter offering somewhere with nothing in it is a promise
 * the site cannot keep, and the districts behind those cities were guesses
 * nobody here could check. The rest are in the history if the office ever
 * opens somewhere new.
 */
export const districts: Partial<Record<CityKey, string[]>> = {
  erbil: [
    "ناوەندی شار", "قەڵا", "بازاڕ", "عەنکاوا", "دریم سیتی", "ئەمپایەر",
    "ئیتاڵی ڤیلیجی یەکەم", "ئیتاڵی ڤیلیجی دووەم", "ئینگلیش ڤیلیج",
    "ئامریکن ڤیلیج", "لەبنان ڤیلیج", "ژیان سیتی", "لالاڤ سیتی",
    "١٠٠ مەتری", "٦٠ مەتری", "٣٠ مەتری", "شەقامی زانکۆ", "شەقامی کۆیە",
    "شەقامی مەسیف", "شەقامی کەرکووک", "شەقامی موسڵ", "شەقامی شەقڵاوە",
    "ئەندازیاران", "مامۆستایان", "فەرمانبەران", "پزیشکان", "زانیاری",
    "برایەتی", "شادی", "گوڵان", "نازناز", "سەتەقان", "ڕزگاری", "ڕاپەڕین",
    "ئازادی", "شۆرش", "ڕوناکی", "نیشتمان", "هەڤاڵان", "خەبات", "سەیران",
    "کەسنەزان", "بنەسڵاوە", "بەحرکە", "قوشتەپە", "دارتو", "باداوە",
    "تەیراوە", "حەسارۆک", "مەنارە", "تاجیل", "گەردی", "خانزاد",
    "هەولێری نوێ", "شێخ محەمەد", "دانیال", "ملا عومەر", "کوردستان",
    "زانکۆی سەلاحەدین", "ناوچەی پیشەسازی", "گەڕەکی سەربەخۆ",
  ],
  sulaymaniyah: [
    "ناوەندی شار", "بازاڕی سەرەکی", "شەقامی سالم", "شەقامی گۆران",
    "شەقامی مەولەوی", "سەرچنار", "بەختیاری", "ئاشتی", "شۆرش", "ملکەندی",
    "چوارباخ", "ڕاپەڕین", "کانی گۆما", "زەرگەتا", "بەکرەجۆ", "تاسلوجە",
    "گۆیژە", "ئازادی", "ئیبراهیم پاشا", "مەلیک مەحمود", "کوردستان",
    "ڕزگاری", "سەرەکەریز", "توێملە", "هەوارە بەرزە", "قەڵاوا",
    "فەرمانبەران", "مامۆستایان", "پزیشکان", "ئەندازیاران", "خەبات",
    "شێخان", "کانی سکان", "دەرگەزێن", "هەڵەبجەی نوێ", "چوارچرا",
    "بەرزنجە", "زانکۆ", "شارباژێڕ", "ژاڵە", "نەورۆز", "گوڵان",
    "ئاشتی سیتی", "لالەزار", "بەهار سیتی", "ڕۆژهەڵات",
  ],
  kirkuk: [
    "ناوەندی شار", "قەڵا", "ڕەحیماوا", "شۆرجە", "ئازادی", "ئیسکان",
    "دۆمیز", "شۆراو", "بەریادی", "واحد حوزەیران", "عەرەفە", "تسعین",
    "پەنجا عەلی", "شاتەرلوو", "موسەللا", "ئیماملار", "بەغداد ڕۆد",
    "ئەربیل ڕۆد", "شەقامی ٦٠ مەتری", "ڕاپەڕین", "کوردستان", "نەورۆز",
    "خەبات", "فەرمانبەران", "مامۆستایان", "تەپە", "ئاڵماس", "بەکر",
    "حەی عەسکەری", "حەی نەسر", "حەی وەحدە",
  ],
};

/** Labels for the hero city/district filter, per language. */
export const searchLabels: Record<
  Locale,
  { chooseCity: string; chooseDistrict: string; allDistricts: string; district: string }
> = {
  ku: {
    chooseCity: "شار هەڵبژێرە",
    chooseDistrict: "گەڕەک هەڵبژێرە",
    allDistricts: "هەموو گەڕەکەکان",
    district: "گەڕەک",
  },
  en: {
    chooseCity: "Choose city",
    chooseDistrict: "Choose district",
    allDistricts: "All districts",
    district: "District",
  },
  ar: {
    chooseCity: "اختر المدينة",
    chooseDistrict: "اختر الحي",
    allDistricts: "كل الأحياء",
    district: "الحي",
  },
  tk: {
    chooseCity: "Şehir seç",
    chooseDistrict: "Mahalle seç",
    allDistricts: "Bütün mahalleler",
    district: "Mahalle",
  },
};

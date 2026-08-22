import { getAllProperties, getEnabledCities } from "@/lib/repo";
import { HomeContent } from "@/components/home-content";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/lib/types";

export const revalidate = 30;

/** The homepage as it should read to someone searching in this language. */
const COPY: Record<"en" | "ar" | "tk", { title: string; description: string }> = {
  en: {
    title: "Houses, apartments and land for sale and rent in Kurdistan",
    description:
      "Browse houses, apartments, villas, shops and land for sale or rent across Erbil, Sulaymaniyah, Duhok and every other city in the Kurdistan Region of Iraq.",
  },
  ar: {
    title: "منازل وشقق وأراضٍ للبيع والإيجار في كردستان",
    description:
      "تصفح المنازل والشقق والفلل والمحلات والأراضي للبيع أو الإيجار في أربيل والسليمانية ودهوك وجميع مدن إقليم كردستان العراق.",
  },
  tk: {
    title: "Kürdistan'da satılık ve kiralık ev, daire ve arsa",
    description:
      "Erbil, Süleymaniye, Kerkük ve Irak Kürdistan Bölgesi'nin bütün şehirlerinde satılık ve kiralık ev, daire, villa, dükkan ve arsa.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const copy = COPY[lang as "en" | "ar" | "tk"] ?? COPY.en;
  return {
    title: copy.title,
    description: copy.description,
    alternates: alternatesFor(lang as Locale, "/"),
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: alternatesFor(lang as Locale, "/").canonical,
      locale: lang === "ar" ? "ar_IQ" : "en_US",
    },
    // Otherwise these inherit the root layout's Kurdish copy, and an English
    // page shared on X announces itself in Kurdish.
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
    },
  };
}

export default async function LocalisedHomePage() {
  const [all, cities] = await Promise.all([
    getAllProperties(),
    getEnabledCities(),
  ]);

  return (
    <HomeContent
      properties={all}
      counts={{ listings: all.length, cities: cities.length }}
      cities={cities}
    />
  );
}

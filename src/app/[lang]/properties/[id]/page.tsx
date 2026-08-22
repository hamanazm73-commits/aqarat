import { notFound } from "next/navigation";
import { titleFor, descriptionFor } from "@/lib/listing-text";
import { getProperty, getSimilar } from "@/lib/repo";
import { PropertyDetail } from "@/components/property-detail";
import { listingJsonLd } from "@/lib/listing-seo";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/lib/types";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const p = await getProperty(id);
  if (!p) return { title: "Not found" };

  const locale = lang as Locale;
  const title = titleFor(p, locale);
  const description = descriptionFor(p, locale).slice(0, 200);
  const path = `/properties/${encodeURIComponent(p.id)}`;

  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: {
      title,
      description,
      url: alternatesFor(locale, path).canonical,
      type: "article",
      images: p.images?.length ? [p.images[0]] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: p.images?.length ? [p.images[0]] : undefined,
    },
  };
}

export default async function LocalisedPropertyPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();

  const similar = await getSimilar(p, 3);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingJsonLd(p, lang as Locale)),
        }}
      />
      <PropertyDetail p={p} similar={similar} />
    </>
  );
}

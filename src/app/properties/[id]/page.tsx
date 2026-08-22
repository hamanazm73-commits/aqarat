import { notFound } from "next/navigation";
import { titleFor, descriptionFor } from "@/lib/listing-text";
import { getProperty, getSimilar } from "@/lib/repo";
import { SEED_PROPERTIES } from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { PropertyDetail } from "@/components/property-detail";
import { listingJsonLd, pickLocalized } from "@/lib/listing-seo";
import { alternatesFor } from "@/lib/seo";

// Keep listing pages fresh (ISR) so edits show up without a rebuild.
export const revalidate = 30;

// Prerender the seed listings only in seed mode. With Firebase, listings are
// dynamic and rendered on demand.
export function generateStaticParams() {
  if (isFirebaseConfigured()) return [];
  return SEED_PROPERTIES.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) return { title: "Not found" };

  const title = titleFor(p, "ku");
  const description = descriptionFor(p, "ku").slice(0, 200);
  const path = `/properties/${encodeURIComponent(p.id)}`;

  return {
    title,
    description,
    alternates: alternatesFor("ku", path),
    // Without this, a shared listing is a bare blue link. The first photo is
    // the reason anyone clicks a house.
    openGraph: {
      title,
      description,
      url: alternatesFor("ku", path).canonical,
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

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();

  const similar = await getSimilar(p, 3);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingJsonLd(p, "ku")),
        }}
      />
      <PropertyDetail p={p} similar={similar} />
    </>
  );
}

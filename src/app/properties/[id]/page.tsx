import { notFound } from "next/navigation";
import { getProperty, getSimilar } from "@/lib/repo";
import { SEED_PROPERTIES } from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { PropertyDetail } from "@/components/property-detail";

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
  return { title: p.title.en, description: p.description.en };
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
  return <PropertyDetail p={p} similar={similar} />;
}

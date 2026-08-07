import { notFound } from "next/navigation";


/** Only these two are prefixed — Kurdish is served from the root. */
const SUPPORTED = ["en", "ar"] as const;

export function generateStaticParams() {
  return SUPPORTED.map((lang) => ({ lang }));
}

/**
 * The English and Arabic wing of the site.
 *
 * The pages below render the same components as the Kurdish ones; the
 * language comes from the URL, which `I18nProvider` reads. This segment's job
 * is to reject anything that is not a language — without it, `/anything`
 * would render the homepage in Kurdish and quietly become a duplicate of it.
 */
export default async function LangLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!(SUPPORTED as readonly string[]).includes(lang)) notFound();

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <>
      {/*
        <html lang> is written by the root layout, which cannot see this
        segment. Correcting it here — before paint, rather than in an effect —
        keeps the served HTML honest about what language it is in, which is
        what a crawler reads.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(
            lang,
          )};document.documentElement.dir=${JSON.stringify(dir)};`,
        }}
      />
      {children}
    </>
  );
}



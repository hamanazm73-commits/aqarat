import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ComingSoonBanner } from "@/components/coming-soon-banner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { Analytics } from "@vercel/analytics/next";

// Same pairing as the sister site: Jakarta for Latin, Naskh for Kurdish and
// Arabic — the typography is half of what makes the two look related.
const latin = Plus_Jakarta_Sans({
  variable: "--font-latin",
  subsets: ["latin"],
});

const arabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://homes.layhama.com";

const DESCRIPTION =
  "خانوو، شوقە، ڤێلا و زەوی بۆ فرۆشتن و کرێ لە هەموو شارەکانی هەرێمی کوردستان.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "نووسینگەی لای حەمە | Lay Hama Homes — Real Estate",
    template: "%s | نووسینگەی لای حەمە",
  },
  description: DESCRIPTION,
  keywords: [
    "خانووبەرە", "عەقارات", "خانوو", "شوقە", "کرێ", "فرۆشتن",
    "real estate", "Kurdistan", "Erbil", "Sulaymaniyah", "property", "for sale", "for rent",
  ],
  openGraph: {
    title: "نووسینگەی لای حەمە | Lay Hama Homes — Real Estate",
    description: DESCRIPTION,
    url: SITE_URL,
    // In Kurdish, because this is the name a search result is headed with
    // and Kurdish is what someone looking for it types.
    siteName: "نووسینگەی لای حەمە",
    type: "website",
    locale: "ckb_IQ",
  },
  twitter: {
    card: "summary_large_image",
    title: "نووسینگەی لای حەمە | Lay Hama Homes",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ku"
      dir="rtl"
      suppressHydrationWarning
      className={`${latin.variable} ${arabic.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ComingSoonBanner />
          <SiteHeader />
          <main className="flex-1">{children}</main>
        {/*
          How many people actually come.
          Counts a page view and nothing else — no cookie, no identifier, no
          profile, so there is nothing to put a consent banner in front of.
          Turn it on per project at Vercel > Analytics; until then this sends
          nothing and costs nothing.
        */}
        <Analytics />
          <SiteFooter />
          <FloatingWhatsApp />
        </Providers>
      </body>
    </html>
  );
}

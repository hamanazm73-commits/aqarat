import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";

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
  process.env.NEXT_PUBLIC_SITE_URL || "https://aqarat-iraq.vercel.app";

const DESCRIPTION =
  "خانوو، شوقە، ڤێلا و زەوی بۆ فرۆشتن و کرێ لە هەموو شارەکانی هەرێمی کوردستان.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "نووسینگای کوردستان | Kurdistan Estates — Real Estate",
    template: "%s | Kurdistan Estates",
  },
  description: DESCRIPTION,
  keywords: [
    "خانووبەرە", "عەقارات", "خانوو", "شوقە", "کرێ", "فرۆشتن",
    "real estate", "Kurdistan", "Erbil", "Sulaymaniyah", "property", "for sale", "for rent",
  ],
  openGraph: {
    title: "نووسینگای کوردستان | Kurdistan Estates — Real Estate",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Kurdistan Estates",
    type: "website",
    locale: "ckb_IQ",
  },
  twitter: {
    card: "summary_large_image",
    title: "نووسینگای کوردستان | Kurdistan Estates",
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
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <FloatingWhatsApp />
        </Providers>
      </body>
    </html>
  );
}

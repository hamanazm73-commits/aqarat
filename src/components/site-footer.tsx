"use client";

import Link from "next/link";
import { Phone, Mail, ShieldCheck, BedDouble } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BrandMark } from "./brand-mark";

const PHONE = "+964 750 220 2191";
// On the real domain, not the old Vercel subdomain — mail sent to a domain
// nobody owns is silently lost, and this address is printed on every page.
const EMAIL = "info@homeskurdistan.com";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    /*
      Trimmed down, not stripped out.

      Everything here still earns its place; what was taking the room was the
      chrome around it — 96px of clearance above, 56px of padding inside, and
      a 32px tinted tile behind every contact icon. The tiles in particular
      made two phone numbers look like a control panel.
    */
    <footer className="mt-16 border-t bg-primary text-primary-foreground">
      {/* gold accent line — the seam the sister site uses too */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 font-bold">
            <BrandMark className="size-7" />
            {t.brand}
          </div>
          <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            {t.footer.tagline}
          </p>
        </div>

        <div>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gold">
            {t.footer.quickLinks}
          </h3>
          {/* Still 14px apart on a phone: 4px between stacked links is a
              mis-tap, and making the footer shorter is not worth a wrong tap. */}
          <ul className="space-y-3.5 sm:space-y-2 text-sm text-primary-foreground/80">
            {[
              { href: "/", label: t.nav.home },
              { href: "/properties", label: t.nav.properties },
              { href: "/properties?purpose=sale", label: t.nav.sale },
              { href: "/properties?purpose=rent", label: t.nav.rent },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-block transition-colors hover:translate-x-0.5 hover:text-gold rtl:hover:-translate-x-0.5"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gold">
            {t.footer.contact}
          </h3>
          {/* The icons sit next to the text rather than inside a tinted tile.
              The tile was the single biggest thing in the footer and it was
              decoration — a phone number does not need a button behind it. */}
          <ul className="space-y-3.5 sm:space-y-2 text-sm text-primary-foreground/80">
            <li>
              <a
                href={`tel:${PHONE.replace(/\s/g, "")}`}
                dir="ltr"
                className="inline-flex items-center gap-2 transition-colors hover:text-gold"
              >
                <Phone className="size-4 shrink-0 text-gold/70" />
                {PHONE}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${EMAIL}`}
                dir="ltr"
                className="inline-flex items-center gap-2 transition-colors hover:text-gold"
              >
                <Mail className="size-4 shrink-0 text-gold/70" />
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2.5 border-t border-primary-foreground/10 py-3.5 text-center text-xs text-primary-foreground/60 sm:flex-row sm:gap-3">
        <span>
          © {new Date().getFullYear()} {t.brand}. {t.footer.rights}.
        </span>
        <span className="hidden sm:inline">·</span>
        {/* The hotels half of the same business. Each site was invisible to the
            other, and to Google, which reported no referring page for either. */}
        <a
          href="https://hotels.layhama.com"
          className="inline-flex items-center gap-1 transition-colors hover:text-gold"
        >
          <BedDouble className="size-3.5" /> {t.footer.sister}
        </a>
        <span className="hidden sm:inline">·</span>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 transition-colors hover:text-gold"
        >
          <ShieldCheck className="size-3.5" /> {t.nav.admin}
        </Link>
      </div>
    </footer>
  );
}

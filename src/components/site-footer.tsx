"use client";

import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BrandMark } from "./brand-mark";

const PHONE = "+964 750 220 2191";
const EMAIL = "info@aqarat-iraq.com";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-24 border-t bg-primary text-primary-foreground">
      {/* gold accent line — the seam the sister site uses too */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-lg font-bold">
            <BrandMark className="size-9" />
            {t.brand}
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            {t.footer.tagline}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gold">
            {t.footer.quickLinks}
          </h3>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            {[
              { href: "/", label: t.nav.home },
              { href: "/properties", label: t.nav.properties },
              { href: "/properties?purpose=sale", label: t.nav.sale },
              { href: "/properties?purpose=rent", label: t.nav.rent },
              { href: "/submit", label: t.nav.submit },
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
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gold">
            {t.footer.contact}
          </h3>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li>
              <a
                href={`tel:${PHONE.replace(/\s/g, "")}`}
                dir="ltr"
                className="inline-flex items-center gap-2.5 transition-colors hover:text-gold"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary-foreground/10">
                  <Phone className="size-4" />
                </span>
                {PHONE}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${EMAIL}`}
                dir="ltr"
                className="inline-flex items-center gap-2.5 transition-colors hover:text-gold"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary-foreground/10">
                  <Mail className="size-4" />
                </span>
                {EMAIL}
              </a>
            </li>
            <li className="inline-flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-primary-foreground/10">
                <MapPin className="size-4" />
              </span>
              {t.brand}
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-1.5 border-t border-primary-foreground/10 py-5 text-center text-xs text-primary-foreground/60 sm:flex-row sm:gap-3">
        <span>
          © {new Date().getFullYear()} {t.brand}. {t.footer.rights}.
        </span>
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

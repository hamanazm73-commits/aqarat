"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ShieldCheck, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Transparent over the hero, then a blurred bar once the page moves — the
  // headline gets the full canvas without the chrome fighting it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/properties", label: t.nav.properties },
    { href: "/properties?purpose=sale", label: t.nav.sale },
    { href: "/properties?purpose=rent", label: t.nav.rent },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 shadow-sm backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      {/* Locked to one direction so the brand stays put when the language
          changes — otherwise the whole bar mirrors mid-session. */}
      <div
        dir="rtl"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
          <BrandMark className="size-9" />
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">
            {t.brand}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/submit"
            className="hidden items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-bold text-gold-foreground shadow-sm transition hover:bg-gold/90 active:scale-95 sm:inline-flex"
          >
            <Plus className="size-4" />
            {t.nav.submit}
          </Link>
          <Link
            href="/login"
            aria-label={t.nav.admin}
            title={t.nav.admin}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground/80 transition-colors hover:bg-muted"
          >
            <ShieldCheck className="size-5" />
          </Link>
          <button
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-border/70 bg-background/95 backdrop-blur-xl transition-all md:hidden",
          open ? "max-h-80 border-t" : "max-h-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/submit"
            onClick={() => setOpen(false)}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2.5 text-sm font-bold text-gold-foreground"
          >
            <Plus className="size-4" />
            {t.nav.submit}
          </Link>
        </nav>
      </div>
    </header>
  );
}

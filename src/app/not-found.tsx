"use client";

import Link from "next/link";
import { Home, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Building2 className="h-8 w-8" />
      </span>
      <p className="mt-6 text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-2 text-xl font-semibold">{t.filters.noResults}</h1>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105"
      >
        <Home className="h-4 w-4" /> {t.nav.home}
      </Link>
    </div>
  );
}

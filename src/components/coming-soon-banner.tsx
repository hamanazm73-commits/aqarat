"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Hammer } from "lucide-react";
import { fsGetComingSoon } from "@/lib/firebase/db";
import { useI18n } from "@/lib/i18n/context";

/**
 * A gold strip across the top while the office is still filling the site in.
 *
 * The hotels site has flown one of these since it opened. It does the job an
 * empty page cannot: a visitor who lands on three listings reads either "this
 * is all they have" or "they are still adding" — and only one of those brings
 * them back.
 *
 * Off unless the office turns it on, in `/hq`. Read once on mount rather than
 * rendered on the server, because the setting lives in Firestore and a page
 * that waits on a read before painting is a slower page for every visitor on
 * every visit, in exchange for a strip that is usually not there.
 */
export function ComingSoonBanner() {
  const { t, locale } = useI18n();
  const [show, setShow] = useState(false);
  const pathname = usePathname() || "";

  // Not over the dashboard. The office knows; it is the one that switched it
  // on, and the strip would only push its own work down the screen.
  const onAdmin = pathname.startsWith("/hq") || pathname.startsWith("/access");

  useEffect(() => {
    if (onAdmin) return;
    let live = true;
    fsGetComingSoon()
      .then((on) => {
        if (live) setShow(on);
      })
      .catch(() => {
        // A failed read is not a reason to shout. Stay quiet.
      });
    return () => {
      live = false;
    };
  }, [onAdmin]);

  if (!show || onAdmin) return null;

  return (
    <div
      role="status"
      // Not sticky. The hotels site pins its strip and pays for it with a
      // custom property the header has to offset by; here the header is
      // already sticky, so a strip that scrolls away leaves it flush.
      className="relative overflow-hidden bg-gradient-to-r from-gold via-amber-300 to-gold text-[#122b45]"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center">
        <Hammer className="size-4 shrink-0" aria-hidden />
        <p className="text-xs font-semibold leading-snug sm:text-sm">
          <span className="font-extrabold">{t.soon.title}</span>{" "}
          <span className="font-medium">{t.soon.text}</span>
        </p>
      </div>
      {/* Latin numerals read left-to-right inside a right-to-left line; this
          strip has none, but the lang attribute keeps a screen reader in the
          right language when the rest of the page switches. */}
      <span className="sr-only" lang={locale} />
    </div>
  );
}

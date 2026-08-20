"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, TriangleAlert } from "lucide-react";
import { getFirebase } from "@/lib/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { fsGetSellerLink } from "@/lib/firebase/db";

/**
 * Redeem a seller's link.
 *
 * There is nothing to fill in. The unguessable part of the URL is the key to
 * an account created for this person, so opening the page signs them in and
 * hands them their own listings — no password to be given out, remembered,
 * or chosen badly.
 *
 * A property owner meets this page once, on a phone, probably from WhatsApp.
 * It says one thing at a time and gets out of the way.
 */
export default function AccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  // React runs effects twice in development; redeeming twice would sign in
  // twice and race the redirect.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const fb = getFirebase();
        if (!fb) throw new Error("not configured");
        const link = await fsGetSellerLink(token);
        if (!link?.email || !link.password) throw new Error("no such link");
        await signInWithEmailAndPassword(fb.auth, link.email, link.password);
        router.replace("/hq");
      } catch {
        setFailed(true);
      }
    })();
  }, [token, router]);

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        {failed ? (
          <>
            <TriangleAlert className="mx-auto size-10 text-danger" />
            <h1 className="mt-4 text-lg font-semibold">ئەم لینکە کار ناکات</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              لەوانەیە بەتەواوی کۆپی نەکرابێت، یان هەڵگیرابێتەوە. داوای
              لینکێکی نوێ بکە.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm text-primary hover:underline"
            >
              ← ماڵپەڕ
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              چوونەژوورەوە…
            </p>
          </>
        )}
      </div>
    </div>
  );
}

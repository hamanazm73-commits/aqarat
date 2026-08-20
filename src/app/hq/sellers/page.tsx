"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth";
import {
  fsListSellers,
  fsSaveSellerLink,
  fsRevokeSeller,
  fsSetRole,
  type RoleDoc,
} from "@/lib/firebase/db";

/**
 * The people who may add their own listings.
 *
 * Each gets one link. Handing it over is the whole of granting access: no
 * account to be created by them, no password to be sent separately, nothing
 * for them to choose badly. Taking the row away takes the access away.
 */

/** Accounts live under a domain that receives no mail, so a synthetic login
    is never mistaken for a real person's address. */
const LINK_DOMAIN = "link.layhama.com";

/** 32 bytes, base64url. Long enough that the link is the password. */
function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Create the throwaway Firebase account over the public REST endpoint.
    firebase-admin is not used anywhere in this project, and signing up this
    way does not disturb the administrator's own session. */
async function createAccount(email: string, password: string): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Firebase is not configured");
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // returnSecureToken: false — creating the account must not sign the
      // browser in as it. The admin stays who they are.
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body.error?.message || "could not create the account");
  }
}

export default function SellersPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<RoleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<{ name: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fsListSellers());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const who = name.trim();
    if (!who) return;
    setBusy(true);
    setError(null);
    setFresh(null);
    try {
      const token = randomToken();
      // Local part is random too: the address is an identifier, not a name,
      // and two sellers called the same thing must not collide.
      const email = `s-${randomToken(9).toLowerCase()}@${LINK_DOMAIN}`;
      const password = randomToken(24);

      await createAccount(email, password);
      const createdAt = new Date().toISOString();
      await fsSetRole(email, {
        role: "seller",
        enabled: true,
        name: who,
        // Firestore rejects undefined, and an empty string reads as a phone
        // number that is blank rather than one that was never given.
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        token,
      });
      await fsSaveSellerLink(token, {
        email,
        password,
        name: who,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        createdAt,
      });

      setFresh({ name: who, url: `${window.location.origin}/access/${token}` });
      setName("");
      setPhone("");
      await load();
    } catch (err) {
      setError((err as Error).message || "دروستکردنی لینک سەرکەوتوو نەبوو");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(r: RoleDoc) {
    if (!confirm(`لابردنی دەستپێگەیشتنی «${r.name ?? r.email}»؟`)) return;
    try {
      await fsRevokeSeller(r.email, r.token ?? "");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">خاوەن موڵکەکان</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          بۆ هەرکەسێک لینکێک دروست بکە و بۆی بنێرە. لینکەکە خۆی وشەی نهێنییە —
          دەیکاتەوە و ڕاستەوخۆ دەچێتە ژوورەوە، تەنها موڵکەکانی خۆی دەبینێت.
        </p>
      </div>

      <form
        onSubmit={create}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold">ناو *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="ئەحمەد محەمەد"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold">تەلەفۆن</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="+964 750 000 0000"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          دروستکردنی لینک
        </button>
      </form>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {/* Shown once, right after creating it. The password behind this link is
          stored, so it can be looked up again from the row below — but the
          moment it is made is the moment it gets sent, so it is put here
          ready to copy rather than made to be hunted for. */}
      {fresh && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold">لینکی {fresh.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs">
              {fresh.url}
            </code>
            <button
              onClick={() => copy(fresh.url)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "کۆپی کرا" : "کۆپی"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            ئەم لینکە بۆی بنێرە. هەرکەسێک هەیبێت دەتوانێت بچێتە ژوورەوە.
          </p>
        </div>
      )}

      {loading ? (
        <Loader2 className="mx-auto size-6 animate-spin text-primary" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          هێشتا هیچ خاوەن موڵکێک نییە.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.email}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name ?? r.email}</p>
                {r.phone && (
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {r.phone}
                  </p>
                )}
              </div>
              {r.token && (
                <button
                  onClick={() => copy(`${window.location.origin}/access/${r.token}`)}
                  title="کۆپیکردنی لینک"
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-border"
                >
                  <Link2 className="size-4" />
                </button>
              )}
              <button
                onClick={() => revoke(r)}
                title="لابردنی دەستپێگەیشتن"
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

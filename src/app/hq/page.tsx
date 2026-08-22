"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import type { Property } from "@/lib/types";
import {
  fsListProperties,
  fsDeleteProperty,
  fsListPropertiesBySeller,
  fsListRoles,
  type RoleDoc,
} from "@/lib/firebase/db";
import { cityNames, typeNames } from "@/lib/i18n/dictionaries";
import { formatIQDCompact } from "@/lib/format";
import { useAuth } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { ComingSoonCard } from "@/components/admin/coming-soon-card";

/** Sentinels for the office filter; neither can collide with an address. */
const ALL = "__all__";
const NO_OFFICE = "__none__";

export default function AdminListingsPage() {
  const { isSeller, user } = useAuth();
  const [items, setItems] = useState<Property[] | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  /*
   * Which office’s listings to show, and how many each has.
   *
   * The office charges per listing and had no way to see what any one of them
   * had actually put up — the page was one undivided list, and counting a
   * particular office meant reading every row. NO_OFFICE covers the listings
   * the office typed in itself, which have no seller on them.
   */
  const [offices, setOffices] = useState<RoleDoc[]>([]);
  const [office, setOffice] = useState<string>(ALL);

  /*
   * Pulled out of the callback rather than reached for inside it.
   *
   * With `user?.email` used in the body, React Compiler infers the dependency
   * as the whole `user` object while the list says `user?.email`, decides the
   * two do not agree, and gives up optimizing this component entirely. Naming
   * the value once makes the inferred dependency and the written one the same.
   */
  const email = user?.email;

  const load = useCallback(async () => {
    // A seller sees the rows carrying their own address and nothing else.
    // This is a convenience, not the boundary — the rules in firestore.rules
    // are what actually stop one seller touching another's listing.
    setItems(
      isSeller && email
        ? await fsListPropertiesBySeller(email)
        : await fsListProperties(),
    );
  }, [isSeller, email]);

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [load]);

  useEffect(() => {
    // A seller has no filter to draw — they only ever see their own rows.
    if (isSeller) return;
    fsListRoles()
      .then((r) => setOffices(r.filter((x) => x.role === "seller")))
      .catch(() => setOffices([]));
  }, [isSeller]);

  /** How many listings each address has, keyed by address; "" for none. */
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of items ?? []) {
      const key = p.sellerEmail?.toLowerCase() ?? "";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [items]);

  const shown = (items ?? []).filter((p) => {
    if (office === ALL) return true;
    if (office === NO_OFFICE) return !p.sellerEmail;
    return (p.sellerEmail ?? "").toLowerCase() === office;
  });

  /** The office name where one was recorded, the address where it was not. */
  const officeLabel = (email?: string) => {
    if (!email) return null;
    const found = offices.find((o) => o.email.toLowerCase() === email.toLowerCase());
    return found?.name?.trim() || email;
  };

  async function onDelete(p: Property) {
    if (!confirm(`سڕینەوەی «${p.title.ku}»؟`)) return;
    setWorking(p.id);
    try {
      await fsDeleteProperty(p.id);
      await load();
    } finally {
      setWorking(null);
    }
  }


  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">خانووبەرەکان</h1>
        <Link href="/hq/new">
          <Button size="sm"><Plus className="h-4 w-4" /> نوێ</Button>
        </Link>
      </div>

      {/* Not for sellers. It is the whole site it switches, not their
          listings, and a seller who found it would be turning a banner on
          over somebody else’s shop. */}
      {!isSeller && (
        <div className="mb-6">
          <ComingSoonCard />
        </div>
      )}

      {!isSeller && items !== null && items.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
            <KeyRound className="size-4 shrink-0 text-muted-foreground" />
            <select
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="h-10 cursor-pointer bg-transparent text-sm outline-none"
            >
              <option value={ALL}>هەموو نووسینگەکان ({items.length})</option>
              {/* Every office, including the ones with nothing up — that an
                  office has published none is the thing worth seeing. */}
              {offices.map((o) => (
                <option key={o.email} value={o.email.toLowerCase()}>
                  {(o.name?.trim() || o.email) + " (" + (counts.get(o.email.toLowerCase()) ?? 0) + ")"}
                </option>
              ))}
              {(counts.get("") ?? 0) > 0 && (
                <option value={NO_OFFICE}>
                  {"لەلایەن نووسینگەی سەرەکییەوە (" + counts.get("") + ")"}
                </option>
              )}
            </select>
          </label>
          {office !== ALL && (
            <span className="text-sm text-muted-foreground">
              {shown.length} موڵک
            </span>
          )}
        </div>
      )}

      {items === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        // The button that stood here imported twelve invented listings. The
        // list it copied from is empty now, so it offered to import nothing.
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {isSeller ? "هێشتا هیچ موڵکێکت زیاد نەکردووە." : "هیچ خانووبەرەیەک نییە."}
          </p>
          <Link href="/hq/new">
            <Button className="mt-5"><Plus className="h-4 w-4" /> زیادکردنی یەکەم</Button>
          </Link>
        </div>
      ) : shown.length === 0 ? (
        /* The filter found nothing, which is not the same as there being
           nothing — an office that has published none is a real answer and
           the page should say so rather than show an empty space. */
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          ئەم نووسینگەیە هێشتا هیچ موڵکێکی بڵاو نەکردووەتەوە.
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={p.images[0]} alt="" fill sizes="80px" className="object-cover" unoptimized />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-medium">
                  {p.hidden && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  {p.title.ku}
                  {p.featured && <span title="تایبەت">⭐</span>}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {typeNames[p.type].ku} · {cityNames[p.city].ku} · {formatIQDCompact(p.priceIQD, "ku")}
                  {/* Whose listing it is, on the row rather than only in the
                      filter — otherwise telling them apart means switching the
                      filter back and forth. */}
                  {!isSeller && officeLabel(p.sellerEmail) && (
                    <span className="text-primary"> · {officeLabel(p.sellerEmail)}</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link href={`/properties/${p.id}`} target="_blank" className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-muted" title="بینین">
                  <Eye className="h-4 w-4" />
                </Link>
                <Link href={`/hq/${p.id}/edit`} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-muted" title="دەستکاری">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button onClick={() => onDelete(p)} disabled={working === p.id} className="flex h-9 w-9 items-center justify-center rounded-lg text-danger hover:bg-muted cursor-pointer" title="سڕینەوە">
                  {working === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

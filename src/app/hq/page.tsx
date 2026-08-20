"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Property } from "@/lib/types";
import {
  fsListProperties,
  fsDeleteProperty,
  fsListPropertiesBySeller,
} from "@/lib/firebase/db";
import { cityNames, typeNames } from "@/lib/i18n/dictionaries";
import { formatIQDCompact } from "@/lib/format";
import { useAuth } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";

export default function AdminListingsPage() {
  const { isSeller, user } = useAuth();
  const [items, setItems] = useState<Property[] | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    // A seller sees the rows carrying their own address and nothing else.
    // This is a convenience, not the boundary — the rules in firestore.rules
    // are what actually stop one seller touching another's listing.
    setItems(
      isSeller && user?.email
        ? await fsListPropertiesBySeller(user.email)
        : await fsListProperties(),
    );
  }, [isSeller, user?.email]);

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [load]);

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
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
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

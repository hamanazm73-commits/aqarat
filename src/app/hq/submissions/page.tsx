"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Check, Trash2, Phone } from "lucide-react";
import type { Submission } from "@/lib/types";
import {
  fsListSubmissions,
  fsApproveSubmission,
  fsDeleteSubmission,
} from "@/lib/firebase/db";
import { cityNames, typeNames, purposeNames } from "@/lib/i18n/dictionaries";
import { formatIQDCompact, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function SubmissionsPage() {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await fsListSubmissions());
  }, []);

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [load]);

  async function approve(s: Submission) {
    if (!s.id) return;
    setWorking(s.id);
    try {
      await fsApproveSubmission(s);
      await load();
    } finally {
      setWorking(null);
    }
  }

  async function reject(s: Submission) {
    if (!s.id || !confirm(`ڕەتکردنەوەی «${s.title}»؟`)) return;
    setWorking(s.id);
    try {
      await fsDeleteSubmission(s.id);
      await load();
    } finally {
      setWorking(null);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">ناردنەکان</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        موڵکەکانی ناردراو لەلایەن خەڵکەوە. پەسەندیان بکە بۆ بڵاوکردنەوە.
      </p>

      {items === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          هیچ ناردنێک نییە.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {purposeNames[s.purpose].ku} · {typeNames[s.type].ku} ·{" "}
                    {cityNames[s.city].ku}
                    {s.district ? ` · ${s.district}` : ""} ·{" "}
                    {formatIQDCompact(s.priceIQD, "ku")}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{s.name}</span>
                    <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-foreground">
                      <Phone className="h-3.5 w-3.5" /> {s.phone}
                    </a>
                    <span className="text-xs">{formatDate(s.createdAt, "ku")}</span>
                  </p>
                  {s.description && (
                    <p className="mt-2 text-sm">{s.description}</p>
                  )}
                  {s.images.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.images.length} وێنە
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => approve(s)} disabled={working === s.id}>
                    {working === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    پەسەندکردن
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject(s)}
                    disabled={working === s.id}
                  >
                    <Trash2 className="h-4 w-4" /> ڕەتکردنەوە
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

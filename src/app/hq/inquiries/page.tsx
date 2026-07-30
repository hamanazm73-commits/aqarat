"use client";

import { useEffect, useState } from "react";
import { Loader2, Phone, MessageSquare } from "lucide-react";
import type { Inquiry } from "@/lib/types";
import { fsListInquiries } from "@/lib/firebase/db";
import { formatDate } from "@/lib/format";

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[] | null>(null);

  useEffect(() => {
    fsListInquiries()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">داواکارییەکان</h1>

      {items === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          هیچ داواکارییەک نییە.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <div key={q.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{q.name}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDate(q.createdAt, "ku")}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <a href={`tel:${q.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <Phone className="h-3.5 w-3.5" /> {q.phone}
                </a>
                <span className="text-xs">#{q.propertyId}</span>
              </div>
              {q.message && (
                <p className="mt-2 flex items-start gap-1.5 text-sm">
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {q.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

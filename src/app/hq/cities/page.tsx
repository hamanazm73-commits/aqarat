"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { CITY_KEYS, DEFAULT_ENABLED_CITIES } from "@/lib/constants";
import { cityNames } from "@/lib/i18n/dictionaries";
import { fsGetEnabledCities, fsSetEnabledCities } from "@/lib/firebase/db";
import type { CityKey } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function CitiesPage() {
  const [enabled, setEnabled] = useState<CityKey[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fsGetEnabledCities()
      .then((c) =>
        setEnabled(
          c && c.length ? (c as CityKey[]) : DEFAULT_ENABLED_CITIES,
        ),
      )
      .catch(() => setEnabled(DEFAULT_ENABLED_CITIES));
  }, []);

  function toggle(c: CityKey) {
    setSaved(false);
    setEnabled((prev) => {
      const cur = prev ?? [];
      return cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
    });
  }

  async function save() {
    if (!enabled) return;
    setSaving(true);
    try {
      await fsSetEnabledCities(enabled);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!enabled)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold">شارەکان</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        هەڵبژێرە کام شار لە ماڵپەڕی گشتی (فلتەرەکان) دەربکەوێت. ئەوانەی
        هەڵنەبژێردراون لە ماڵپەڕدا نادەرکەون.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CITY_KEYS.map((c) => {
          const on = enabled.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                on
                  ? "border-primary bg-primary/10 font-medium text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cityNames[c].ku}
              {on && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          پاشەکەوتکردن
        </Button>
        {saved && <span className="text-sm text-primary">✓ پاشەکەوتکرا</span>}
        <span className="text-sm text-muted-foreground">
          {enabled.length} شار چالاکە
        </span>
      </div>
    </div>
  );
}

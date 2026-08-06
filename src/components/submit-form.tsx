"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { CityKey } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import { cityNames } from "@/lib/i18n/dictionaries";
import { CITY_KEYS } from "@/lib/constants";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { fsCreateSubmission } from "@/lib/firebase/db";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "success" | "error";

/**
 * Three questions: who you are, how to reach you, where the property is.
 *
 * It used to ask for fifteen — title, description, purpose, type, district,
 * price, area, bedrooms, bathrooms, image URLs — which is a form nobody fills
 * in on a phone. Everything else is quicker to settle in the phone call this
 * form exists to start, and an admin enters it properly afterwards.
 */
export function SubmitForm() {
  const { t, tr } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const [f, setF] = useState({
    name: "",
    phone: "",
    city: "erbil" as CityKey,
  });

  function up<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      if (!isFirebaseConfigured()) throw new Error("not configured");
      await fsCreateSubmission({
        name: f.name.trim(),
        phone: f.phone.trim(),
        city: f.city,
        createdAt: new Date().toISOString(),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-10 text-center">
        <CheckCircle2 className="h-14 w-14 text-primary" />
        <p className="text-lg font-medium">{t.submit.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5">
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-5">
        <Field label={t.submit.yourName}>
          <input
            required
            className="input"
            value={f.name}
            onChange={(e) => up("name", e.target.value)}
          />
        </Field>
        <Field label={t.submit.phone}>
          <input
            required
            type="tel"
            dir="ltr"
            className="input text-start"
            value={f.phone}
            onChange={(e) => up("phone", e.target.value)}
          />
        </Field>
        <Field label={t.filters.city}>
          <select
            className="input"
            value={f.city}
            onChange={(e) => up("city", e.target.value as CityKey)}
          >
            {CITY_KEYS.map((c) => (
              <option key={c} value={c}>
                {tr(cityNames[c])}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {status === "error" && <p className="text-sm text-danger">{t.submit.error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t.submit.sending}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> {t.submit.send}
          </>
        )}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

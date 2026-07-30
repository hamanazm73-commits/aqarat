"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Plus, X, Send } from "lucide-react";
import type { CityKey, PropertyType, Purpose } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import {
  cityNames,
  purposeNames,
  typeNames,
} from "@/lib/i18n/dictionaries";
import { CITY_KEYS, PROPERTY_TYPE_KEYS } from "@/lib/constants";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { fsCreateSubmission } from "@/lib/firebase/db";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "success" | "error";

export function SubmitForm() {
  const { t, tr } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const [imageUrl, setImageUrl] = useState("");
  const [f, setF] = useState({
    title: "",
    description: "",
    purpose: "sale" as Purpose,
    type: "house" as PropertyType,
    city: "erbil" as CityKey,
    district: "",
    priceIQD: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    images: [] as string[],
    name: "",
    phone: "",
    whatsapp: "",
  });

  function up<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function addImage() {
    const u = imageUrl.trim();
    if (u) {
      up("images", [...f.images, u]);
      setImageUrl("");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      if (!isFirebaseConfigured()) throw new Error("not configured");
      await fsCreateSubmission({
        title: f.title.trim(),
        purpose: f.purpose,
        type: f.type,
        city: f.city,
        priceIQD: Number(f.priceIQD) || 0,
        area: Number(f.area) || 0,
        images: f.images,
        name: f.name.trim(),
        phone: f.phone.trim(),
        createdAt: new Date().toISOString(),
        ...(f.description.trim() ? { description: f.description.trim() } : {}),
        ...(f.district.trim() ? { district: f.district.trim() } : {}),
        ...(f.bedrooms ? { bedrooms: Number(f.bedrooms) } : {}),
        ...(f.bathrooms ? { bathrooms: Number(f.bathrooms) } : {}),
        ...(f.whatsapp.trim() ? { whatsapp: f.whatsapp.trim() } : {}),
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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium">{t.submit.propTitle}</span>
          <input required className="input" value={f.title} onChange={(e) => up("title", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.submit.desc}</span>
          <textarea rows={3} className="input h-auto resize-none py-2" value={f.description} onChange={(e) => up("description", e.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
        <Field label={t.filters.purpose}>
          <select className="input" value={f.purpose} onChange={(e) => up("purpose", e.target.value as Purpose)}>
            <option value="sale">{tr(purposeNames.sale)}</option>
            <option value="rent">{tr(purposeNames.rent)}</option>
          </select>
        </Field>
        <Field label={t.filters.type}>
          <select className="input" value={f.type} onChange={(e) => up("type", e.target.value as PropertyType)}>
            {PROPERTY_TYPE_KEYS.map((tk) => <option key={tk} value={tk}>{tr(typeNames[tk])}</option>)}
          </select>
        </Field>
        <Field label={t.filters.city}>
          <select className="input" value={f.city} onChange={(e) => up("city", e.target.value as CityKey)}>
            {CITY_KEYS.map((c) => <option key={c} value={c}>{tr(cityNames[c])}</option>)}
          </select>
        </Field>
        <Field label={t.submit.district}>
          <input className="input" value={f.district} onChange={(e) => up("district", e.target.value)} />
        </Field>
        <Field label={t.submit.price}>
          <input required type="number" className="input" value={f.priceIQD} onChange={(e) => up("priceIQD", e.target.value)} />
        </Field>
        <Field label={t.submit.area}>
          <input required type="number" className="input" value={f.area} onChange={(e) => up("area", e.target.value)} />
        </Field>
        <Field label={t.submit.beds}>
          <input type="number" className="input" value={f.bedrooms} onChange={(e) => up("bedrooms", e.target.value)} />
        </Field>
        <Field label={t.submit.baths}>
          <input type="number" className="input" value={f.bathrooms} onChange={(e) => up("bathrooms", e.target.value)} />
        </Field>
      </div>

      {/* Images by URL */}
      <div className="rounded-2xl border border-border bg-card p-5">
        {f.images.length > 0 && (
          <div className="mb-3 space-y-2">
            {f.images.map((v, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{v}</span>
                <button type="button" onClick={() => up("images", f.images.filter((_, idx) => idx !== i))} className="shrink-0 text-danger cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input className="input" placeholder={t.submit.imagesHint} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <Button type="button" variant="outline" onClick={addImage}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Contact */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
        <Field label={t.submit.yourName}>
          <input required className="input" value={f.name} onChange={(e) => up("name", e.target.value)} />
        </Field>
        <Field label={t.submit.phone}>
          <input required type="tel" className="input" value={f.phone} onChange={(e) => up("phone", e.target.value)} />
        </Field>
        <Field label={t.submit.whatsapp}>
          <input className="input" value={f.whatsapp} onChange={(e) => up("whatsapp", e.target.value)} />
        </Field>
      </div>

      {status === "error" && <p className="text-sm text-danger">{t.submit.error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> {t.submit.sending}</>
        ) : (
          <><Send className="h-4 w-4" /> {t.submit.send}</>
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

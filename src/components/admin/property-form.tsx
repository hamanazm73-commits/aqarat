"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Upload, X, Plus, Video } from "lucide-react";
import type { AmenityKey, Property, PropertyType, Purpose } from "@/lib/types";
import {
  fsCreateProperty,
  fsUpdateProperty,
  fsUploadImage,
} from "@/lib/firebase/db";
import {
  amenityNames,
  cityNames,
  purposeNames,
  typeNames,
} from "@/lib/i18n/dictionaries";
import { AMENITY_KEYS, CITY_KEYS, PROPERTY_TYPE_KEYS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type Draft = Omit<Property, "id" | "createdAt"> & { createdAt?: string };

const empty: Draft = {
  title: { ku: "", en: "", ar: "" },
  description: { ku: "", en: "", ar: "" },
  purpose: "sale",
  type: "house",
  city: "erbil",
  priceIQD: 0,
  area: 0,
  images: [],
  videos: [],
  amenities: [],
  agent: { name: "", phone: "" },
};

export function PropertyForm({ initial }: { initial?: Property }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [d, setD] = useState<Draft>(() =>
    initial ? { ...initial, videos: initial.videos ?? [] } : { ...empty },
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function up<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((p) => ({ ...p, [k]: v }));
  }

  function toggleAmenity(a: AmenityKey) {
    setD((p) => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter((x) => x !== a)
        : [...p.amenities, a],
    }));
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await fsUploadImage(f));
      setD((p) => ({ ...p, images: [...p.images, ...urls] }));
    } catch {
      setError("ئەپلۆدی وێنە سەرکەوتوو نەبوو / Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function addUrl() {
    const u = urlInput.trim();
    if (u) {
      setD((p) => ({ ...p, images: [...p.images, u] }));
      setUrlInput("");
    }
  }

  function removeImage(i: number) {
    setD((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
  }

  function addVideo() {
    const u = videoInput.trim();
    if (u) {
      setD((p) => ({ ...p, videos: [...(p.videos ?? []), u] }));
      setVideoInput("");
    }
  }

  function removeVideo(i: number) {
    setD((p) => ({
      ...p,
      videos: (p.videos ?? []).filter((_, idx) => idx !== i),
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const clean: Omit<Property, "id"> = {
        ...d,
        priceIQD: Number(d.priceIQD) || 0,
        area: Number(d.area) || 0,
        images: d.images.length ? d.images : [`/img/${d.type}.svg`],
        createdAt: d.createdAt ?? new Date().toISOString(),
        // strip empty discount
        ...(d.discount && d.discount.active
          ? { discount: { active: true, oldPriceIQD: Number(d.discount.oldPriceIQD) || 0 } }
          : { discount: undefined }),
      };
      // Firestore rejects undefined — drop optional empties.
      const payload = JSON.parse(JSON.stringify(clean)) as Omit<Property, "id">;

      if (editing && initial) await fsUpdateProperty(initial.id, payload);
      else await fsCreateProperty(payload);
      router.push("/hq");
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "هەڵە ڕوویدا / Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold">
        {editing ? "دەستکاریکردنی خانووبەرە" : "خانووبەرەی نوێ"}
      </h1>

      {/* Titles */}
      <Card title="ناونیشان (Title)">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="کوردی"><input className="input" value={d.title.ku} onChange={(e) => up("title", { ...d.title, ku: e.target.value })} required /></Field>
          <Field label="English"><input className="input" value={d.title.en} onChange={(e) => up("title", { ...d.title, en: e.target.value })} required /></Field>
          <Field label="عربي"><input className="input" value={d.title.ar} onChange={(e) => up("title", { ...d.title, ar: e.target.value })} required /></Field>
        </div>
      </Card>

      {/* Descriptions */}
      <Card title="وەسف (Description)">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="کوردی"><textarea rows={3} className="input h-auto py-2 resize-none" value={d.description.ku} onChange={(e) => up("description", { ...d.description, ku: e.target.value })} /></Field>
          <Field label="English"><textarea rows={3} className="input h-auto py-2 resize-none" value={d.description.en} onChange={(e) => up("description", { ...d.description, en: e.target.value })} /></Field>
          <Field label="عربي"><textarea rows={3} className="input h-auto py-2 resize-none" value={d.description.ar} onChange={(e) => up("description", { ...d.description, ar: e.target.value })} /></Field>
        </div>
      </Card>

      {/* Core */}
      <Card title="زانیاری سەرەکی">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="مەبەست">
            <select className="input" value={d.purpose} onChange={(e) => up("purpose", e.target.value as Purpose)}>
              {(["sale", "rent"] as Purpose[]).map((p) => <option key={p} value={p}>{purposeNames[p].ku}</option>)}
            </select>
          </Field>
          <Field label="جۆر">
            <select className="input" value={d.type} onChange={(e) => up("type", e.target.value as PropertyType)}>
              {PROPERTY_TYPE_KEYS.map((t) => <option key={t} value={t}>{typeNames[t].ku}</option>)}
            </select>
          </Field>
          <Field label="شار">
            <select className="input" value={d.city} onChange={(e) => up("city", e.target.value as Property["city"])}>
              {CITY_KEYS.map((c) => <option key={c} value={c}>{cityNames[c].ku}</option>)}
            </select>
          </Field>
          <Field label="نرخ (IQD)"><input type="number" className="input" value={d.priceIQD || ""} onChange={(e) => up("priceIQD", Number(e.target.value))} required /></Field>
          <Field label="ڕووبەر (م²)"><input type="number" className="input" value={d.area || ""} onChange={(e) => up("area", Number(e.target.value))} required /></Field>
          <Field label="ژووری نوستن"><input type="number" className="input" value={d.bedrooms ?? ""} onChange={(e) => up("bedrooms", e.target.value ? Number(e.target.value) : undefined)} /></Field>
          <Field label="حەمام"><input type="number" className="input" value={d.bathrooms ?? ""} onChange={(e) => up("bathrooms", e.target.value ? Number(e.target.value) : undefined)} /></Field>
          <Field label="ناوچە (کوردی)"><input className="input" value={d.district?.ku ?? ""} onChange={(e) => up("district", { ku: e.target.value, en: d.district?.en ?? "", ar: d.district?.ar ?? "" })} /></Field>
          <Field label="ناوچە (English)"><input className="input" value={d.district?.en ?? ""} onChange={(e) => up("district", { ku: d.district?.ku ?? "", en: e.target.value, ar: d.district?.ar ?? "" })} /></Field>
        </div>
      </Card>

      {/* Amenities */}
      <Card title="خزمەتگوزارییەکان">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AMENITY_KEYS.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={d.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
              {amenityNames[a].ku}
            </label>
          ))}
        </div>
      </Card>

      {/* Images */}
      <Card title="وێنەکان">
        <div className="flex flex-wrap gap-3">
          {d.images.map((src, i) => (
            <div key={i} className="relative h-24 w-32 overflow-hidden rounded-lg border border-border">
              <Image src={src} alt="" fill sizes="128px" className="object-cover" unoptimized />
              <button type="button" onClick={() => removeImage(i)} className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            ئەپلۆد
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input" placeholder="یان بەستەری وێنە زیادبکە (URL)" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
          <Button type="button" variant="outline" onClick={addUrl}><Plus className="h-4 w-4" /></Button>
        </div>
      </Card>

      {/* Videos */}
      <Card title="ڤیدیۆکان">
        <p className="mb-3 text-xs text-muted-foreground">
          بەستەری ڤیدیۆ زیادبکە — YouTube یان بەستەری ڕاستەوخۆی MP4. بۆ ڤیدیۆی
          گەورە YouTube باشترین و ئاسانترینە (بێ تێچوون).
        </p>
        {(d.videos ?? []).length > 0 && (
          <div className="mb-3 space-y-2">
            {(d.videos ?? []).map((v, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                <Video className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{v}</span>
                <button type="button" onClick={() => removeVideo(i)} className="shrink-0 text-danger cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="بەستەری ڤیدیۆ (بۆ نموونە https://youtu.be/...)"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={addVideo}><Plus className="h-4 w-4" /></Button>
        </div>
      </Card>

      {/* Flags + discount + agent */}
      <Card title="ئاڵا و بریکار">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.featured} onChange={(e) => up("featured", e.target.checked)} /> ⭐ تایبەت</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.recommended} onChange={(e) => up("recommended", e.target.checked)} /> 👍 پێشنیارکراو</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.hidden} onChange={(e) => up("hidden", e.target.checked)} /> 🚫 شاردنەوە</label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.discount?.active} onChange={(e) => up("discount", { active: e.target.checked, oldPriceIQD: d.discount?.oldPriceIQD ?? 0 })} /> داشکاندن</label>
          {d.discount?.active && (
            <Field label="نرخی کۆن (IQD)"><input type="number" className="input" value={d.discount.oldPriceIQD || ""} onChange={(e) => up("discount", { active: true, oldPriceIQD: Number(e.target.value) })} /></Field>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="ناوی بریکار"><input className="input" value={d.agent.name} onChange={(e) => up("agent", { ...d.agent, name: e.target.value })} required /></Field>
          <Field label="مۆبایل"><input className="input" value={d.agent.phone} onChange={(e) => up("agent", { ...d.agent, phone: e.target.value })} required /></Field>
          <Field label="واتساپ"><input className="input" value={d.agent.whatsapp ?? ""} onChange={(e) => up("agent", { ...d.agent, whatsapp: e.target.value })} /></Field>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={busy || uploading}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {editing ? "پاشەکەوتکردن" : "زیادکردن"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/hq")}>
          پاشگەزبوونەوە
        </Button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </div>
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

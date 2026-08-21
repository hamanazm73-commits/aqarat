"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Upload, X, Plus, Video, MapPin } from "lucide-react";
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
import { compressImage } from "@/lib/compress-image";
import { useAuth } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { coordsFromMapsUrl } from "@/lib/maps";

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
  const { isSeller, user } = useAuth();
  const router = useRouter();
  const editing = Boolean(initial);
  const [d, setD] = useState<Draft>(() =>
    initial ? { ...initial, videos: initial.videos ?? [] } : { ...empty },
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [mapInput, setMapInput] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** how many of this batch have landed, so the wait shows movement */
  const [progress, setProgress] = useState({ done: 0, total: 0 });

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
      /*
       * Several at once, in order.
       *
       * This used to be a plain for-loop with two awaits in it, so ten photos
       * meant ten shrinks and ten uploads strictly one after another — and
       * nearly all of that time is spent waiting on the network, not using it.
       * Sending a few in parallel overlaps the waiting and turns a minute into
       * a handful of seconds on the same connection.
       *
       * Three at a time, not all of them: a phone on mobile data that opens
       * twelve uploads at once gets slower, not faster, and a mid-range
       * handset decoding twelve photos at once runs out of memory. Three keeps
       * the link busy without either.
       *
       * The results are written back by index, so the order the seller picked
       * them in is the order they appear — which matters, because the first
       * one is the cover.
       */
      const chosen = Array.from(files);
      const urls: string[] = new Array(chosen.length);
      let next = 0;
      setProgress({ done: 0, total: chosen.length });

      async function worker() {
        for (;;) {
          const i = next++;
          if (i >= chosen.length) return;
          // Shrink before it leaves the phone. A 4MB camera photo becomes
          // about 150KB, which the seller waits far less to send and every
          // buyer afterwards pays far less to receive. If it can't be
          // compressed — an odd format, no canvas — the original goes up
          // rather than nothing.
          const ready = await compressImage(chosen[i]).catch(() => chosen[i]);
          urls[i] = await fsUploadImage(ready);
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(3, chosen.length) }, worker),
      );
      setD((p) => ({ ...p, images: [...p.images, ...urls.filter(Boolean)] }));
    } catch {
      setError("ئەپلۆدی وێنە سەرکەوتوو نەبوو / Image upload failed.");
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  /**
   * The same picker as the photographs, pointed at video.
   *
   * `fsUploadImage` is only named for images — it takes a File and hands back
   * a URL, which is as true of a clip from the camera roll. On a phone this
   * opens the gallery, which is where the video already is.
   */
  async function onVideoFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadingVideo(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await fsUploadImage(f));
      setD((p) => ({ ...p, videos: [...(p.videos ?? []), ...urls] }));
    } catch {
      setError("ئەپلۆدی ڤیدیۆ سەرکەوتوو نەبوو / Video upload failed.");
    } finally {
      setUploadingVideo(false);
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

  function applyMapUrl() {
    const c = coordsFromMapsUrl(mapInput);
    if (!c) {
      setMapError(
        "نەتوانرا شوێنەکە دەربهێنرێت. بەستەری تەواوی Google Maps دابنێ (نەک بەستەری کورت).",
      );
      return;
    }
    setMapError(null);
    setMapInput("");
    setD((p) => ({ ...p, lat: c.lat, lng: c.lng }));
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
      // Stamped once, on creation. An admin editing a seller's listing must
      // not quietly take it off them, and a seller must not be able to put
      // their name on somebody else's.
      if (!editing && isSeller && user?.email) {
        clean.sellerEmail = user.email.toLowerCase();
      }

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
          <Field label="نهۆم"><input type="number" className="input" value={d.floors ?? ""} onChange={(e) => up("floors", e.target.value ? Number(e.target.value) : undefined)} /></Field>
          <Field label="چێشتخانە"><input type="number" className="input" value={d.kitchens ?? ""} onChange={(e) => up("kitchens", e.target.value ? Number(e.target.value) : undefined)} /></Field>
          <Field label="ناوچە (کوردی)"><input className="input" value={d.district?.ku ?? ""} onChange={(e) => up("district", { ku: e.target.value, en: d.district?.en ?? "", ar: d.district?.ar ?? "" })} /></Field>
          <Field label="ناوچە (English)"><input className="input" value={d.district?.en ?? ""} onChange={(e) => up("district", { ku: d.district?.ku ?? "", en: e.target.value, ar: d.district?.ar ?? "" })} /></Field>
        </div>
      </Card>

      {/* Location */}
      <Card title="شوێن لەسەر نەخشە">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          لە Google Maps شوێنەکە دیاری بکە، «Share» لێبدە و بەستەرەکە لێرە
          دابنێ — خۆی شوێنەکە دەردەهێنێت. بەستەری کورتی <span dir="ltr">goo.gl</span>{" "}
          کار ناکات، بەستەری تەواو بەکاربهێنە.
        </p>
        <div className="flex gap-2">
          <input
            className="input"
            dir="ltr"
            placeholder="https://www.google.com/maps/place/..."
            value={mapInput}
            onChange={(e) => setMapInput(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={applyMapUrl}>
            <MapPin className="h-4 w-4" />
          </Button>
        </div>

        {mapError && <p className="mt-2 text-xs text-danger">{mapError}</p>}

        {typeof d.lat === "number" && typeof d.lng === "number" && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span dir="ltr" className="min-w-0 flex-1 truncate">
                {d.lat}, {d.lng}
              </span>
              <button
                type="button"
                onClick={() => setD((p) => ({ ...p, lat: undefined, lng: undefined }))}
                className="shrink-0 text-danger cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Shown back rather than trusted: a pin in the wrong street is
                easy to paste and impossible to notice from two numbers. */}
            <iframe
              title="map"
              src={`https://maps.google.com/maps?q=${d.lat},${d.lng}&z=15&output=embed`}
              className="h-56 w-full rounded-lg border border-border"
              loading="lazy"
            />
          </div>
        )}
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
            {/* A spinner alone says "wait" and nothing else. On ten photos over
                mobile data the seller needs to know it is moving and roughly
                how much is left, or the honest answer to "is it stuck?" is
                that they cannot tell. */}
            {uploading && progress.total > 1
              ? `${progress.done}/${progress.total}`
              : "ئەپلۆد"}
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
          ڤیدیۆ لە گەلەری مۆبایلەکەتەوە باربکە، یان بەستەرێک دابنێ — YouTube
          یان MP4. بۆ ڤیدیۆی زۆر گەورە، YouTube هێشتا خێراترە و تێچوونی نییە.
        </p>

        {/* The same control the photographs use, pointed at video: on a phone
            this opens the gallery, which is where the clip already is. */}
        <label className="mb-3 flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted">
          {uploadingVideo ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          ڤیدیۆ باربکە
          <input
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => onVideoFiles(e.target.files)}
          />
        </label>
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
        <Button type="submit" disabled={busy || uploading || uploadingVideo}>
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Upload, X, Plus, Video, MapPin, Check } from "lucide-react";
import type { AmenityKey, Locale, Property, PropertyType, Purpose } from "@/lib/types";
import {
  fsCreateProperty,
  fsUpdateProperty,
  fsUploadImage,
  fsUploadVideo,
} from "@/lib/firebase/db";
import {
  amenityNames,
  cityNames,
  purposeNames,
  typeNames,
  featureNames,
  FEATURE_KEYS,
} from "@/lib/i18n/dictionaries";
import { AMENITY_KEYS, CITY_KEYS, PROPERTY_TYPE_KEYS } from "@/lib/constants";
import { buildTitle, buildDescription } from "@/lib/listing-text";
import { compressImage } from "@/lib/compress-image";
import { useAuth } from "@/lib/firebase/auth";
import { getFirebase } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { coordsFromMapsUrl } from "@/lib/maps";
import { districts } from "@/lib/districts";

/** The value that means "not on the list", never a real district name. */
const OTHER_DISTRICT = "__other__";

/*
 * A district name is a proper noun, so it is the same in all three.
 *
 * The record wants ku/ar/en and translating a place name would be wrong
 * anyway — عەنکاوا is Ankawa is عنكاوا, written how the people there write it.
 * Storing one string three times keeps every reader that already does
 * tr(district) working, without teaching any of them a second shape.
 */
function sameInAll(name: string) {
  return { ku: name, ar: name, en: name, tk: name };
}

type Draft = Omit<Property, "id" | "createdAt"> & { createdAt?: string };

const empty: Draft = {
  title: { ku: "", en: "", ar: "", tk: "" },
  description: { ku: "", en: "", ar: "", tk: "" },
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
  const { isSeller, isAdmin, user } = useAuth();
  const router = useRouter();
  const editing = Boolean(initial);
  const [d, setD] = useState<Draft>(() => {
    if (!initial) return { ...empty };
    /*
     * A district that is not one of that city’s own is dropped on the way in.
     *
     * Before the list existed sellers typed whatever they liked, and what
     * survives is things like "ra7imawa" — Rahimawa, in Latin letters, which
     * matches nothing a buyer searching in Kurdish will ever type. Carrying it
     * into the list as an option only offers it again. Left empty, the seller
     * picks the real one, and the listing is findable afterwards.
     */
    const known = districts[initial.city] ?? [];
    // `?? ""` because a Localized is partial now that there are four languages
    // and listings predate the fourth. An absent Kurdish name is not in the
    // list either way, so it lands in the same branch as an unknown one.
    const district =
      initial.district && known.includes(initial.district.ku ?? "")
        ? initial.district
        : undefined;
    return { ...initial, district, videos: initial.videos ?? [] };
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mapInput, setMapInput] = useState("");
  const [resolving, setResolving] = useState(false);
  /*
   * The district is picked, not typed.
   *
   * Sellers were typing it by hand, in two boxes, in two languages, and the
   * same neighbourhood arrived spelled four ways — which the search then reads
   * as four places.
   *
   * This stays a list even when the listing already holds a name the list does
   * not have: that name is added to the top of the options instead of dropping
   * the seller into a text box. Opening the form typed, which is what it did
   * before, meant an old listing looked like the list had never been built.
   * Typing is still there behind "a different district" for the genuinely
   * missing ones — the list is not complete and never will be.
   */
  const [typedDistrict, setTypedDistrict] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** how many of this batch have landed, so the wait shows movement */
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  /*
   * How far the clip has got, 0–100.
   *
   * The photo counter cannot carry this. Ten photos tick over one by one, but
   * a video is a single item that can take two minutes on mobile data — the
   * counter would read 0/1 the whole way and then jump, which is
   * indistinguishable from stuck. Null when no video is moving.
   */
  const [vidPct, setVidPct] = useState<number | null>(null);

  /*
   * What the listing will read as, recomputed as the form is filled in.
   *
   * Shown rather than described: an office that can see the sentence it is
   * about to save does not need to be told how it was assembled.
   */
  const preview = {
    title: buildTitle(d),
    description: buildDescription(d.features),
  };

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
      /*
       * Video is the office's to add, not the seller's.
       *
       * The picker below asks for images only when a seller is looking at it,
       * but "images only" is a hint the file dialog offers, not a rule it
       * enforces — anyone who switches it to "all files" can still hand us a
       * clip. Dropping them here is the difference between a filter and a
       * wish.
       *
       * Why the office keeps it: a photograph is about 150KB once shrunk and a
       * clip off a phone is a couple of hundred megabytes, so one video costs
       * the room of two hundred photographs — out of a bucket all three sites
       * share.
       */
      const chosen = Array.from(files).filter(
        (f) => isAdmin || !f.type.startsWith("video/"),
      );
      if (!chosen.length) {
        setError(
          "تەنها وێنە دەتوانیت زیاد بکەیت. بۆ ڤیدیۆ پەیوەندی بە بەڕێوەبەرەوە بکە.",
        );
        return;
      }
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
          /*
           * Two roads, because the two are not the same size.
           *
           * A photograph is redrawn to about 150KB first and goes through
           * /api/upload. A clip cannot be shrunk in a browser — that needs a
           * transcoder, not a canvas — and is far past what a function body
           * may carry, so it is signed and sent to the bucket directly.
           */
          const f = chosen[i];
          if (f.type.startsWith("video/")) {
            urls[i] = await fsUploadVideo(f, (fraction) =>
              setVidPct(Math.round(fraction * 100)),
            );
            setVidPct(null);
          } else {
            const ready = await compressImage(f).catch(() => f);
            urls[i] = await fsUploadImage(ready);
          }
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(3, chosen.length) }, worker),
      );
      // One picker, but they are not the same thing once they land: the first
      // photograph is the cover, and a clip has no business being it.
      const pickedImages = urls.filter((u, i) => u && !chosen[i].type.startsWith("video/"));
      const pickedVideos = urls.filter((u, i) => u && chosen[i].type.startsWith("video/"));
      setD((p) => ({
        ...p,
        images: [...p.images, ...pickedImages],
        videos: [...(p.videos ?? []), ...pickedVideos],
      }));
    } catch (err) {
      // Each of these is something the seller can actually do something
      // about, so each says which it was rather than "upload failed".
      const m = err instanceof Error ? err.message : "";
      setError(
        m.includes("not-allowed")
          ? "ڤیدیۆ تەنها لەلایەن بەڕێوەبەرەوە زیاد دەکرێت."
          : m.includes("too-large")
            ? "فایلەکە زۆر گەورەیە."
            : m.includes("cors")
              ? "ڤیدیۆکە نەگەیشتە کۆگاکە — ڕێکخستنی CORS پێویستە."
              : "ئەپلۆد سەرکەوتوو نەبوو / Upload failed.",
      );
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
      setVidPct(null);
    }
  }


  /**
   * A link to a photograph, and only that.
   *
   * It used to take a YouTube address as well. A listing sending a buyer off to
   * somebody else's site is not what this is for, and on the page there was no
   * telling whether the video was the property's own or a link — so video is
   * uploaded here or it is not on the listing.
   */
  function addUrl() {
    const u = urlInput.trim();
    if (!u) return;
    setD((p) => ({ ...p, images: [...p.images, u] }));
    setUrlInput("");
  }

  function removeImage(i: number) {
    setD((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
  }

  /*
   * Read the pin out of whatever was pasted.
   *
   * A short maps.app.goo.gl link is what the share button on a phone gives
   * out, and it holds no coordinates — the form used to say "paste the long
   * one instead", which nobody could, because the app does not offer it. So
   * when the text alone yields nothing, the server follows the link and the
   * long address it lands on is read instead.
   */
  async function applyMapUrl() {
    const raw = mapInput.trim();
    if (!raw) return;

    let c = coordsFromMapsUrl(raw);
    if (!c) {
      setResolving(true);
      try {
        const res = await fetch("/api/resolve-map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: raw }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (res.ok && body.url) {
          c = coordsFromMapsUrl(body.url);
        } else if (body.error === "dead-link") {
          setMapError("ئەم بەستەرە کار ناکات. لە Google Maps بەستەرێکی نوێ Share بکە.");
          return;
        }
      } catch {
        /* offline or blocked — handled by the message below */
      } finally {
        setResolving(false);
      }
    }

    if (!c) {
      setMapError(
        "نەتوانرا شوێنەکە دەربهێنرێت. لە Google Maps شوێنەکە دیاری بکە، Share لێبدە و بەستەرەکە هەروەک خۆی لێرە دابنێ.",
      );
      return;
    }
    setMapError(null);
    setMapInput("");
    setD((p) => ({ ...p, lat: c.lat, lng: c.lng }));
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
        /*
         * Written here, on save, rather than on every render.
         *
         * Everything that reads a listing reads title and description — the
         * card, the heading, the search index, the JSON-LD, the share card.
         * Generating them once into the record leaves all of that untouched,
         * and it means a listing keeps the words it was saved with even if
         * these sentences are reworded later.
         */
        title: buildTitle(d),
        description: buildDescription(d.features),
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

      {/*
        No title boxes, and no description boxes.
        
        There were six — a title and a description in each of three languages —
        and six boxes is five more than anybody fills in. What happened in
        practice is that one language got written and the other two stayed
        empty, so a visitor reading Arabic saw Kurdish or saw nothing.
        
        The title is built from the record now: type, purpose, district, city,
        every one of which is already a key with three translations beside it.
        The description is built from the phrases ticked below. Both come out
        right in all three languages, spelled the same way every time, and
        neither costs anything to produce.
      */}
      <Card title="ئەم مووڵکە چۆنە؟">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          ئەوانە هەڵبژێرە کە ڕاستن. ناونیشان و وەسفی مووڵکەکە خۆیان دروست
          دەبن — بە کوردی و عەربی و ئینگلیزی — بۆیە پێویست ناکات هیچ بنووسیت.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FEATURE_KEYS.map((k) => {
            const on = (d.features ?? []).includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() =>
                  up(
                    "features",
                    on
                      ? (d.features ?? []).filter((x) => x !== k)
                      : [...(d.features ?? []), k],
                  )
                }
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-start text-sm transition-colors cursor-pointer ${
                  on
                    ? "border-primary bg-primary/10 font-medium text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {featureNames[k].ku}
                {on && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>

        {/* Shown as it will be saved, so nobody has to guess. */}
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold text-muted-foreground">
            بەم شێوەیە دەردەکەوێت:
          </p>
          <p className="mt-1.5 font-semibold">{preview.title.ku}</p>
          {preview.description.ku && (
            <p className="mt-1 text-sm text-muted-foreground">
              {preview.description.ku}
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground" dir="ltr">
            {preview.title.en}
            {preview.description.en ? ` — ${preview.description.en}` : ""}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {preview.title.ar}
            {preview.description.ar ? ` — ${preview.description.ar}` : ""}
          </p>
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
            {/* Changing the city drops the district with it: a neighbourhood
                belongs to the city it was picked in, and one left behind puts
                an Erbil street on a Basra listing. */}
            <select className="input" value={d.city} onChange={(e) => { setD((p) => ({ ...p, city: e.target.value as Property["city"], district: undefined })); setTypedDistrict(false); }}>
              {CITY_KEYS.map((c) => <option key={c} value={c}>{cityNames[c].ku}</option>)}
            </select>
          </Field>
          <Field label="گەڕەک">
            {typedDistrict ? (
              <div className="flex items-center gap-2">
                <input className="input" placeholder="ناوی گەڕەک بنووسە" value={d.district?.ku ?? ""} onChange={(e) => up("district", e.target.value ? sameInAll(e.target.value) : undefined)} />
                {/* Picking "a different district" was a one-way door: the list
                    went away and nothing brought it back. */}
                <button type="button" onClick={() => { setTypedDistrict(false); up("district", undefined); }} className="shrink-0 cursor-pointer text-xs text-primary underline">
                  گەڕانەوە بۆ لیست
                </button>
              </div>
            ) : (
              <select className="input" value={d.district?.ku ?? ""} onChange={(e) => { const v = e.target.value; if (v === OTHER_DISTRICT) { setTypedDistrict(true); up("district", undefined); return; } up("district", v ? sameInAll(v) : undefined); }}>
                <option value="">— گەڕەک هەڵبژێرە —</option>
                {(districts[d.city] ?? []).map((n) => <option key={n} value={n}>{n}</option>)}
                <option value={OTHER_DISTRICT}>گەڕەکێکی تر…</option>
              </select>
            )}
          </Field>
          <Field label="نرخ (IQD)"><input type="number" className="input" value={d.priceIQD || ""} onChange={(e) => up("priceIQD", Number(e.target.value))} required /></Field>
          <Field label="ڕووبەر (مەتر)"><input type="number" className="input" value={d.area || ""} onChange={(e) => up("area", Number(e.target.value))} required /></Field>
          <Field label="ژووری نوستن"><input type="number" className="input" value={d.bedrooms ?? ""} onChange={(e) => up("bedrooms", e.target.value ? Number(e.target.value) : undefined)} /></Field>
          <Field label="حەمام"><input type="number" className="input" value={d.bathrooms ?? ""} onChange={(e) => up("bathrooms", e.target.value ? Number(e.target.value) : undefined)} /></Field>
          <Field label="نهۆم"><input type="number" className="input" value={d.floors ?? ""} onChange={(e) => up("floors", e.target.value ? Number(e.target.value) : undefined)} /></Field>
          <Field label="چێشتخانە"><input type="number" className="input" value={d.kitchens ?? ""} onChange={(e) => up("kitchens", e.target.value ? Number(e.target.value) : undefined)} /></Field>
        </div>
      </Card>

      {/* Location */}
      <Card title="شوێن لەسەر نەخشە">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          لە Google Maps شوێنەکە دیاری بکە، «Share» لێبدە و بەستەرەکە لێرە
          دابنێ — خۆی شوێنەکە دەردەهێنێت. بەستەری کورتیش
          (<span dir="ltr">maps.app.goo.gl</span>) کاردەکات.
        </p>
        <div className="flex gap-2">
          <input
            className="input"
            dir="ltr"
            placeholder="https://www.google.com/maps/place/..."
            value={mapInput}
            onChange={(e) => setMapInput(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={applyMapUrl} disabled={resolving}>
            {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
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
      {/*
        One place for everything the seller shows.

        Photographs and video were two cards asking the same question. A seller
        with ten photos and one clip of the street had to find two uploaders,
        and the second looked like a feature rather than a place to put the
        thing already in their gallery. One picker takes both — on a phone it
        opens the gallery, which is where all of it already is.
      */}
      <Card title={isAdmin ? "زیادکردنی وێنە و ڤیدیۆ" : "زیادکردنی وێنە"}>
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
            {vidPct !== null
              ? `${vidPct}%`
              : uploading && progress.total > 1
                ? `${progress.done}/${progress.total}`
                : "ئەپلۆد"}
            {/* A seller's picker opens on photographs only, so the option to
                pick a clip is not there to be refused later. */}
            <input type="file" accept={isAdmin ? "image/*,video/*" : "image/*"} multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
        </div>

        {/* The list is also the remove button, so it belongs to whoever may
            add. A seller editing a listing the office put a clip on keeps it:
            `videos` stays in the form's state and is saved back untouched —
            it is simply not theirs to take off. */}
        {isAdmin && (d.videos ?? []).length > 0 && (
          <div className="mt-3 space-y-2">
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

        <div className="mt-3 flex gap-2">
          <input className="input" placeholder="یان بەستەری وێنە زیادبکە (URL)" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
          <Button type="button" variant="outline" onClick={addUrl}><Plus className="h-4 w-4" /></Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {isAdmin
            ? "ڤیدیۆ ڕاستەوخۆ بار دەکرێت و لە ژێر وێنەکاندا دەردەکەوێت."
            : "ڤیدیۆ لەلایەن بەڕێوەبەرەوە زیاد دەکرێت. ئەگەر ڤیدیۆت بۆ موڵکەکە هەیە، پەیوەندیمان پێوە بکە."}
        </p>
      </Card>

      {/* Flags + discount + agent */}
      <Card title="ئاڵا و نووسینگە">
        {/*
          Featured and recommended are the office’s to give, not the seller’s
          to take.

          They are the two places on the site that get looked at first, and
          that is what the office sells — somebody who wants their listing up
          there asks, and pays. A seller who can tick the boxes themselves
          takes for nothing what is being charged for, and every listing ends
          up featured, which means none of them is.

          Hiding is not promotion and stays: a seller whose house has sold
          needs to take it down without deleting it.
        */}
        <div className="grid gap-3 sm:grid-cols-3">
          {isAdmin && (
            <>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.featured} onChange={(e) => up("featured", e.target.checked)} /> ⭐ تایبەت</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.recommended} onChange={(e) => up("recommended", e.target.checked)} /> 👍 پێشنیارکراو</label>
            </>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.hidden} onChange={(e) => up("hidden", e.target.checked)} /> 🚫 شاردنەوە لە سایت</label>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {isAdmin && (
            <>
              <span className="font-medium">تایبەت</span> = لە سەرەتای لاپەڕەی سەرەکی دەردەکەوێت ·{" "}
              <span className="font-medium">پێشنیارکراو</span> = لە بەشی پێشنیارەکان دەردەکەوێت ·{" "}
            </>
          )}
          <span className="font-medium">شاردنەوە لە سایت</span> = کەس نایبینێت (بۆ کاتێک فرۆشرا)
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!d.discount?.active} onChange={(e) => up("discount", { active: e.target.checked, oldPriceIQD: d.discount?.oldPriceIQD ?? 0 })} /> داشکاندن</label>
          {d.discount?.active && (
            <Field label="نرخی کۆن (IQD)"><input type="number" className="input" value={d.discount.oldPriceIQD || ""} onChange={(e) => up("discount", { active: true, oldPriceIQD: Number(e.target.value) })} /></Field>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="ناوی نووسینگە"><input className="input" value={d.agent.name} onChange={(e) => up("agent", { ...d.agent, name: e.target.value })} required /></Field>
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

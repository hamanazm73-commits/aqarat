# Aqarat Iraq — عەقاراتی عێراق 🏠

A modern real-estate marketplace for Iraq & Kurdistan, built to match the
sister **hotel** project's stack so the two can be connected later.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
lucide-react · next-themes · Firebase (optional) · zod.

---

## Run it

> Node is installed at `C:\Program Files\nodejs` but **not on PATH**. In a new
> terminal, prepend it first:
> `$env:Path = "C:\Program Files\nodejs;" + $env:Path` (PowerShell).

```bash
npm install      # first time only
npm run dev      # http://localhost:3000
npm run build    # production build
```

The public site runs **with no backend** — it uses local seed data
(`src/lib/data.ts`) and local SVG placeholder images (`public/img/`), so it
works fully offline.

---

## What's built (Phase 1 — public site) ✅

- **Trilingual** — Kurdish Sorani · English · Iraqi Arabic, with automatic
  **RTL/LTR** and a language switcher (saved to `localStorage`).
- **Light / dark** mode (next-themes).
- **Home** — animated hero + search, category shortcuts, featured listings, CTA.
- **Listings** (`/properties`) — filter by purpose (sale/rent), type, city,
  price range, bedrooms; sort; live result count; mobile filter sheet.
  Deep-links work, e.g. `/properties?purpose=rent&city=erbil`.
- **Property detail** (`/properties/[id]`) — image gallery, specs, amenities,
  Google-Maps link, agent call/WhatsApp, and a validated **inquiry form**.
- **Inquiry API** (`/api/inquiries`) — zod-validated + in-memory rate-limited.
- Prices in **IQD** (Latin digits, so server/client render identically).
- Security headers in `next.config.ts`.

## Project structure

```
src/
  app/                      routes (home, properties, [id], api/inquiries)
  components/               UI (header, footer, hero, cards, explorer, forms)
  lib/
    data.ts                 seed listings + query/filter helpers
    types.ts, constants.ts  domain model
    format.ts               IQD / number / date formatting
    i18n/                   dictionaries + language context
    firebase/client.ts      Firebase init (no-op until env is set)
public/img/                 local SVG placeholder images
firestore.rules, storage.rules   security rules (properties/inquiries/roles)
```

---

## Admin dashboard (Phase 2 — built) ✅

- **`/login`** — Firebase email/password sign-in.
- **`/admin`** — manage listings (create / edit / delete), toggle
  featured / recommended / discount / hidden, upload photos to Storage, or
  paste image URLs. A one-click **"import 12 seed listings"** button gives you
  starting data.
- **`/admin/inquiries`** — inbox of contact-form submissions.
- **`/admin/admins`** — (owner only) add/enable/disable other admins by email.
- Reads/writes go through the Firebase **client SDK + security rules** — no
  service account needed. The public inquiry form writes straight to Firestore
  (rules validate it).

## Firebase setup (to go live)

1. Create a Firebase project → add a **Web app**.
2. Enable **Authentication → Email/Password**, **Firestore**, and **Storage**.
3. Copy `.env.example` → `.env.local` and fill the `NEXT_PUBLIC_FIREBASE_*`
   values; set `NEXT_PUBLIC_OWNER_EMAIL` to your login email.
4. In `firestore.rules` and `storage.rules`, set `ownerEmail()` to that same
   email (lowercase), then **publish** both in the Firebase console.
5. In **Authentication**, create your owner user (email/password).
6. Restart `npm run dev`, open **`/login`**, sign in, then on `/admin` click
   **import seed listings** (or add your own). Done — the public site now serves
   live Firestore data.

> Without `.env.local`, everything still runs on seed data and `/admin` shows a
> friendly "Firebase not configured" screen.

## Connecting the two sites (hotel + real estate) 🔗

Planned approaches, cheapest first:

- **Shared header links / unified brand** — cross-link both sites now.
- **Shared Firebase project** — one auth + one admin panel managing both
  `hotels` and `properties` collections (the role model already matches).
- **Multi-zone / monorepo** — serve both under one domain
  (`/` = real estate, `/hotels` = hotels) via Next.js multi-zones.

Decide the domain strategy first; the shared-Firebase path reuses the most.

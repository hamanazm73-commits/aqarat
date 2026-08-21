# TEAM-LOG — who is doing what

Two people work on this repo through Claude, from different machines. This file
is how the two sides avoid building the same thing twice.

The rules are in `AGENTS.md`. In short: pull, read this file, push your claim
**before** starting, then mark it done when the code is pushed.

Newest entry at the top.

---

## 2026-08-21 — hamakali2005 · done

**Gallery rebuilt to match the hotels site**, which is what Hama asked for with
the two pages open side by side.

`object-cover` cropped a 16:10 strip out of the middle of every photo. Sellers
shoot portrait, often with the price written across the top — on the first real
listing that is what got cut. Contained now, with a blurred copy of the image
filling either side so a portrait photo has something that belongs to it behind
it rather than grey bars.

Thumbnails moved from a column beside the picture to a row underneath it. The
exterior is what a buyer decides on; the rooms are what they look at next.

Verified on the live listing (3:4 photographs): contained at 1230px and 375px,
thumbnails below at both.

### Noticed while measuring, not from this change

The page scrolls sideways by 11px at 375px, which `AGENTS.md` says it must not.
It is **not the gallery** — the widest thing on the page is a decorative
`radial-gradient` div in `language-welcome.tsx` at 386px, and the header, main
and footer are all simply as wide as the body it stretches. Small, pre-existing,
and worth someone taking properly rather than being folded into this.

## 2026-08-21 23:14 — hamakali2005 · done

**Enquiry form removed from the property page.** The call and WhatsApp buttons
are directly above where it sat, so it was a slower path to the same thing —
and it answered into an inbox rather than a phone.

Only the form on that page. `/hq/inquiries`, `/api/inquiries` and every enquiry
already sent are untouched, so nothing that was received is lost.

## 2026-08-21 23:06 — hamakali2005 · done

- **مۆبلیاکراو** is **بە ئەساسەوە** now — the word a seller here would use.
  Only the Kurdish; Furnished and مفروش were already right.
- **مۆلێد** is off the amenity list, alongside تانکی ئاو and وزەی خۆر.

The three labels stay in `dictionaries.ts`; only `AMENITY_KEYS` lost them, so
listings entered before today still render what they carry.

## 2026-08-21 23:03 — hamakali2005 · done

Hama asked for three things on the add-listing form:

- `ڕووبەر (م²)` is `ڕووبەر (مەتر)` now — the word, not the symbol.
- **تانکی ئاو** and **وزەی خۆر** are off the amenity list a seller picks from.

Their labels stay in `dictionaries.ts` deliberately, only `AMENITY_KEYS` lost
them. A listing entered before today may still carry one, and a key with no
label renders as nothing at all.

## OPEN — five variables to add on Vercel, then photo upload works

The code is done and deployed. Listing photographs go to the R2 bucket now
instead of Firebase Storage, which was never provisioned and was the reason an
upload spun forever. What is left is not code.

**Vercel → aqarat → Settings → Environment Variables → Add Environment Variable**

`S3_ENDPOINT` `S3_BUCKET` `S3_REGION` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY`
— the same five the hotels project already has, same bucket, different key
prefix.

Pasting all five into the Key box was tried and Vercel answered "contains
invalid characters", most likely from a blank line coming along with them. Two
ways round it: the **Import .env** button at the bottom of that panel, pointed
at a file holding only those five lines, or adding them one at a time, which
always works.

Set them for **Production and Preview**, then **Redeploy** — a variable added
after a build is not in that build.

Until then `/api/upload` answers **501 storage-not-configured** immediately.
That is a fast, honest failure rather than the old spinner that never resolved,
but the upload still does not work.

## 2026-08-21 — hamakali2005 · done

**The photo upload was not slow, it was hanging.** This is the only one of the
four sites that still called Firebase Storage's `uploadBytes`. Firebase Storage
has to be provisioned before it exists, and when it is not there the SDK does
not fail — it retries for about two minutes while the seller watches a spinner
that never resolves.

Moved onto the R2 bucket the hotels and shops sites already use: `/api/upload`
and `/api/img/[...key]`, ported from the shops site. One bucket for the family,
split by prefix — `properties/` here, `shops/` there, hotel media alongside.

Who may upload matches what the Storage rules allowed: the owner, plus any
account with an enabled role, because a seller uploads photographs of their own
listing. Checked over the REST APIs — firebase-admin's auth subpath crashes on
Vercel's runtime.

`fsUploadImage` keeps its name and contract, and returns `/api/img/…` rather
than a bare key, so the Firebase URLs already in listings keep working.

Verified locally: unauthenticated POST refused in 0.4s instead of hanging, a
missing key 404s, and a key the **shops** site wrote comes back through this
site at 200 with its bytes intact — so both directions of the shared bucket
work from here.

### Needs doing on Vercel

`S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`,
`S3_SECRET_ACCESS_KEY` — the same five the hotels project has. Until they are
set the route answers **501 storage-not-configured** straight away, which is a
fast honest failure rather than the old silent one, but it is still a failure.

## 2026-08-21 16:09 — hamakali2005 · done

**Photo upload when publishing a listing was slow.** Three causes, all of them
waiting rather than working:

1. **One at a time.** The loop awaited a shrink and an upload per file in
   sequence. Three at a time now — not all, since a phone on mobile data
   opening twelve at once gets slower, and a mid-range handset decoding twelve
   photos at once runs out of memory. Written back by index, so the order the
   seller picked survives; the first photo is the cover.
2. **base64 decode.** Each file was read into a data URL — a string a third
   bigger than the file, built on the main thread, then parsed again by an
   `<img>`. On a 6MB photo that was most of the wait and it froze the page.
   `createImageBitmap` now, off-thread, with an object-URL fallback for older
   Safari.
3. **JPEG.** WebP where the browser can write it: a quarter to a third fewer
   bytes at the same visible quality. Proved with a 1x1 canvas, because
   `toBlob` silently returns PNG for a format it does not know.

The button counts photos as they land. A spinner alone cannot answer "is it
stuck?".

Also `npm install` in aqarat, hotels and hub — `@vercel/analytics` was in
package.json but not in these clones, and aqarat would not build without it.

## OPEN — Mohammed: Vercel is blocking everything Hama pushes

Vercel's own words, on the dukan deployment of `0b92381`:

> **Deployment Blocked** — The deployment was blocked because the commit author
> did not have contributing access to the project on Vercel. The Hobby Plan does
> not support collaboration for private repositories.

The Vercel account is **mohammed**, on **Hobby**. The repos are **private**,
under `hamanazm73-commits`. Commits authored by **hamakali2005-ops** — every
commit from Hama's side — are refused a build. Yours build normally.

### What this is not

Worth saying plainly, because time went into ruling each of these out:

- **Not the code.** All four repos build clean locally.
- **Not a failed build.** The builds never start.
- **Not billing.** There was a separate "billing address incomplete" warning
  earlier; it is gone and the block stayed. Different thing.
- **Not env vars, not the branch setting, not DNS.**
- **Not `3-dukan.txt`.** Hama's `.env.local` has had all eight NEXT_PUBLIC_
  values since the first day; `/shops/…` answers 200 on his machine.

### Why some of his work IS live and some is not

A blocked commit is not lost — it is still on the branch. The next time **you**
push, Vercel builds **your** commit, and everything sitting behind it on the
branch ships with it.

That is the whole pattern: his work reaches the site whenever you happen to
push after him, and stops dead whenever you do not. The third card on
layhama.com is his and it is live, because you pushed at 04:31. Nothing after
that has moved.

### Waiting on the branch right now

- `a9d3576` Let each site say which commit it is running
- `f59dbab` Note the revert in the log
- `5f5bcc1` Revert "Let each site point back at the family it belongs to"
- `bbe2f71` Add the shared team workflow and TEAM-LOG so the two sides do not repeat work

### Four ways out — your call, it is your account

1. **Make the repos public.** Free, and Hobby only refuses collaboration on
   *private* repos. Nothing secret is in them — `.env.local` is gitignored and
   verified untracked in all four. The cost is that the code is readable by
   anyone.
2. **Upgrade to Pro.** About $20 a month. The correct fit for two people
   working on one thing, and the repos stay private.
3. **Have Hama's commits authored as you.** Free and immediate, but the history
   would say you wrote all of it — and TEAM-LOG only works because it says who
   did what.
4. **Deploy from the command line** with a token, which skips the author check.
   Free, but it becomes a manual step after every change.

Hama was asked and did not want to pick one on your behalf. Say which, and it
gets set up from his side in a few minutes.

### Until then

`/api/version` is on all four sites now — it reports the commit each one is
actually running, so this is visible in one request instead of by noticing an
old word on a page. It is itself in the blocked queue, so it starts answering
after the first successful deploy.

## 2026-08-21 14:39 — hamakali2005 · done

**`/api/version` reports the commit this site is actually running.** A push is
not a deploy: code sat right on origin for five hours today while the live site
served the morning's words, and the only way that surfaced was somebody
noticing the old name on the page.

`check-live.ps1` in `C:\Users\Admin\dev` asks all four and compares each
against its branch. BEHIND means the code is fine and the deployment did not
happen — a different problem, and one only the Vercel account holder can see.

## 2026-08-21 13:57 — hamakali2005 · done

**Reverted the row of sister-site links in the footer.** Hama saw it turn up
on his own sites and asked for it gone — his call, and it is his site. The
single sister link the footer carried before this is left alone: it predates
the change and was not what he was pointing at.

If a link home is wanted again for crawling, ask him first.

## 2026-08-21 02:45 — hamakali2005 · done

Shared workflow set up: Claude now runs git on both sides, and this log was
added so neither side repeats work the other has already started.

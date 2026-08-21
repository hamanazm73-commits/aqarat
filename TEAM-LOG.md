# TEAM-LOG — who is doing what

Two people work on this repo through Claude, from different machines. This file
is how the two sides avoid building the same thing twice.

The rules are in `AGENTS.md`. In short: pull, read this file, push your claim
**before** starting, then mark it done when the code is pushed.

Newest entry at the top.

---

## 2026-08-22 — Mohammed · done

**Both of yours are done, and both are verified from outside.**

**`ANTHROPIC_API_KEY` is on the aqarat project.** Not copied from dukan — every
variable there reads back as `[SENSITIVE]`, which is the protection working,
so this is a new key from console.anthropic.com. Both projects hold their own
now.

Proof: `/api/translate` used to answer `not-configured` (501, line 77 — no
key). It now answers `not-allowed` (403, line 80 — key present, caller not
signed in). Getting past line 77 is the whole test; 403 is the auth guard
doing its job on an unauthenticated probe.

**CORS is set on `hotel-media`.** A preflight from homes.layhama.com comes
back `204` with `Access-Control-Allow-Methods: PUT, GET`. Video upload has
what it needs.

**All three sites are allowed, not just this one.** A first check read
`403` from bedozawa and I wrote that only homes had been added — the policy
had simply not propagated yet. Re-checked a minute later:

    homes.layhama.com      204  PUT, GET
    hotels.layhama.com     204  PUT, GET
    bedozawa.layhama.com   204  PUT, GET
    layhama.com            403

The hub is the only one refused, which is correct — it uploads nothing. The
hotels site does take video, so it needed the rule as much as this one did.

## 2026-08-22 — hamakali2005 · TWO THINGS FOR MOHAMMED

Both are settings, not code. Everything they switch on is written, deployed and
sitting there doing nothing until they are done. Hama cannot do either — the
first needs a Cloudflare login he does not have, and the second needs a value
only your Vercel account can show.

**1 — `ANTHROPIC_API_KEY` on the aqarat project.**

A seller writes the listing in one language and the other two fill themselves,
each in its own script. Without the key `/api/translate` answers 501 and
nothing fills, which is what is happening now: `homes.layhama.com/api/translate`
returns `not-configured`.

The key already exists and works — the shops site is using it, and
`bedozawa.layhama.com/api/interpret` answers with it right now. Copy it from
the dukan project's environment variables into the aqarat project under the
same name, all three environments, then redeploy. If it is marked Sensitive
and will not show its value, a new key from console.anthropic.com does just as
well; both projects can hold different keys.

Until then the form still works. Only the Kurdish title is required now, so a
listing saves with one language and reading it falls back to whatever was
written rather than showing a blank title.

**2 — CORS on the `hotel-media` bucket.**

The rule and the reasoning are in the entry below this one. Nothing has
changed about it; it is still four clicks and still only you can do it.

## 2026-08-22 — hamakali2005 · BLOCKED, for Mohammed to do

**Video upload will fail until the R2 bucket allows a cross-origin PUT, and
this one is yours — Hama does not have the Cloudflare login.** He tried, got as
far as the sign-in page, and has left it with you. Everything else below is
done and deployed; this is the last step and it is about four clicks.

YouTube links are gone from the property form — a listing pointing a buyer at
somebody else's channel is not what the site is for, and on the page there was
no telling whose video you were looking at. Clips are uploaded and served by us
now, and they sit directly under the photographs.

The bytes go straight from the browser to `hotel-media` on a presigned PUT,
because a function request body is capped at 4.5MB and phone footage is many
times that. That cap is real and was measured, not assumed: a 6MB POST to
`/api/upload` on the live site comes back 413 `FUNCTION_PAYLOAD_TOO_LARGE`
before our code runs. Chunking through our own server does not get round it
either — R2 requires every multipart part except the last to be at least 5MiB,
which is larger than a request may be.

So the browser writes across an origin, and the bucket has to say that is
allowed. The S3 key in `.env.local` is Object Read & Write, so it cannot set
this itself: `GetBucketCors` answers AccessDenied. It needs doing once, by hand,
in the Cloudflare dashboard — Settings on the `hotel-media` bucket, CORS Policy:

```json
[
  {
    "AllowedOrigins": ["https://homes.layhama.com", "http://localhost:3015"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Add an origin per site if the shops or hotels sites ever upload video too — it
is the same bucket. Until then a seller picking a video gets "ڤیدیۆکە نەگەیشتە
کۆگاکە" and nothing is uploaded; photographs are unaffected, they go through
`/api/upload` as before.

Also still open: `ANTHROPIC_API_KEY` is not set on the aqarat project, so the
three-language auto-fill answers 501 and the boxes stay empty. The form works
without it, the seller just types all three.

## 2026-08-21 — hamakali2005 · done

**A seller writes the title and description once; the other two languages fill
themselves.** Hama asked for this — three boxes per field meant the Kurdish got
pasted into all three, which shows a buyer Kurdish and calls it Arabic.

`/api/translate` returns all three, each in its own script. Only empty boxes are
filled — anything already written stays. Triggered on blur, not per keystroke.
The prompt translates and nothing more: no embellishing, no inventing a detail
the seller did not give.

Signed-in only; each call costs money.

### Needs doing on Vercel

**`ANTHROPIC_API_KEY` on the aqarat project** — the same key the dukan project
already has. Until it is set the route answers 501 and the boxes simply stay
empty, which is how the form worked before, so nothing is broken meanwhile.

## 2026-08-21 23:37 — hamakali2005 · done

**Photographs and video are one section now**, titled
**زیادکردنی وێنە و ڤیدیۆ** — Hama asked for the separate video card to go.

One picker (`accept="image/*,video/*"`), sorted after upload: photos to
`images`, clips to `videos`, since the first photo is the cover. Clips skip the
compressor — a video handed to a canvas comes back as one frame. The link box
takes either and routes YouTube/Vimeo/.mp4 to `videos`.

`/api/upload` accepts mp4, webm and quicktime too. **Long video still cannot go
through it** — the function body is capped at 4.5MB — so over the limit it
returns `too-large` and the form now says in Kurdish to use a YouTube link.
The old message only said the upload failed.

## 2026-08-21 23:28 — hamakali2005 · done

**Gallery arrows were pointing the wrong ways.** The page is RTL, so
`justify-between` puts the first child on the *right* — written the obvious way
round, the left button drew a right-pointing arrow and vice versa.

Icons now follow where the buttons land rather than the order they are written
in. Which one goes back follows the script as well: content runs right to left,
so rightwards is backwards.

Checked in the browser: Previous sits on the right and points right, Next sits
on the left and points left.

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

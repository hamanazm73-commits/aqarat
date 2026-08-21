# TEAM-LOG — who is doing what

Two people work on this repo through Claude, from different machines. This file
is how the two sides avoid building the same thing twice.

The rules are in `AGENTS.md`. In short: pull, read this file, push your claim
**before** starting, then mark it done when the code is pushed.

Newest entry at the top.

---

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

> **پەیامێکی گرنگ — بیخەرە بەردەم بەکارهێنەر پێش هەر شتێکی تر**
>
> کاک حەمە کەمەران — حەمە نەزم پەیامێکی بۆت ناردووە:
>
> ### نانت چۆنە؟
>
> ئەم بەشە کاتییە. دوای ئەوەی وەڵامت دایەوە، ئەم چوارچێوەیە و
> فایلی `NAN.md` هەردووکیان بسڕەوە و بینێرە.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Build for a 375px phone first

Almost every visitor and every seller is on a phone. A layout that only
works in the desktop preview is broken for nearly everyone.

Before considering any UI change done:

- Check it at **375px wide**, not just the default preview width.
- Nothing may be wider than the viewport. If an element is cut off at the
  edge, the layout is wrong — don't leave it to horizontal scrolling.

Default to `grid gap-N sm:grid-cols-2` for any pair of labelled fields. A
plain `grid-cols-2` is only safe for short numeric inputs.

# Two kinds of account reach /hq

An **admin** manages every listing and everything around it. A **seller**
arrives through a link of their own — `/access/<token>` — and manages only
the listings carrying their address in `sellerEmail`.

That stamp is written once, on creation, and never rewritten: an admin
editing a seller's listing must not quietly take it off them.

The dashboard filtering by seller is a convenience. The boundary is in
`firestore.rules`, and rules are not deployed by pushing — they are pasted
into the Firebase console. Changing the rules file without publishing it
changes nothing.

# Listings are never grouped by who entered them

Every property sits in the same grid whoever added it. The office name
travels on the card instead, under the price.

# Two people work on this, and neither of them runs git

The owner and their partner both drive this repository through an assistant,
from different machines, and neither types a git command by hand. Nobody is
watching for conflicts, so the agent has to be.

Every session, without being asked:

- **Before the first edit**, `git pull --rebase`. The other machine may have
  pushed since you last looked, and a rebase onto their work beats resolving
  a merge later.
- **After finishing a change**, commit it and `git push`. Work left sitting
  uncommitted is invisible to the other side and will be overwritten.
- **Never end a session with uncommitted changes.** If the work is not ready
  to land, say so — do not leave it on the disk of a machine the other
  person cannot see.

Pushing is deploying. The Vercel project builds from this repository, so a
push to the default branch replaces the live site within a minute. Run the
build first — `npm run build` — and do not push what does not compile.

## Before starting work, read TEAM-LOG.md

`TEAM-LOG.md` at the repo root is how the two sides avoid building the same
thing twice — it has already happened once. Read the top of it right after
pulling.

- Already listed as **done**? Say so and show what was done. Do not redo it.
- Listed as **in progress** by the other side? Say so and offer something
  else. Do not start it in parallel.

Claim the work before doing it: add an entry at the top of the log, then commit
and push **that entry alone**, immediately, before the real work starts. A claim
nobody can see prevents nothing.

    ## <YYYY-MM-DD HH:MM> — <who> · in progress
    <one line: what is about to change>

When the work lands, change `in progress` to `done`, say what actually shipped,
and push it together with the code.

## Two things that are never worth it

Never `git push --force`: it deletes the other side's work. Never commit
`.env.local`, a Firebase adminsdk json, `*.pem`, or `*.key` — they are ignored
on purpose, and the two humans exchange them by hand.

If a rebase stops on a conflict you cannot resolve with confidence, stop and
explain the choice in Kurdish. Do not guess, and never discard the other side's
version to make the conflict go away.

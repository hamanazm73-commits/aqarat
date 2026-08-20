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

The owner and his partner both drive this repository through an assistant,
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

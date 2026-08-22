"use client";

import { useEffect, useState } from "react";
import { Hammer, Loader2 } from "lucide-react";
import { fsGetComingSoon, fsSetComingSoon } from "@/lib/firebase/db";

/**
 * The switch that flies the "still being worked on" strip.
 *
 * The hotels site has had one since it opened and it does a job an empty
 * listings page cannot: it tells a visitor the quiet is temporary rather than
 * the whole offer.
 *
 * Saved on the tap, not behind a save button. There is one thing to change
 * here and a button to confirm it would be a second decision about the same
 * switch — the cities page has a save button because a dozen taps there are
 * one edit.
 */
export function ComingSoonCard() {
  const [on, setOn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fsGetComingSoon()
      .then(setOn)
      .catch(() => setOn(false));
  }, []);

  async function toggle() {
    if (on === null || saving) return;
    const next = !on;
    setOn(next);
    setFailed(false);
    setSaving(true);
    try {
      await fsSetComingSoon(next);
    } catch {
      // Put the switch back where it was. A switch that shows one thing while
      // the site does another is worse than a switch that refused.
      setOn(!next);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Hammer className="size-4 text-gold" />
            دۆخی «لە چاککردندایە»
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            هێڵێکی زێڕین لە سەرەوەی ماڵپەڕەکە دەردەکەوێت و پێی دەڵێت ماڵپەڕەکە
            هێشتا لە چاککردندایە. مووڵکەکان وەک خۆیان دەمێننەوە و خەڵکی
            دەیانبینێت.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on === true}
          aria-label="دۆخی لە چاککردندایە"
          onClick={toggle}
          disabled={on === null || saving}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
            on ? "bg-gold" : "bg-border"
          }`}
        >
          {/* start-1 / end-1 rather than left / right: the dashboard is laid
              out right to left, so "on" has to travel the way the page reads. */}
          <span
            className={`absolute size-5 rounded-full bg-white shadow transition-all ${
              on ? "end-1" : "start-1"
            }`}
          />
        </button>
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm font-medium">
        {on === null || saving ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : null}
        {on === null ? (
          <span className="text-muted-foreground">دەخوێنرێتەوە…</span>
        ) : on ? (
          <span className="text-gold">چالاکە — هێڵەکە دەردەکەوێت</span>
        ) : (
          <span className="text-muted-foreground">ناچالاکە</span>
        )}
      </p>

      {failed && (
        <p className="mt-2 text-sm text-danger">
          پاشەکەوت نەکرا. دووبارە هەوڵ بدەرەوە.
        </p>
      )}
    </div>
  );
}

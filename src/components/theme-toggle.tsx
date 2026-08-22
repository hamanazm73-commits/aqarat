"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Whether we are past hydration.
 *
 * The theme only exists in the browser, so the server has nothing to render
 * and the first client render has to match what the server sent. That used to
 * be a `mounted` flag set from an effect, which costs a second render of this
 * component on every page and is what the linter was pointing at.
 *
 * `useSyncExternalStore` is the API React added for exactly this: give it a
 * server snapshot and a client snapshot and it returns the right one at the
 * right time, with no effect and no second render. Nothing here ever changes
 * after that, so subscribing has nothing to do.
 */
const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(neverChanges, onClient, onServer);

  const current = hydrated ? resolvedTheme ?? theme : undefined;

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground/80 transition-colors hover:bg-muted cursor-pointer"
    >
      {/* Render both, hide with CSS to avoid hydration flicker */}
      <Sun className="h-5 w-5 hidden dark:block" />
      <Moon className="h-5 w-5 block dark:hidden" />
    </button>
  );
}

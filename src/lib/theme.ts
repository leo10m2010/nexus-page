import type { Theme } from "@types";

export const THEME_KEY = "nexus-theme";

/**
 * Runs before paint, inlined into <head>, so the page never flashes the wrong
 * mode. Kept as a string because a module import would be too late.
 * It also arms the scroll reveal only when JS is alive.
 */
export const themeBootScript = `(() => {
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch {}
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("js-reveal");
  }
})();`;

/** Resolves the mode the user is actually looking at, explicit or inherited. */
export function resolveTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function toggleTheme(): Theme {
  const next: Theme = resolveTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {}
  return next;
}

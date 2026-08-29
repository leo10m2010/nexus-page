import type { Theme } from "@types";

export const THEME_KEY = "nexus-theme";

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

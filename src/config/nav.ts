import type { Dictionary } from "@types";

/**
 * Anchors are load-bearing: they came from the previous site and renaming one
 * breaks inbound links and SEO. Labels live in the locale dictionaries, so a
 * translation never touches the href.
 */
export const navItems: { key: keyof Dictionary["nav"]; href: string }[] = [
  { key: "home", href: "#home" },
  { key: "about", href: "#about" },
  { key: "vision", href: "#vision" },
  { key: "contact", href: "#contact" },
];

export const NAV_HEIGHT = 68;

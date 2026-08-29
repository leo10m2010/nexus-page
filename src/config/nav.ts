import type { Dictionary } from "@types";

export const navItems: { key: keyof Dictionary["nav"]; href: string }[] = [
  { key: "home", href: "#home" },
  { key: "about", href: "#about" },
  { key: "vision", href: "#vision" },
  { key: "contact", href: "#contact" },
];

export const NAV_HEIGHT = 68;

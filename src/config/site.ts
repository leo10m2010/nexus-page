import type { Channel, ContactRoute, CtaIntent, Cta, Link } from "@types";

/**
 * Single source of truth for anything that identifies Nexus Series.
 * Nothing below should be retyped inside a component: if a handle or a URL
 * changes, it changes here once.
 */
export const site = {
  name: "Nexus Series",
  url: "https://nexusseries.org",
  locale: "en_US",
  lang: "en",
  tagline: "Connecting Regions. Elevating Competition.",
  description:
    "Nexus Series is an esports competition platform connecting regions, organizations and players through structured international competition.",
  email: "partners@nexusseries.org",
  ogImage: "/media/og-nexus-series.jpg",
  ogImageSize: { width: 1200, height: 630 },
} as const;

export const social = {
  discord: "https://discord.gg/yNv97eMAcF",
  x: "https://x.com/nexusmedia77",
  xHandle: "@nexusmedia77",
} as const;

/** Official broadcast channels, one per language. */
export const channels: Channel[] = [
  { code: "ES", language: "Spanish", href: "https://www.twitch.tv/nexusmedia_es" },
  { code: "EN", language: "English", href: "https://www.twitch.tv/nexusmedia_en" },
  { code: "RU", language: "Russian", href: "https://www.twitch.tv/nexusmedia_ru" },
];

/**
 * One entry per intent. The label comes from the active dictionary, so the
 * same action can never appear under two different names within a language.
 */
export const ctas = {
  community: {
    intent: "community",
    href: social.discord,
    external: true,
    icon: "simple-icons:discord",
  },
  partnership: {
    intent: "partnership",
    href: "#contact",
  },
} as const satisfies Record<CtaIntent, Omit<Cta, "label">>;

export const contactRoutes: ContactRoute[] = [
  {
    icon: "ph:envelope-simple-bold",
    label: "Partnerships",
    value: site.email,
    href: `mailto:${site.email}`,
  },
  {
    icon: "simple-icons:discord",
    label: "Discord",
    value: "Join Nexus Series",
    href: social.discord,
    external: true,
  },
  {
    icon: "simple-icons:x",
    label: "X / Twitter",
    value: social.xHandle,
    href: social.x,
    external: true,
  },
];

export const socialLinks: (Link & { icon: string })[] = [
  { icon: "simple-icons:x", label: "X / Twitter", href: social.x, external: true },
  { icon: "simple-icons:discord", label: "Discord", href: social.discord, external: true },
  { icon: "simple-icons:twitch", label: "Twitch", href: channels[1]!.href, external: true },
];

/** Everything the org needs to be discoverable, derived not retyped. */
export const sameAs: string[] = [social.x, social.discord, ...channels.map((c) => c.href)];

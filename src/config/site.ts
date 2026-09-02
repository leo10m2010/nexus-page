import type { Channel, ContactRoute, CtaIntent, Cta, Link } from "@types";
import channelSettings from "../data/settings/channels.json";

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
  instagram: "https://www.instagram.com/nexusmedia_esports",
  instagramHandle: "@nexusmedia_esports",
  x: "https://x.com/nexusmedia77",
  xHandle: "@nexusmedia77",
} as const;

const channelMeta = {
  ES: { flag: "es", language: "Spanish" },
  EN: { flag: "us", language: "English" },
  RU: { flag: "ru", language: "Russian" },
} as const;

type ConfiguredChannelCode = keyof typeof channelMeta;
const configuredChannels = channelSettings.channels as Array<{ code: ConfiguredChannelCode; href: string }>;

export const channels: Channel[] = configuredChannels.map((channel) => ({
  ...channel,
  ...channelMeta[channel.code],
}));

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
    icon: "simple-icons:instagram",
    label: "Instagram",
    value: social.instagramHandle,
    href: social.instagram,
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
  { icon: "simple-icons:instagram", label: "Instagram", href: social.instagram, external: true },
  { icon: "simple-icons:discord", label: "Discord", href: social.discord, external: true },
  {
    icon: "simple-icons:twitch",
    label: "Twitch",
    href: (channels.find((channel) => channel.code === "EN") ?? channels[0])!.href,
    external: true,
  },
];

export const sameAs: string[] = [social.x, social.instagram, social.discord, ...channels.map((c) => c.href)];

import type { ImageMetadata } from "astro";

/** A link that may leave the site. `external` drives target and rel. */
export interface Link {
  label: string;
  href: string;
  external?: boolean;
}

/** A call to action. One label per intent, reused everywhere that intent appears. */
export interface Cta extends Link {
  intent: CtaIntent;
  icon?: string;
}

export type CtaIntent = "community" | "partnership";

export interface ContactRoute extends Link {
  icon: string;
  /** The address or handle shown under the label. */
  value: string;
}

export interface Channel {
  code: string;
  language: string;
  href: string;
}

/** One rendered line of a display headline. `accent` colours it. */
export interface HeadlineLine {
  text: string;
  accent?: boolean;
}

export interface Pillar {
  title: string;
  body: string;
}

export interface MediaRef {
  src: ImageMetadata;
  alt: string;
}

export type Theme = "light" | "dark";

export type Locale = "en" | "es" | "ru";

/** Broadcast channel languages. Deliberately separate from `Locale`: a Twitch
 *  channel can exist in a language the site is not translated into. */
export type ChannelCode = "es" | "en" | "ru";

/**
 * The shape every locale file must satisfy. A missing key is a build error,
 * which is the point: translations cannot silently drift out of sync.
 */
export interface Dictionary {
  nav: Record<"home" | "about" | "vision" | "contact", string>;
  cta: Record<CtaIntent, string>;
  a11y: {
    skipToContent: string;
    backToTop: string;
    primaryNav: string;
    openMenu: string;
    closeMenu: string;
    switchTheme: string;
    switchLanguage: string;
    broadcastChannels: string;
    openSlot: (n: number, total: number) => string;
  };
  tagline: string;
  hero: {
    headline: HeadlineLine[];
    /** Per-locale type scale. Longer languages need a lower ceiling to hold
     *  the headline to two lines at desktop. */
    headlineClamp: string;
    lede: string;
  };
  channels: { intro: string; languages: Record<ChannelCode, string> };
  about: { eyebrow: string; heading: string; body: [string, string] };
  vision: { heading: string; lede: string; pillars: Pillar[] };
  partners: { heading: string; lede: string; slotLabel: string };
  contact: { eyebrow: string; heading: [string, string]; lede: string };
  footer: { rights: string };
  competition: {
    navLabel: string;
    eyebrow: string;
    heading: string;
    lede: string;
    tournaments: string;
    schedule: string;
    results: string;
    teams: string;
    empty: string;
    status: Record<"upcoming" | "live" | "finished", string>;
    format: Record<
      "doubleElimination" | "singleElimination" | "roundRobin" | "swiss",
      string
    >;
    stage: Record<
      "groupStage" | "quarterfinal" | "semifinal" | "final" | "thirdPlace",
      string
    >;
    teamCount: (n: number) => string;
    timeZoneNote: string;
  };
}

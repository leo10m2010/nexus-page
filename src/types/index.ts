import type { ImageMetadata } from "astro";

export interface Link {
  label: string;
  href: string;
  external?: boolean;
}

export interface Cta extends Link {
  intent: CtaIntent;
  icon?: string;
}

export type CtaIntent = "community" | "partnership";

export interface ContactRoute extends Link {
  icon: string;

  value: string;
}

export interface Channel {
  code: string;
  flag: string;
  language: string;
  href: string;
}

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

export type ChannelCode = "es" | "en" | "ru";

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

    headlineClamp: string;
    lede: string;
  };
  channels: { intro: string; languages: Record<ChannelCode, string> };
  about: { eyebrow: string; heading: string; body: [string, string] };
  vision: { heading: string; lede: string; pillars: Pillar[] };
  partners: { heading: string; lede: string; slotLabel: string };
  contact: { eyebrow: string; heading: [string, string]; lede: string };
  footer: { rights: string; navHeading: string; watchHeading: string };

  roadmap: {
    eyebrow: string;
    heading: string;
    lede: string;

    comingSoon: string;

    dateTbd: string;

    detailsTbd: string;
    totalPrizePool: string;
  };

  teamsShowcase: {
    eyebrow: string;
    heading: string;
    cta: string;
  };
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
      "doubleElimination" | "singleElimination" | "roundRobin",
      string
    >;
    stage: Record<
      | "groupStage"
      | "lowerRound"
      | "quarterfinal"
      | "semifinal"
      | "upperFinal"
      | "lowerFinal"
      | "final"
      | "grandFinal"
      | "thirdPlace",
      string
    >;
    teamCount: (n: number) => string;
    timeZoneNote: string;

    section: Record<"format" | "participants" | "standings" | "bracket" | "matches" | "talent", string>;

    info: Record<
      | "venue"
      | "location"
      | "dates"
      | "prizePool"
      | "teams"
      | "format"
      | "broadcast",
      string
    >;
    venue: Record<"online" | "offline" | "hybrid", string>;

    qualification: Record<"invited" | "qualifier" | "regional" | "defending", string>;
    phase: Record<"groupStage" | "playoffs" | "finals", string>;
    bracketSide: Record<"upper" | "lower" | "final", string>;
    prizeHead: Record<"place" | "prize", string>;

    standingsHead: Record<"team" | "series" | "maps" | "diff", string>;

    bestOf: (n: number) => string;

    advance: (n: number) => string;

    round: (n: number) => string;

    place: (n: number) => string;

    placeRange: (from: number, to: number) => string;

    tbd: string;
    winner: string;
    roster: string;
    allTournaments: string;
    viewTournament: string;
    viewOnLiquipedia: string;
    dataFromLiquipedia: string;
    liquipediaLogoSource: string;
  };
}

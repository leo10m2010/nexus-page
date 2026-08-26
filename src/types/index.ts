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

    /* ----------------- the page of a single tournament ----------------- */

    /** Section headings, reused verbatim as the labels of the in-page tabs.
     *  The payout table is labelled `info.prizePool`, since that is what it
     *  holds; a section called "overview" only said where it sat on the page. */
    section: Record<"format" | "participants" | "standings" | "bracket" | "matches", string>;
    /** Rows of the fact panel that sits beside the overview. */
    info: Record<
      | "organizer"
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
    /** How a team got into the field. */
    qualification: Record<"invited" | "qualifier" | "regional" | "defending", string>;
    phase: Record<"qualifier" | "groupStage" | "swissStage" | "playoffs" | "finals", string>;
    bracketSide: Record<"upper" | "lower" | "final", string>;
    prizeHead: Record<"place" | "prize" | "team", string>;
    /** Column heads of a group table: series record, maps, map difference. */
    standingsHead: Record<"team" | "series" | "maps" | "diff", string>;
    /** Best of three, five... written short: Bo3, Bo5. */
    bestOf: (n: number) => string;
    /** How many teams carry on from a phase. */
    advance: (n: number) => string;
    /** Title of a bracket column that does not name itself. */
    round: (n: number) => string;
    /** An ordinal place: 1st, 1.º, 1-е. */
    place: (n: number) => string;
    /** A shared place, like 5th - 8th. */
    placeRange: (from: number, to: number) => string;
    /** A bracket slot nobody has qualified for yet. */
    tbd: string;
    roster: string;
    allTournaments: string;
    viewTournament: string;
  };
}

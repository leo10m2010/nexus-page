import type { Dictionary } from "@types";

/** 1st, 2nd, 3rd, 4th. Only ever used for prize places, so integers only. */
const place = (n: number): string => {
  const teens = n % 100;
  const suffix = teens >= 11 && teens <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
};

/** Source language. Every string is carried over verbatim from nexusseries.org. */
export const en: Dictionary = {
  nav: { home: "Home", about: "About us", vision: "Vision", contact: "Contact" },

  cta: {
    community: "Join the Discord",
    partnership: "Become a partner",
  },

  a11y: {
    skipToContent: "Skip to content",
    backToTop: "Nexus Series, back to top",
    primaryNav: "Primary",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchTheme: "Switch colour theme",
    switchLanguage: "Change language",
    broadcastChannels: "Official broadcast channels",
    openSlot: (n, total) => `Open partnership slot ${n} of ${total}`,
  },

  tagline: "Connecting Regions. Elevating Competition.",

  hero: {
    headline: [
      { text: "Connecting regions." },
      { text: "Elevating competition.", accent: true },
    ],
    headlineClamp: "clamp(2rem, 5.2vw, 4.5rem)",
    lede: "An esports competition platform built to connect regions, organizations and players through structured international competition.",
  },

  channels: {
    intro: "Broadcast live on Twitch in three languages.",
    languages: { es: "Spanish", en: "English", ru: "Russian" },
  },

  about: {
    eyebrow: "About us",
    heading: "Built to connect competition across regions.",
    body: [
      "Nexus Series started from a simple gap: too many strong regional teams with nowhere neutral to prove themselves against each other. We run our own bracket and our own broadcast — live in English, Spanish and Russian — instead of routing that fight through someone else's platform.",
      "Our goal is to create a professional competitive environment capable of growing across regions while maintaining strong standards of organization, integrity and competitive excellence.",
    ],
  },

  vision: {
    heading: "Building the next connection in competitive esports.",
    lede: "We aim to build a sustainable competitive platform where organizations, players and communities can connect through high-level esports competition.",
    pillars: [
      {
        title: "Competition",
        body: "Every stage runs on a published bracket and format — group stage into single- or double-elimination, best-of-three minimum — decided before a single match is played, not adjusted around who's still in it.",
      },
      {
        title: "Connection",
        body: "Nexus Series I already fields teams from multiple regions competing under one bracket instead of staying siloed in regional-only circuits — that's the model each season builds on.",
      },
      {
        title: "Growth",
        body: "The roadmap runs in three stages a season, and each one is funded before it's announced — nothing gets added to the schedule without a prize pool behind it already.",
      },
    ],
  },

  partners: {
    heading: "Partners & collaborators",
    lede: "Partnership slots are open for brands building in competitive esports.",
    slotLabel: "Your brand here",
  },

  contact: {
    eyebrow: "Contact",
    heading: ["Connect with", "Nexus Series."],
    lede: "For teams, partners, media and business inquiries.",
  },

  competition: {
    navLabel: "Tournaments",
    eyebrow: "Competition",
    heading: "Tournaments, teams and results.",
    lede: "Every Nexus Series tournament, the teams competing in it, what is coming up next and how it finished.",
    tournaments: "Tournaments",
    schedule: "Schedule",
    results: "Results",
    teams: "Teams",
    empty: "Nothing scheduled yet.",
    status: { upcoming: "Upcoming", live: "Live now", finished: "Finished" },
    format: {
      doubleElimination: "Double elimination",
      singleElimination: "Single elimination",
      roundRobin: "Round robin",
      swiss: "Swiss",
    },
    stage: {
      groupStage: "Group stage",
      lowerRound: "Lower bracket",
      quarterfinal: "Quarterfinal",
      semifinal: "Semifinal",
      upperFinal: "Upper bracket final",
      lowerFinal: "Lower bracket final",
      final: "Final",
      grandFinal: "Grand final",
      thirdPlace: "Third place",
    },
    teamCount: (n) => `${n} teams`,
    timeZoneNote: "All times are UTC.",
    section: {
      format: "Format",
      participants: "Participants",
      standings: "Standings",
      bracket: "Bracket",
      matches: "Matches",
    },
    info: {
      organizer: "Organizer",
      venue: "Type",
      location: "Location",
      dates: "Dates",
      prizePool: "Prize pool",
      teams: "Teams",
      format: "Format",
      broadcast: "Broadcast",
    },
    venue: { online: "Online", offline: "On stage", hybrid: "Online and on stage" },
    qualification: {
      invited: "Invited",
      qualifier: "Qualifier",
      regional: "Regional slot",
      defending: "Defending champion",
    },
    phase: {
      qualifier: "Qualifier",
      groupStage: "Group stage",
      swissStage: "Swiss stage",
      playoffs: "Playoffs",
      finals: "Finals",
    },
    bracketSide: { upper: "Upper bracket", lower: "Lower bracket", final: "Grand final" },
    prizeHead: { place: "Place", prize: "Prize", team: "Team" },
    standingsHead: { team: "Team", series: "Series", maps: "Maps", diff: "Diff" },
    bestOf: (n) => `Bo${n}`,
    advance: (n) => `Top ${n} advance`,
    round: (n) => `Round ${n}`,
    place,
    placeRange: (from, to) => `${place(from)} - ${place(to)}`,
    tbd: "To be decided",
    roster: "Roster",
    allTournaments: "All tournaments",
    viewTournament: "Tournament page",
  },
  footer: { rights: "All rights reserved.", navHeading: "Navigation", watchHeading: "Watch live" },

  roadmap: {
    eyebrow: "2026 season",
    heading: "Three stages. One season.",
    lede: "Nexus Series I is in preparation now. Stages II and III already have their prize pool locked in, with dates to follow.",
    comingSoon: "Coming soon",
    dateTbd: "Dates to be announced",
    detailsTbd: "Format and teams to be announced.",
    totalPrizePool: "Total season prize pool",
  },

  teamsShowcase: {
    eyebrow: "The field",
    heading: "Who's competing this season.",
    cta: "View all teams",
  },
};

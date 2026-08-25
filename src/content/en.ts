import type { Dictionary } from "@types";

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
      "Nexus Series is an esports competition platform built to connect regions, organizations and players through structured international competition.",
      "Our goal is to create a professional competitive environment capable of growing across regions while maintaining strong standards of organization, integrity and competitive excellence.",
    ],
  },

  vision: {
    heading: "Building the next connection in competitive esports.",
    lede: "We aim to build a sustainable competitive platform where organizations, players and communities can connect through high-level esports competition.",
    pillars: [
      {
        title: "Competition",
        body: "Structured environments designed to support serious and professional competition.",
      },
      {
        title: "Connection",
        body: "Creating new opportunities for teams and communities to compete across regions.",
      },
      {
        title: "Growth",
        body: "Building a platform capable of expanding alongside the competitive esports ecosystem.",
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
      quarterfinal: "Quarterfinal",
      semifinal: "Semifinal",
      final: "Final",
      thirdPlace: "Third place",
    },
    teamCount: (n) => `${n} teams`,
    timeZoneNote: "All times are UTC.",
  },
  footer: { rights: "All rights reserved." },
};

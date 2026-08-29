import type { MediaRef } from "@types";
import broadcastBooth from "@assets/broadcast-booth.png";
import teamPractice from "@assets/team-practice.png";
import heroFigures from "@assets/perso.png";
import heroGlow from "@assets/LUZ.png";

export const media = {
  broadcastBooth: {
    src: broadcastBooth,
    alt: "Two casters in headsets at a commentary desk overlooking a packed arena during a live broadcast.",
  },
  teamPractice: {
    src: teamPractice,
    alt: "An esports team leaning in together to review a match in a dark practice room.",
  },
  heroFigures: {
    src: heroFigures,
    alt: "Three marble-toned Dota 2 hero statues lit with a blue glow, standing shoulder to shoulder.",
  },
  heroGlow: {
    src: heroGlow,
    alt: "",
  },
} as const satisfies Record<string, MediaRef>;

export type MediaKey = keyof typeof media;

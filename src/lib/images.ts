import type { MediaRef } from "@types";
import arenaStage from "@assets/arena-stage.png";
import broadcastBooth from "@assets/broadcast-booth.png";
import teamPractice from "@assets/team-practice.png";

/**
 * Image registry. Sections reference a key, never a relative file path, so a
 * photo can be swapped in one place. Alt text describes what is in the frame
 * and does not claim the shot is a Nexus Series event.
 */
export const media = {
  heroStage: {
    src: arenaStage,
    alt: "Competitors facing each other at gaming stations on a lit tournament stage, seen from behind the audience.",
  },
  broadcastBooth: {
    src: broadcastBooth,
    alt: "Two casters in headsets at a commentary desk overlooking a packed arena during a live broadcast.",
  },
  teamPractice: {
    src: teamPractice,
    alt: "An esports team leaning in together to review a match in a dark practice room.",
  },
} as const satisfies Record<string, MediaRef>;

export type MediaKey = keyof typeof media;

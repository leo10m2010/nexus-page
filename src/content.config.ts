import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

/**
 * Competition data lives in editable YAML under src/data/.
 * These schemas are the safety net: if a field is missing, a date is malformed
 * or a match points at a team that does not exist, the build stops and tells
 * you which file and which line. Nothing silently renders wrong.
 *
 * Everything a tournament page adds on top of the basics is OPTIONAL. A
 * tournament with only the original seven fields still validates and still
 * renders: the sections it has no data for are simply not drawn.
 */

/** One player line inside a roster. */
const player = z.object({
  handle: z.string(),
  /** Optional legal name, shown quietly next to the handle. */
  name: z.string().optional(),
  /** Free text: "Captain", "Coach", "Substitute"... */
  role: z.string().optional(),
  /** Two-letter country code, uppercased for display. Not a flag image. */
  country: z.string().length(2).optional(),
});

const teams = defineCollection({
  loader: file("src/data/teams.yaml"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    /** Two to four letters, shown in the monogram and in scorelines. */
    tag: z.string().min(2).max(4),
    region: z.string(),
    /** Optional path under /public once a real logo exists. */
    logo: z.string().optional(),
    /** Optional roster, listed on the tournament participants section. */
    players: z.array(player).optional(),
  }),
});

/** How a team got into the tournament. Key into the dictionary. */
const qualification = z.enum(["invited", "qualifier", "regional", "defending"]);

const tournaments = defineCollection({
  loader: file("src/data/tournaments.yaml"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["upcoming", "live", "finished"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    region: z.string(),
    /** Key into the dictionary, so the format name is translated. */
    format: z.enum(["doubleElimination", "singleElimination", "roundRobin", "swiss"]),
    teamCount: z.number().int().positive(),

    /* ---- everything below is optional detail for the tournament page ---- */

    /** Who runs it. Defaults to the site name when absent. */
    organizer: z.string().optional(),
    /** Key into the dictionary: played online, on stage, or both. */
    venue: z.enum(["online", "offline", "hybrid"]).optional(),
    /** Free text, only meaningful for offline events: "Madrid, Spain". */
    location: z.string().optional(),
    /** Free text badge above the title: "Season One", "Major"... */
    series: z.string().optional(),

    prizePool: z
      .object({
        /** ISO 4217 code. The amount is formatted per locale from this. */
        currency: z.string().length(3),
        total: z.number().nonnegative(),
        /** Payouts, best place first. `to` makes it a range: 3rd - 4th. */
        distribution: z
          .array(
            z.object({
              place: z.number().int().positive(),
              to: z.number().int().positive().optional(),
              amount: z.number().nonnegative(),
              /** Filled in once the place is decided. A team id. */
              team: z.string().optional(),
            }),
          )
          .optional(),
      })
      .optional(),

    /** The stages the tournament runs through, in order. */
    phases: z
      .array(
        z.object({
          /** Key into the dictionary, so the phase name is translated. */
          key: z.enum(["qualifier", "groupStage", "swissStage", "playoffs", "finals"]),
          format: z.enum(["doubleElimination", "singleElimination", "roundRobin", "swiss"]),
          teamCount: z.number().int().positive().optional(),
          /** 1, 3, 5... rendered as Bo1 / Bo3 / Bo5. */
          bestOf: z.number().int().positive().optional(),
          /** How many teams carry on to the next phase. */
          advance: z.number().int().positive().optional(),
        }),
      )
      .optional(),

    /** The field. Without it the participants section is not drawn. */
    participants: z
      .array(z.object({ team: z.string(), via: qualification.optional() }))
      .optional(),
  }),
});

const matches = defineCollection({
  loader: file("src/data/matches.yaml"),
  schema: z.object({
    id: z.string(),
    tournament: z.string(),
    /** Key into the dictionary, so the stage name is translated. */
    stage: z.enum([
      "groupStage",
      "lowerRound",
      "quarterfinal",
      "semifinal",
      "upperFinal",
      "lowerFinal",
      "final",
      "grandFinal",
      "thirdPlace",
    ]),
    /** Full ISO timestamp with zone, so times render correctly per locale. */
    startsAt: z.coerce.date(),
    /** A team id, or omitted while the slot is still to be decided. */
    home: z.string().optional(),
    away: z.string().optional(),
    /** Omit entirely while the match has not been played. */
    score: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),

    /* ---- optional, only needed to draw a bracket or a group table ---- */

    /** 1, 3, 5... rendered as Bo1 / Bo3 / Bo5. */
    bestOf: z.number().int().positive().optional(),
    /** Which half of a double elimination bracket this match sits in. */
    bracket: z.enum(["upper", "lower", "final"]).optional(),
    /** Column within that bracket, 1 = first round. */
    round: z.number().int().positive().optional(),
    /** Group letter, for a group stage standings table: "A", "B"... */
    group: z.string().optional(),
  }),
});

export const collections = { teams, tournaments, matches };

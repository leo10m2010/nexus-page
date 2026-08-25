import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

/**
 * Competition data lives in editable YAML under src/data/.
 * These schemas are the safety net: if a field is missing, a date is malformed
 * or a match points at a team that does not exist, the build stops and tells
 * you which file and which line. Nothing silently renders wrong.
 */

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
  }),
});

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
  }),
});

const matches = defineCollection({
  loader: file("src/data/matches.yaml"),
  schema: z.object({
    id: z.string(),
    tournament: z.string(),
    /** Key into the dictionary, so the stage name is translated. */
    stage: z.enum(["groupStage", "quarterfinal", "semifinal", "final", "thirdPlace"]),
    /** Full ISO timestamp with zone, so times render correctly per locale. */
    startsAt: z.coerce.date(),
    home: z.string(),
    away: z.string(),
    /** Omit entirely while the match has not been played. */
    score: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  }),
});

export const collections = { teams, tournaments, matches };

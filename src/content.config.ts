import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

const player = z.object({
  handle: z.string(),

  name: z.string().optional(),

  role: z.string().optional(),

  country: z.string().length(2).optional(),
});

const teams = defineCollection({
  loader: file("src/data/teams.yaml"),
  schema: z.object({
    id: z.string(),
    name: z.string(),

    tag: z.string().min(2).max(4),
    region: z.string(),

    logo: z.string().optional(),

    players: z.array(player).optional(),
  }),
});

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

    format: z.enum(["doubleElimination", "singleElimination", "roundRobin", "swiss"]),
    teamCount: z.number().int().positive(),

    organizer: z.string().optional(),

    venue: z.enum(["online", "offline", "hybrid"]).optional(),

    location: z.string().optional(),

    series: z.string().optional(),

    prizePool: z
      .object({

        currency: z.string().length(3),
        total: z.number().nonnegative(),

        distribution: z
          .array(
            z.object({
              place: z.number().int().positive(),
              to: z.number().int().positive().optional(),
              amount: z.number().nonnegative(),

              team: z.string().optional(),
            }),
          )
          .optional(),
      })
      .optional(),

    phases: z
      .array(
        z.object({

          key: z.enum(["qualifier", "groupStage", "swissStage", "playoffs", "finals"]),
          format: z.enum(["doubleElimination", "singleElimination", "roundRobin", "swiss"]),
          teamCount: z.number().int().positive().optional(),

          bestOf: z.number().int().positive().optional(),

          advance: z.number().int().positive().optional(),
        }),
      )
      .optional(),

    participants: z
      .array(z.object({ team: z.string(), via: qualification.optional() }))
      .optional(),

    broadcastTalent: z
      .array(
        z.object({
          name: z.string(),
          role: z.string(),
          icon: z.string(),
          href: z.string(),
        }),
      )
      .optional(),
  }),
});

const matches = defineCollection({
  loader: file("src/data/matches.yaml"),
  schema: z.object({
    id: z.string(),
    tournament: z.string(),

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

    startsAt: z.coerce.date(),

    home: z.string().optional(),
    away: z.string().optional(),

    score: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),

    bestOf: z.number().int().positive().optional(),

    bracket: z.enum(["upper", "lower", "final"]).optional(),

    round: z.number().int().positive().optional(),

    group: z.string().optional(),
  }),
});

export const collections = { teams, tournaments, matches };

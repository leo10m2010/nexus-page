import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const player = z.object({
  handle: z.string(),
  country: z.string().length(2).optional(),
});

const teams = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/data/teams" }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string(),
    tag: z.string().min(2).max(4),
    country: z.string().length(2).optional(),
    region: z.string().optional(),
    logo: z.string().optional(),
    players: z.array(player).optional(),
    liquipediaUrl: z.url().optional(),
    liquipediaLogoSource: z.url().optional(),
    liquipediaLogoSha1: z.string().optional(),
    liquipediaImportedAt: z.iso.datetime().optional(),
  }),
});

const sponsor = z.object({
  name: z.string(),
  logo: z.string(),
  url: z
    .url()
    .refine(
      (url) => /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?(?:\/[^\s]*)?$/.test(url),
      "Usa una URL HTTPS completa y sin espacios",
    )
    .optional(),
  tier: z.enum(["principal", "official", "collaborator"]).default("official"),
  surface: z.enum(["auto", "light", "dark"]).default("auto"),
  active: z.boolean().default(true),
});

const sponsors = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/data/sponsors" }),
  schema: z.object({
    sponsors: z.array(sponsor).default([]),
  }),
});

const qualification = z.enum(["invited", "qualifier", "regional", "defending"]);
const bestOf = z
  .number()
  .int()
  .positive()
  .refine((value) => value % 2 === 1, "El mejor de debe ser impar");

const tournaments = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/data/tournaments" }),
  schema: z
    .object({
      id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      name: z.string(),
      status: z.enum(["upcoming", "live", "finished"]),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      region: z.string(),
      venue: z.enum(["online", "offline", "hybrid"]).optional(),
      location: z.string().optional(),
      roadmapIcon: z.string().optional(),
      roadmapColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      liquipediaUrl: z.url().optional(),
      prizePool: z
        .object({
          currency: z.string().regex(/^[A-Z]{3}$/),
          distribution: z
            .array(
              z.object({
                place: z.number().int().positive(),
                to: z.number().int().positive().optional(),
                amount: z.number().nonnegative(),
              }),
            )
            .min(1),
        })
        .optional(),
      phases: z
        .array(
          z.object({
            key: z.enum(["groupStage", "playoffs", "finals"]),
            format: z.enum(["doubleElimination", "singleElimination", "roundRobin"]),
            teamCount: z.number().int().positive().optional(),
            bestOf: bestOf.optional(),
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
            icon: z.string(),
            href: z.url(),
          }),
        )
        .optional(),
    })
    .superRefine((tournament, ctx) => {
      const phaseKeys = new Set<string>();
      for (const [index, phase] of (tournament.phases ?? []).entries()) {
        if (phaseKeys.has(phase.key)) {
          ctx.addIssue({ code: "custom", path: ["phases", index, "key"], message: "La fase está repetida" });
        }
        phaseKeys.add(phase.key);
        if (phase.teamCount && phase.advance && phase.advance > phase.teamCount) {
          ctx.addIssue({
            code: "custom",
            path: ["phases", index, "advance"],
            message: "No pueden avanzar más equipos de los que participan",
          });
        }
      }
    }),
});

const matches = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/data/matches" }),
  schema: z
    .object({
      id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
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
      score: z
        .object({
          home: z.number().int().min(0),
          away: z.number().int().min(0),
        })
        .optional(),
      bestOf: bestOf.optional(),
      bracket: z.enum(["upper", "lower", "final"]).optional(),
      round: z.number().int().positive().optional(),
      group: z.string().optional(),
    })
    .superRefine((match, ctx) => {
      if (match.stage === "groupStage" && !match.group) {
        ctx.addIssue({ code: "custom", path: ["group"], message: "Los partidos de grupos necesitan un grupo" });
      }
      if (match.stage !== "groupStage" && (!match.bracket || !match.round)) {
        ctx.addIssue({ code: "custom", path: ["bracket"], message: "Los cruces necesitan bracket y ronda" });
      }
      if (match.score && match.score.home === match.score.away) {
        ctx.addIssue({ code: "custom", path: ["score"], message: "El resultado no puede terminar empatado" });
      }
      if (match.score && (!match.home || !match.away)) {
        ctx.addIssue({ code: "custom", path: ["score"], message: "Completa ambos equipos antes del resultado" });
      }
    }),
});

const bracketSource = z.object({
  match: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  outcome: z.enum(["winner", "loser"]),
});

const bracketMatch = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    stage: z.enum([
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
    homeSource: bracketSource.optional(),
    awaySource: bracketSource.optional(),
    score: z
      .object({
        home: z.number().int().min(0),
        away: z.number().int().min(0),
      })
      .optional(),
    bestOf: bestOf.optional(),
    bracket: z.enum(["upper", "lower", "final"]),
    round: z.number().int().positive(),
    slot: z.number().int().positive(),
  })
  .superRefine((match, ctx) => {
    for (const side of ["home", "away"] as const) {
      if (match[side] && match[`${side}Source`]) {
        ctx.addIssue({
          code: "custom",
          path: [side],
          message: "Un asiento no puede tener equipo directo y origen al mismo tiempo",
        });
      }
    }
    if (match.score && match.score.home === match.score.away) {
      ctx.addIssue({ code: "custom", path: ["score"], message: "El resultado no puede terminar empatado" });
    }
  });

const brackets = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/data/brackets" }),
  schema: z
    .object({
      id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      tournament: z.string(),
      defaultBestOf: bestOf,
      matches: z.array(bracketMatch).min(1),
    })
    .superRefine((bracket, ctx) => {
      const ids = new Set<string>();
      const positions = new Set<string>();
      const directTeams = new Set<string>();
      const sourceUses = new Set<string>();

      for (const [index, match] of bracket.matches.entries()) {
        if (ids.has(match.id)) {
          ctx.addIssue({ code: "custom", path: ["matches", index, "id"], message: "El ID del cruce está repetido" });
        }
        ids.add(match.id);

        const position = `${match.bracket}:${match.round}:${match.slot}`;
        if (positions.has(position)) {
          ctx.addIssue({ code: "custom", path: ["matches", index, "slot"], message: "La posición del cruce está repetida" });
        }
        positions.add(position);
      }

      for (const [index, match] of bracket.matches.entries()) {
        for (const side of ["home", "away"] as const) {
          const directTeam = match[side];
          if (directTeam && directTeams.has(directTeam)) {
            ctx.addIssue({
              code: "custom",
              path: ["matches", index, side],
              message: "Un equipo no puede ocupar dos asientos iniciales",
            });
          }
          if (directTeam) directTeams.add(directTeam);

          const source = match[`${side}Source`];
          if (source && !ids.has(source.match)) {
            ctx.addIssue({
              code: "custom",
              path: ["matches", index, `${side}Source`, "match"],
              message: "El cruce de origen no existe en este bracket",
            });
          }
          if (source) {
            const sourceUse = `${source.match}:${source.outcome}`;
            if (sourceUses.has(sourceUse)) {
              ctx.addIssue({
                code: "custom",
                path: ["matches", index, `${side}Source`],
                message: "Ese resultado de origen ya alimenta otro asiento",
              });
            }
            sourceUses.add(sourceUse);
          }
        }
      }
    }),
});

export const collections = { teams, sponsors, tournaments, matches, brackets };

import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { dayKey } from "@lib/format";
import { DEFAULT_LOCALE } from "@lib/i18n";
import type { Locale } from "@types";

export type Team = CollectionEntry<"teams">["data"];
export type Tournament = CollectionEntry<"tournaments">["data"];
type GroupMatch = CollectionEntry<"matches">["data"];
type BracketDocument = CollectionEntry<"brackets">["data"];
type BracketMatch = BracketDocument["matches"][number];
type MatchStage = GroupMatch["stage"] | BracketMatch["stage"];

export interface Match {
  id: string;
  tournament: string;
  stage: MatchStage;
  startsAt: Date;
  home?: string;
  away?: string;
  score?: { home: number; away: number };
  bestOf?: number;
  bracket?: BracketMatch["bracket"];
  round?: number;
  slot?: number;
  group?: string;
}
export type Player = NonNullable<Team["players"]>[number];
export type Phase = NonNullable<Tournament["phases"]>[number];

export interface ResolvedMatch extends Omit<Match, "home" | "away" | "tournament"> {
  home: Team | null;
  away: Team | null;
  tournament: Tournament;
}

export interface Participant {
  team: Team;
  via?: NonNullable<Tournament["participants"]>[number]["via"];
}

export interface BracketRound {
  round: number;

  stage: Match["stage"] | null;
  matches: ResolvedMatch[];
}

export interface BracketSide {
  side: NonNullable<Match["bracket"]>;
  rounds: BracketRound[];
}

export interface StandingRow {
  team: Team;
  wins: number;
  losses: number;
  mapsWon: number;
  mapsLost: number;
}

export interface Group {
  name: string;
  rows: StandingRow[];
}

const STATUS_ORDER = { live: 0, upcoming: 1, finished: 2 } as const;

const NAMED_STAGES = new Set<Match["stage"]>([
  "quarterfinal",
  "semifinal",
  "upperFinal",
  "lowerFinal",
  "final",
  "grandFinal",
  "thirdPlace",
]);

const FINAL_STAGES = new Set<Match["stage"]>(["final", "grandFinal"]);

function getPhaseForStage(tournament: Tournament, stage: Match["stage"]): Phase | undefined {
  const phases = tournament.phases ?? [];
  if (stage === "groupStage") return phases.find((phase) => phase.key === "groupStage");
  if (FINAL_STAGES.has(stage)) {
    return phases.find((phase) => phase.key === "finals") ?? phases.find((phase) => phase.key === "playoffs");
  }
  return phases.find((phase) => phase.key === "playoffs") ?? phases.find((phase) => phase.key === "finals");
}

function hasWinningScore(match: BracketMatch, document: BracketDocument): boolean {
  if (!match.score || match.score.home === match.score.away) return false;
  const bestOf = match.bestOf ?? document.defaultBestOf;
  const winsNeeded = Math.floor(bestOf / 2) + 1;
  return Math.max(match.score.home, match.score.away) === winsNeeded && Math.min(match.score.home, match.score.away) < winsNeeded;
}

function flattenBracket(document: BracketDocument): Match[] {
  const matchById = new Map(document.matches.map((match) => [match.id, match]));
  const resolving = new Set<string>();

  const resolveSide = (match: BracketMatch, side: "home" | "away"): string | undefined => {
    const direct = match[side];
    if (direct) return direct;

    const source = match[`${side}Source`];
    if (!source) return undefined;
    if (resolving.has(match.id)) {
      throw new Error(`brackets.yaml: "${document.id}" contains a progression cycle at "${match.id}"`);
    }

    const sourceMatch = matchById.get(source.match);
    if (!sourceMatch) {
      throw new Error(`brackets.yaml: "${match.id}" points at unknown source "${source.match}"`);
    }

    resolving.add(match.id);
    const home = resolveSide(sourceMatch, "home");
    const away = resolveSide(sourceMatch, "away");
    resolving.delete(match.id);

    if (!home || !away || !sourceMatch.score || !hasWinningScore(sourceMatch, document)) {
      return undefined;
    }

    const homeWins = sourceMatch.score.home > sourceMatch.score.away;
    if (source.outcome === "winner") return homeWins ? home : away;
    return homeWins ? away : home;
  };

  return document.matches.map((match) => ({
    id: match.id,
    tournament: document.tournament,
    stage: match.stage,
    startsAt: match.startsAt,
    home: resolveSide(match, "home"),
    away: resolveSide(match, "away"),
    score: match.score,
    bestOf: match.bestOf ?? document.defaultBestOf,
    bracket: match.bracket,
    round: match.round,
    slot: match.slot,
  }));
}

export function getTournamentTeamCount(tournament: Tournament): number | null {
  return tournament.participants?.length ?? null;
}

export function getTournamentFormats(tournament: Tournament): Phase["format"][] {
  return [...new Set((tournament.phases ?? []).map((phase) => phase.format))];
}

export function getPrizeTotal(tournament: Tournament): number | null {
  const distribution = tournament.prizePool?.distribution;
  if (!distribution?.length) return null;
  return distribution.reduce(
    (sum, row) => sum + row.amount * ((row.to ?? row.place) - row.place + 1),
    0,
  );
}

function getMatchPhase(tournament: Tournament, match: Match): Phase | undefined {
  return getPhaseForStage(tournament, match.stage);
}

export async function getTeams(): Promise<Team[]> {
  const entries = await getCollection("teams");
  return entries
    .map((e) => e.data)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTournaments(): Promise<Tournament[]> {
  const entries = await getCollection("tournaments");
  return entries
    .map((e) => e.data)
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        a.startDate.getTime() - b.startDate.getTime(),
    );
}

export async function getTournament(id: string): Promise<Tournament> {
  const found = (await getTournaments()).find((t) => t.id === id);
  if (!found) throw new Error(`No tournament with id "${id}" in tournaments.yaml`);
  return found;
}

export function tournamentPath(id: string, locale: Locale = DEFAULT_LOCALE): string {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${prefix}/competition/${id}/`;
}

async function getResolvedMatches(): Promise<ResolvedMatch[]> {
  const [groupMatches, bracketDocuments, teams, tournaments] = await Promise.all([
    getCollection("matches"),
    getCollection("brackets"),
    getTeams(),
    getTournaments(),
  ]);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const tournamentById = new Map(tournaments.map((t) => [t.id, t]));
  const matches: Match[] = [
    ...groupMatches.map(({ data }) => data),
    ...bracketDocuments.flatMap(({ data }) => {
      const tournament = tournamentById.get(data.tournament);
      if (!tournament) {
        throw new Error(`brackets.yaml: "${data.id}" points at unknown tournament "${data.tournament}"`);
      }
      return flattenBracket(data);
    }),
  ];

  const side = (id: string | undefined, matchId: string): Team | null => {
    if (id == null) return null;
    const team = teamById.get(id);
    if (!team) throw new Error(`matches.yaml: "${matchId}" points at unknown team "${id}"`);
    return team;
  };

  return matches.map((data) => {
    const tournament = tournamentById.get(data.tournament);
    if (!tournament) {
      throw new Error(`matches.yaml: "${data.id}" points at unknown tournament "${data.tournament}"`);
    }

    const defaultPhase = getMatchPhase(tournament, data);

    return {
      ...data,
      bestOf: data.bestOf ?? defaultPhase?.bestOf,
      home: side(data.home, data.id),
      away: side(data.away, data.id),
      tournament,
    };
  });
}

export async function getMatches(tournamentId: string): Promise<ResolvedMatch[]> {
  return (await getResolvedMatches())
    .filter((m) => m.tournament.id === tournamentId)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export async function getSchedule(
  tournamentId?: string,
): Promise<{ day: string; date: Date; matches: ResolvedMatch[] }[]> {
  const upcoming = (await getResolvedMatches())
    .filter((m) => !m.score && m.home && m.away)
    .filter((m) => !tournamentId || m.tournament.id === tournamentId)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const groups = new Map<string, ResolvedMatch[]>();
  for (const match of upcoming) {
    const key = dayKey(match.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), match]);
  }

  return [...groups.entries()].map(([day, matches]) => ({
    day,
    date: matches[0]!.startsAt,
    matches,
  }));
}

export async function getResults(limit?: number, tournamentId?: string): Promise<ResolvedMatch[]> {
  const played = (await getResolvedMatches())
    .filter((m) => m.score)
    .filter((m) => !tournamentId || m.tournament.id === tournamentId)
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

  return limit ? played.slice(0, limit) : played;
}

export async function getBracket(tournamentId: string): Promise<BracketSide[]> {
  const inBracket = (await getMatches(tournamentId)).filter((m) => m.bracket && m.round);
  const sides: NonNullable<Match["bracket"]>[] = ["upper", "lower", "final"];

  return sides
    .map((side) => {
      const rounds = new Map<number, ResolvedMatch[]>();
      for (const match of inBracket.filter((m) => m.bracket === side)) {
        rounds.set(match.round!, [...(rounds.get(match.round!) ?? []), match]);
      }

      return {
        side,
        rounds: [...rounds.entries()]
          .sort(([a], [b]) => a - b)
          .map(([round, matches]) => ({
            round,
            stage:
              matches.every((m) => m.stage === matches[0]!.stage) && NAMED_STAGES.has(matches[0]!.stage)
                ? matches[0]!.stage
                : null,
            matches: [...matches].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)),
          })),
      };
    })
    .filter((s) => s.rounds.length > 0);
}

export async function getGroups(tournamentId: string): Promise<Group[]> {
  const played = (await getMatches(tournamentId)).filter(
    (m) => m.group && m.score && m.home && m.away,
  );

  const byGroup = new Map<string, Map<string, StandingRow>>();

  for (const match of played) {
    const { home: homeScore, away: awayScore } = match.score!;
    const table = byGroup.get(match.group!) ?? new Map<string, StandingRow>();
    byGroup.set(match.group!, table);

    for (const [team, won, lost] of [
      [match.home!, homeScore, awayScore],
      [match.away!, awayScore, homeScore],
    ] as const) {
      const row = table.get(team.id) ?? {
        team,
        wins: 0,
        losses: 0,
        mapsWon: 0,
        mapsLost: 0,
      };
      row.mapsWon += won;
      row.mapsLost += lost;
      if (won > lost) row.wins += 1;
      else row.losses += 1;
      table.set(team.id, row);
    }
  }

  return [...byGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, table]) => ({
      name,
      rows: [...table.values()].sort(
        (a, b) =>
          b.wins - a.wins ||
          b.mapsWon - b.mapsLost - (a.mapsWon - a.mapsLost) ||
          a.team.name.localeCompare(b.team.name),
      ),
    }));
}

export async function getParticipants(tournament: Tournament): Promise<Participant[]> {
  if (!tournament.participants?.length) return [];

  const teamById = new Map((await getTeams()).map((t) => [t.id, t]));
  return tournament.participants.map(({ team, via }) => {
    const found = teamById.get(team);
    if (!found) {
      throw new Error(`tournaments.yaml: "${tournament.id}" lists unknown team "${team}"`);
    }
    return { team: found, via };
  });
}

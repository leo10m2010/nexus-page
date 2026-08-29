import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { dayKey } from "@lib/format";
import { DEFAULT_LOCALE } from "@lib/i18n";
import type { Locale } from "@types";

export type Team = CollectionEntry<"teams">["data"];
export type Tournament = CollectionEntry<"tournaments">["data"];
export type Match = CollectionEntry<"matches">["data"];
export type Player = NonNullable<Team["players"]>[number];
export type Phase = NonNullable<Tournament["phases"]>[number];
export type Payout = NonNullable<NonNullable<Tournament["prizePool"]>["distribution"]>[number];

export interface ResolvedMatch extends Omit<Match, "home" | "away" | "tournament"> {
  home: Team | null;
  away: Team | null;
  tournament: Tournament;
}

export interface Participant {
  team: Team;
  via?: NonNullable<Tournament["participants"]>[number]["via"];

  payout?: Payout;
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
  const [matches, teams, tournaments] = await Promise.all([
    getCollection("matches"),
    getTeams(),
    getTournaments(),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const tournamentById = new Map(tournaments.map((t) => [t.id, t]));

  const side = (id: string | undefined, matchId: string): Team | null => {
    if (id == null) return null;
    const team = teamById.get(id);
    if (!team) throw new Error(`matches.yaml: "${matchId}" points at unknown team "${id}"`);
    return team;
  };

  return matches.map(({ data }) => {
    const tournament = tournamentById.get(data.tournament);
    if (!tournament) {
      throw new Error(`matches.yaml: "${data.id}" points at unknown tournament "${data.tournament}"`);
    }

    return {
      ...data,
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
            matches,
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
    const [homeScore, awayScore] = match.score!;
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
  const payoutByTeam = new Map(
    (tournament.prizePool?.distribution ?? [])
      .filter((row) => row.team)
      .map((row) => [row.team!, row]),
  );

  return tournament.participants.map(({ team, via }) => {
    const found = teamById.get(team);
    if (!found) {
      throw new Error(`tournaments.yaml: "${tournament.id}" lists unknown team "${team}"`);
    }
    return { team: found, via, payout: payoutByTeam.get(team) };
  });
}

import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { dayKey } from "@lib/format";

export type Team = CollectionEntry<"teams">["data"];
export type Tournament = CollectionEntry<"tournaments">["data"];
export type Match = CollectionEntry<"matches">["data"];

/** A match with its team and tournament references already resolved. */
export interface ResolvedMatch extends Omit<Match, "home" | "away" | "tournament"> {
  home: Team;
  away: Team;
  tournament: Tournament;
}

const STATUS_ORDER = { live: 0, upcoming: 1, finished: 2 } as const;

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

/**
 * Resolves every match against the teams and tournaments collections.
 * A reference that does not exist throws here rather than rendering a blank
 * row, so a typo in matches.yaml fails the build with the offending id.
 */
async function getResolvedMatches(): Promise<ResolvedMatch[]> {
  const [matches, teams, tournaments] = await Promise.all([
    getCollection("matches"),
    getTeams(),
    getTournaments(),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const tournamentById = new Map(tournaments.map((t) => [t.id, t]));

  return matches.map(({ data }) => {
    const home = teamById.get(data.home);
    const away = teamById.get(data.away);
    const tournament = tournamentById.get(data.tournament);

    if (!home) throw new Error(`matches.yaml: "${data.id}" points at unknown team "${data.home}"`);
    if (!away) throw new Error(`matches.yaml: "${data.id}" points at unknown team "${data.away}"`);
    if (!tournament) {
      throw new Error(`matches.yaml: "${data.id}" points at unknown tournament "${data.tournament}"`);
    }

    return { ...data, home, away, tournament };
  });
}

/** Matches with no score yet, soonest first, grouped by calendar day. */
export async function getSchedule(): Promise<{ day: string; date: Date; matches: ResolvedMatch[] }[]> {
  const upcoming = (await getResolvedMatches())
    .filter((m) => !m.score)
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

/** Played matches, most recent first. */
export async function getResults(limit?: number): Promise<ResolvedMatch[]> {
  const played = (await getResolvedMatches())
    .filter((m) => m.score)
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

  return limit ? played.slice(0, limit) : played;
}

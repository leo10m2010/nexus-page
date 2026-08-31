import { roadmapPlaceholders } from "@config/roadmap";
import { getParticipants, getPrizeTotal, getTournaments, tournamentPath } from "@lib/competition";
import { formatDateRange } from "@lib/format";
import type { Team, Tournament } from "@lib/competition";
import type { Locale } from "@types";

export interface RoadmapStage {
  name: string;
  href: string | null;
  dates: string | null;
  status: Tournament["status"] | null;
  prizeTotal: number;
  currency: string;
  teams: Team[] | null;
  teamCount: number | null;
  icon: string | null;
  accent: string;
  liquipediaUrl: string | null;
}

export function getRoadmapNumeral(index: number): string {
  let value = index + 1;
  if (!Number.isInteger(value) || value < 1 || value > 3999) return String(value);

  const numerals: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [amount, numeral] of numerals) {
    while (value >= amount) {
      result += numeral;
      value -= amount;
    }
  }
  return result;
}

export async function getRoadmapStages(locale: Locale): Promise<RoadmapStage[]> {
  const tournaments = [...await getTournaments()].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime() || a.id.localeCompare(b.id),
  );
  const tournamentStages = await Promise.all(
    tournaments.map(async (tour, index): Promise<RoadmapStage> => {
      const participants = await getParticipants(tour);
      const placeholder = roadmapPlaceholders[index];
      return {
        name: tour.name,
        href: tournamentPath(tour.id, locale),
        dates: formatDateRange(tour.startDate, tour.endDate, locale),
        status: tour.status,
        prizeTotal: getPrizeTotal(tour) ?? 0,
        currency: tour.prizePool?.currency ?? "USD",
        teams: participants.map((p) => p.team),
        teamCount: tour.participants ? participants.length : null,
        icon: tour.roadmapIcon ?? placeholder?.icon ?? null,
        accent: tour.roadmapColor ?? placeholder?.accent ?? "#1477e7",
        liquipediaUrl: tour.liquipediaUrl ?? null,
      };
    }),
  );
  const placeholders = roadmapPlaceholders.slice(tournamentStages.length).map((stage): RoadmapStage => ({
    name: stage.name,
    href: null,
    dates: formatDateRange(new Date(stage.startDate), new Date(stage.endDate), locale),
    status: null,
    prizeTotal: stage.prizePool.total,
    currency: stage.prizePool.currency,
    teams: null,
    teamCount: null,
    icon: stage.icon ?? null,
    accent: stage.accent,
    liquipediaUrl: null,
  }));

  return [...tournamentStages, ...placeholders];
}

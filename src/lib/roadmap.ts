import { roadmapSeries } from "@config/roadmap";
import { getParticipants, getTournament, tournamentPath } from "@lib/competition";
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
}

export const ROMAN_NUMERALS = ["I", "II", "III"];

export async function getRoadmapStages(locale: Locale): Promise<RoadmapStage[]> {
  return Promise.all(
    roadmapSeries.map(async (stage): Promise<RoadmapStage> => {
      if (stage.tournamentId) {
        const tour = await getTournament(stage.tournamentId);
        const participants = await getParticipants(tour);
        return {
          name: tour.name,
          href: tournamentPath(tour.id, locale),
          dates: formatDateRange(tour.startDate, tour.endDate, locale),
          status: tour.status,
          prizeTotal: tour.prizePool?.total ?? 0,
          currency: tour.prizePool?.currency ?? "USD",
          teams: participants.map((p) => p.team),
          teamCount: tour.teamCount,
        };
      }
      return {
        name: stage.name!,
        href: null,
        dates: null,
        status: null,
        prizeTotal: stage.prizePool?.total ?? 0,
        currency: stage.prizePool?.currency ?? "USD",
        teams: null,
        teamCount: null,
      };
    }),
  );
}

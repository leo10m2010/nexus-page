export interface RoadmapStage {

  tournamentId?: string;

  name?: string;
  prizePool?: { currency: string; total: number };
}

export const roadmapSeries: RoadmapStage[] = [
  { tournamentId: "season-one" },
  { name: "Nexus Series II", prizePool: { currency: "USD", total: 20000 } },
  { name: "Nexus Series III", prizePool: { currency: "USD", total: 20000 } },
];

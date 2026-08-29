/**
 * The three-stage 2026 season shown on the homepage roadmap.
 *
 * Stage one points at a real entry in tournaments.yaml, so its card reads
 * name, dates and prize pool live from the same data the competition page
 * uses: it cannot drift out of sync. Stages two and three are funded but
 * undated yet, so they carry only a name and a prize pool until a real
 * tournament entry exists for them.
 */
export interface RoadmapStage {
  /** Id of a tournament in tournaments.yaml. Present once a stage is real. */
  tournamentId?: string;
  /** Only used while the stage has no tournament entry yet. */
  name?: string;
  prizePool?: { currency: string; total: number };
}

export const roadmapSeries: RoadmapStage[] = [
  { tournamentId: "season-one" },
  { name: "Nexus Series II", prizePool: { currency: "USD", total: 20000 } },
  { name: "Nexus Series III", prizePool: { currency: "USD", total: 20000 } },
];

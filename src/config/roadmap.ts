export interface RoadmapPlaceholder {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  accent: string;
  icon?: string;
  prizePool: { currency: string; total: number };
}

export const roadmapPlaceholders: RoadmapPlaceholder[] = [
  {
    id: "season-one",
    name: "Nexus Series I",
    startDate: "2026-09-06",
    endDate: "2026-09-15",
    accent: "#1477e7",
    icon: "/seasons/nexus-series-i.png",
    prizePool: { currency: "USD", total: 10000 },
  },
  {
    id: "season-two",
    name: "Nexus Series II",
    startDate: "2026-10-15",
    endDate: "2026-10-27",
    accent: "#8b3dff",
    prizePool: { currency: "USD", total: 20000 },
  },
  {
    id: "season-three",
    name: "Nexus Series III",
    startDate: "2026-12-10",
    endDate: "2026-12-22",
    accent: "#ff174d",
    prizePool: { currency: "USD", total: 20000 },
  },
];

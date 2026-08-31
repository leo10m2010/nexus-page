export interface RoadmapPlaceholder {
  name: string;
  startDate: string;
  endDate: string;
  accent: string;
  icon?: string;
  prizePool: { currency: string; total: number };
}

export const roadmapPlaceholders: RoadmapPlaceholder[] = [
  {
    name: "Nexus Series I",
    startDate: "2026-09-06",
    endDate: "2026-09-15",
    accent: "#1477e7",
    icon: "/seasons/nexus-series-i.png",
    prizePool: { currency: "USD", total: 10000 },
  },
  {
    name: "Nexus Series II",
    startDate: "2026-10-15",
    endDate: "2026-10-27",
    accent: "#8b3dff",
    prizePool: { currency: "USD", total: 20000 },
  },
  {
    name: "Nexus Series III",
    startDate: "2026-12-10",
    endDate: "2026-12-22",
    accent: "#ff174d",
    prizePool: { currency: "USD", total: 20000 },
  },
];

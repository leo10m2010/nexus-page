/** Edition accents stay inside the tournament surface, never on the page root. */
export function editionStyle(color?: string): string | undefined {
  if (!color || !/^#[0-9a-f]{6}$/i.test(color) || ["#1477e7", "#2595d3"].includes(color.toLowerCase())) return undefined;
  return [
    `--edition-accent:${color}`,
    `--edition-ink:color-mix(in srgb, ${color} 60%, #fff)`,
    `--edition-surface:color-mix(in srgb, ${color} 13%, #0b1015)`,
    "--c-accent:var(--edition-accent)",
    "--c-accent-lift:var(--edition-ink)",
    "--c-brand:var(--edition-accent)",
    "--c-brand-lift:var(--edition-ink)",
    "--color-accent:var(--edition-accent)",
    "--color-accent-lift:var(--edition-ink)",
  ].join(";");
}

interface RosterEdition {
  status: "live" | "upcoming" | "finished";
  startDate: Date | string;
  endDate: Date | string;
  participants?: readonly unknown[];
}

const timestamp = (date: Date | string): number => (typeof date === "string" ? new Date(date) : date).getTime();

/** An unannounced next roster must not be filled with teams from another edition. */
export function selectShowcaseTournament<T extends RosterEdition>(tournaments: readonly T[]): T | undefined {
  const chronological = [...tournaments].sort((a, b) => timestamp(a.startDate) - timestamp(b.startDate));
  const featured = chronological.find(tournament => tournament.status === "live")
    ?? chronological.find(tournament => tournament.status === "upcoming");
  if (featured?.participants?.length) return featured;
  return [...tournaments]
    .filter(tournament => tournament.status === "finished" && tournament.participants?.length)
    .sort((a, b) => timestamp(b.endDate) - timestamp(a.endDate))[0];
}

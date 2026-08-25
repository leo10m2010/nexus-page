/**
 * Referential check for the competition data.
 *
 * The Zod schemas in src/content.config.ts validate each file on its own, but
 * they cannot see across files, and they only run when the page is actually
 * built. This runs always, so a match pointing at a team that does not exist
 * is caught even while the page is unpublished.
 *
 * Run with: npm run check:data   (also runs as part of npm run build)
 */
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const load = (name) => parse(readFileSync(`src/data/${name}.yaml`, "utf8")) ?? [];

const teams = load("teams");
const tournaments = load("tournaments");
const matches = load("matches");

const problems = [];

const duplicates = (rows, label) => {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.id)) problems.push(`${label}.yaml: duplicated id "${row.id}"`);
    seen.add(row.id);
  }
  return seen;
};

const teamIds = duplicates(teams, "teams");
const tournamentIds = duplicates(tournaments, "tournaments");
duplicates(matches, "matches");

for (const m of matches) {
  for (const side of ["home", "away"]) {
    if (!teamIds.has(m[side])) {
      problems.push(
        `matches.yaml: "${m.id}" has ${side}: ${m[side]}, which is not an id in teams.yaml`,
      );
    }
  }
  if (!tournamentIds.has(m.tournament)) {
    problems.push(
      `matches.yaml: "${m.id}" has tournament: ${m.tournament}, which is not an id in tournaments.yaml`,
    );
  }
  if (m.home === m.away) {
    problems.push(`matches.yaml: "${m.id}" has the same team on both sides`);
  }
  if (m.score && (!Array.isArray(m.score) || m.score.length !== 2)) {
    problems.push(`matches.yaml: "${m.id}" has a score that is not two numbers, like [2, 1]`);
  }
}

for (const t of tournaments) {
  if (t.startDate && t.endDate && new Date(t.endDate) < new Date(t.startDate)) {
    problems.push(`tournaments.yaml: "${t.id}" ends before it starts`);
  }
}

if (problems.length) {
  console.error(`\nFound ${problems.length} problem(s) in src/data:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error("");
  process.exit(1);
}

console.log(
  `data ok: ${teams.length} teams, ${tournaments.length} tournaments, ${matches.length} matches`,
);

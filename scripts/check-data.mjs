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
import { readdirSync, readFileSync } from "node:fs";
import { parse } from "yaml";

const load = (name) =>
  readdirSync(`src/data/${name}`)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => parse(readFileSync(`src/data/${name}/${f}`, "utf8")));

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
    // An empty side is a slot still to be decided, which is allowed. A side
    // that names a team that does not exist is not.
    if (m[side] != null && !teamIds.has(m[side])) {
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
  if (m.home != null && m.home === m.away) {
    problems.push(`matches.yaml: "${m.id}" has the same team on both sides`);
  }
  if (m.score && (!Array.isArray(m.score) || m.score.length !== 2)) {
    problems.push(`matches.yaml: "${m.id}" has a score that is not two numbers, like [2, 1]`);
  }
  if (m.score && (m.home == null || m.away == null)) {
    problems.push(`matches.yaml: "${m.id}" has a score but one of the two sides is empty`);
  }
  if (m.bracket && !m.round) {
    problems.push(`matches.yaml: "${m.id}" is in the "${m.bracket}" bracket but has no round`);
  }
}

for (const t of tournaments) {
  if (t.startDate && t.endDate && new Date(t.endDate) < new Date(t.startDate)) {
    problems.push(`tournaments.yaml: "${t.id}" ends before it starts`);
  }

  for (const p of t.participants ?? []) {
    if (!teamIds.has(p.team)) {
      problems.push(
        `tournaments.yaml: "${t.id}" lists participant ${p.team}, which is not an id in teams.yaml`,
      );
    }
  }

  const seats = t.participants?.length;
  if (seats != null && t.teamCount != null && seats !== t.teamCount) {
    problems.push(
      `tournaments.yaml: "${t.id}" says teamCount: ${t.teamCount} but lists ${seats} participants`,
    );
  }

  const payouts = t.prizePool?.distribution;
  if (payouts) {
    // Each row pays its amount to every place it covers, so a range of
    // 5th - 8th at 375 is four payouts, not one. The total has to match.
    const paid = payouts.reduce(
      (sum, row) => sum + row.amount * ((row.to ?? row.place) - row.place + 1),
      0,
    );
    if (paid !== t.prizePool.total) {
      problems.push(
        `tournaments.yaml: "${t.id}" has a prize pool of ${t.prizePool.total} but the distribution adds up to ${paid}`,
      );
    }
    for (const row of payouts) {
      if (row.to != null && row.to < row.place) {
        problems.push(`tournaments.yaml: "${t.id}" has a prize row where "to" is before "place"`);
      }
      if (row.team != null && !teamIds.has(row.team)) {
        problems.push(
          `tournaments.yaml: "${t.id}" awards a prize to ${row.team}, which is not an id in teams.yaml`,
        );
      }
    }
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

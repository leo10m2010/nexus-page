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
    .map((f) => ({
      ...parse(readFileSync(`src/data/${name}/${f}`, "utf8")),
      __file: f,
    }));

const teams = load("teams");
const tournaments = load("tournaments");
const matches = load("matches");
const brackets = load("brackets");

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
const matchIds = duplicates(matches, "matches");
duplicates(brackets, "brackets");
const tournamentById = new Map(tournaments.map((t) => [t.id, t]));
const finalStages = new Set(["final", "grandFinal"]);

for (const [label, rows] of [
  ["teams", teams],
  ["tournaments", tournaments],
  ["matches", matches],
  ["brackets", brackets],
]) {
  for (const row of rows) {
    const fileId = row.__file.replace(/\.yaml$/, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)) {
      problems.push(`${label}.yaml: "${row.id}" is not a valid id`);
    }
    if (fileId !== row.id) {
      problems.push(`${label}.yaml: file "${row.__file}" must match id "${row.id}"`);
    }
  }
}

let bracketMatchCount = 0;
for (const bracket of brackets) {
  for (const match of bracket.matches ?? []) {
    bracketMatchCount += 1;
    if (matchIds.has(match.id)) {
      problems.push(`brackets.yaml: duplicated match id "${match.id}"`);
    }
    matchIds.add(match.id);
  }
}

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
  if (m.score && (m.home == null || m.away == null)) {
    problems.push(`matches.yaml: "${m.id}" has a score but one of the two sides is empty`);
  }
  if (m.score) {
    const validScore = [m.score.home, m.score.away].every(
      (value) => Number.isInteger(value) && value >= 0,
    );
    if (!validScore) {
      problems.push(`matches.yaml: "${m.id}" needs non-negative home and away scores`);
    } else if (m.score.home === m.score.away) {
      problems.push(`matches.yaml: "${m.id}" cannot finish tied`);
    }
  }
  if (m.bestOf != null && (!Number.isInteger(m.bestOf) || m.bestOf < 1 || m.bestOf % 2 === 0)) {
    problems.push(`matches.yaml: "${m.id}" has bestOf: ${m.bestOf}; it must be a positive odd number`);
  }
  if (m.stage === "groupStage") {
    if (!m.group) problems.push(`matches.yaml: "${m.id}" is a group match without a group`);
    if (m.bracket || m.round) problems.push(`matches.yaml: "${m.id}" mixes group and bracket fields`);
    if (m.phase !== "groupStage") problems.push(`matches.yaml: "${m.id}" must use phase: groupStage`);
  } else {
    problems.push(`matches.yaml: "${m.id}" is an elimination match and belongs in src/data/brackets`);
  }

  const tournament = tournamentById.get(m.tournament);
  if (tournament) {
    const participants = new Set((tournament.participants ?? []).map((p) => p.team));
    for (const side of ["home", "away"]) {
      if (m[side] && !participants.has(m[side])) {
        problems.push(`matches.yaml: "${m.id}" uses ${m[side]}, which is not in ${tournament.id}`);
      }
    }

    const matchDay = String(m.startsAt).slice(0, 10);
    if (matchDay < String(tournament.startDate).slice(0, 10) || matchDay > String(tournament.endDate).slice(0, 10)) {
      problems.push(`matches.yaml: "${m.id}" falls outside ${tournament.id}'s dates`);
    }

    const defaultPhase =
      m.stage === "groupStage"
        ? tournament.phases?.find((phase) => phase.key === "groupStage")
        : finalStages.has(m.stage)
          ? tournament.phases?.find((phase) => phase.key === "finals") ??
            tournament.phases?.find((phase) => phase.key === "playoffs")
          : tournament.phases?.find((phase) => phase.key === "playoffs") ??
            tournament.phases?.find((phase) => phase.key === "finals");
    const bestOf = m.bestOf ?? defaultPhase?.bestOf;
    if (m.score && bestOf) {
      const winsNeeded = Math.floor(bestOf / 2) + 1;
      if (Math.max(m.score.home, m.score.away) !== winsNeeded || Math.min(m.score.home, m.score.away) >= winsNeeded) {
        problems.push(`matches.yaml: "${m.id}" has a score incompatible with Bo${bestOf}`);
      }
    }
  }
}

for (const bracket of brackets) {
  const tournament = tournamentById.get(bracket.tournament);
  if (!tournament) {
    problems.push(`brackets.yaml: "${bracket.id}" points at unknown tournament "${bracket.tournament}"`);
  }
  if (bracket.id !== bracket.tournament) {
    problems.push(`brackets.yaml: "${bracket.id}" must use the same id as its tournament`);
  }
  if (!Number.isInteger(bracket.defaultBestOf) || bracket.defaultBestOf < 1 || bracket.defaultBestOf % 2 === 0) {
    problems.push(`brackets.yaml: "${bracket.id}" has an invalid defaultBestOf`);
  }
  const playoffBestOf = tournament?.phases?.find((phase) => phase.key === "playoffs")?.bestOf;
  if (playoffBestOf && bracket.defaultBestOf !== playoffBestOf) {
    problems.push(`brackets.yaml: "${bracket.id}" defaultBestOf must match the tournament playoffs Bo${playoffBestOf}`);
  }
  if (!Array.isArray(bracket.matches) || bracket.matches.length === 0) {
    problems.push(`brackets.yaml: "${bracket.id}" needs at least one match`);
    continue;
  }

  const localById = new Map();
  const positions = new Set();
  const directTeams = new Set();
  const sourceUses = new Set();
  const participants = new Set((tournament?.participants ?? []).map((participant) => participant.team));

  for (const match of bracket.matches) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(match.id)) {
      problems.push(`brackets.yaml: "${match.id}" is not a valid match id`);
    }
    if (localById.has(match.id)) {
      problems.push(`brackets.yaml: "${bracket.id}" repeats match "${match.id}"`);
    }
    localById.set(match.id, match);

    const position = `${match.bracket}:${match.round}:${match.slot}`;
    if (positions.has(position)) {
      problems.push(`brackets.yaml: "${bracket.id}" repeats position ${position}`);
    }
    positions.add(position);

    if (!["upper", "lower", "final"].includes(match.bracket)) {
      problems.push(`brackets.yaml: "${match.id}" has an invalid bracket side`);
    }
    if (!Number.isInteger(match.round) || match.round < 1 || !Number.isInteger(match.slot) || match.slot < 1) {
      problems.push(`brackets.yaml: "${match.id}" needs positive integer round and slot values`);
    }
    if (match.stage === "groupStage") {
      problems.push(`brackets.yaml: "${match.id}" cannot use the group stage`);
    }

    for (const side of ["home", "away"]) {
      const source = match[`${side}Source`];
      if (match[side] != null && source != null) {
        problems.push(`brackets.yaml: "${match.id}" has both ${side} and ${side}Source`);
      }
      if (match[side] != null && !teamIds.has(match[side])) {
        problems.push(`brackets.yaml: "${match.id}" has unknown ${side} team "${match[side]}"`);
      }
      if (match[side] != null && tournament && !participants.has(match[side])) {
        problems.push(`brackets.yaml: "${match.id}" uses ${match[side]}, which is not in ${tournament.id}`);
      }
      if (match[side] != null && directTeams.has(match[side])) {
        problems.push(`brackets.yaml: team "${match[side]}" occupies more than one direct bracket seat`);
      }
      if (match[side] != null) directTeams.add(match[side]);
      if (source && !["winner", "loser"].includes(source.outcome)) {
        problems.push(`brackets.yaml: "${match.id}" has invalid ${side}Source outcome`);
      }
      if (source) {
        const sourceUse = `${source.match}:${source.outcome}`;
        if (sourceUses.has(sourceUse)) {
          problems.push(`brackets.yaml: source "${sourceUse}" feeds more than one seat`);
        }
        sourceUses.add(sourceUse);
      }
    }

    if (match.home != null && match.home === match.away) {
      problems.push(`brackets.yaml: "${match.id}" has the same team on both sides`);
    }
    if (match.score) {
      const validScore = [match.score.home, match.score.away].every(
        (value) => Number.isInteger(value) && value >= 0,
      );
      if (!validScore) {
        problems.push(`brackets.yaml: "${match.id}" needs non-negative home and away scores`);
      } else if (match.score.home === match.score.away) {
        problems.push(`brackets.yaml: "${match.id}" cannot finish tied`);
      }
    }
    if (match.bestOf != null && (!Number.isInteger(match.bestOf) || match.bestOf < 1 || match.bestOf % 2 === 0)) {
      problems.push(`brackets.yaml: "${match.id}" has an invalid bestOf`);
    }

    if (tournament) {
      const matchDay = String(match.startsAt).slice(0, 10);
      if (matchDay < String(tournament.startDate).slice(0, 10) || matchDay > String(tournament.endDate).slice(0, 10)) {
        problems.push(`brackets.yaml: "${match.id}" falls outside ${tournament.id}'s dates`);
      }

      const bestOf = match.bestOf ?? bracket.defaultBestOf;
      if (match.score && bestOf) {
        const winsNeeded = Math.floor(bestOf / 2) + 1;
        if (Math.max(match.score.home, match.score.away) !== winsNeeded || Math.min(match.score.home, match.score.away) >= winsNeeded) {
          problems.push(`brackets.yaml: "${match.id}" has a score incompatible with Bo${bestOf}`);
        }
      }
    }
  }

  for (const match of bracket.matches) {
    for (const side of ["home", "away"]) {
      const source = match[`${side}Source`];
      if (!source) continue;
      const sourceMatch = localById.get(source.match);
      if (!sourceMatch) {
        problems.push(`brackets.yaml: "${match.id}" points at unknown source "${source.match}"`);
      } else if (Date.parse(sourceMatch.startsAt) >= Date.parse(match.startsAt)) {
        problems.push(`brackets.yaml: "${match.id}" must start after source "${source.match}"`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (match) => {
    if (visiting.has(match.id)) {
      problems.push(`brackets.yaml: "${bracket.id}" contains a progression cycle at "${match.id}"`);
      return;
    }
    if (visited.has(match.id)) return;
    visiting.add(match.id);
    for (const side of ["home", "away"]) {
      const sourceMatch = localById.get(match[`${side}Source`]?.match);
      if (sourceMatch) visit(sourceMatch);
    }
    visiting.delete(match.id);
    visited.add(match.id);
  };
  for (const match of bracket.matches) visit(match);

  const hasWinningScore = (match) => {
    if (!match.score || match.score.home === match.score.away) return false;
    const bestOf = match.bestOf ?? bracket.defaultBestOf;
    const winsNeeded = Math.floor(bestOf / 2) + 1;
    return Math.max(match.score.home, match.score.away) === winsNeeded &&
      Math.min(match.score.home, match.score.away) < winsNeeded;
  };

  const resolveSide = (match, side, stack = new Set()) => {
    if (match[side]) return match[side];
    const source = match[`${side}Source`];
    if (!source || stack.has(match.id)) return null;
    const sourceMatch = localById.get(source.match);
    if (!sourceMatch) return null;
    const nextStack = new Set(stack).add(match.id);
    const home = resolveSide(sourceMatch, "home", nextStack);
    const away = resolveSide(sourceMatch, "away", nextStack);
    if (!home || !away || !hasWinningScore(sourceMatch)) return null;
    const homeWins = sourceMatch.score.home > sourceMatch.score.away;
    return source.outcome === "winner" ? (homeWins ? home : away) : (homeWins ? away : home);
  };

  for (const match of bracket.matches) {
    const home = resolveSide(match, "home");
    const away = resolveSide(match, "away");
    if (match.score && (!home || !away)) {
      problems.push(`brackets.yaml: "${match.id}" has a score before both seats are resolved`);
    }
    if (home && home === away) {
      problems.push(`brackets.yaml: "${match.id}" resolves the same team on both sides`);
    }
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

  const participantIds = (t.participants ?? []).map((p) => p.team);
  if (new Set(participantIds).size !== participantIds.length) {
    problems.push(`tournaments.yaml: "${t.id}" lists a participant more than once`);
  }
  if ((t.venue === "offline" || t.venue === "hybrid") && !t.location) {
    problems.push(`tournaments.yaml: "${t.id}" needs a location for ${t.venue} mode`);
  }

  const phaseKeys = new Set();
  for (const phase of t.phases ?? []) {
    if (phaseKeys.has(phase.key)) {
      problems.push(`tournaments.yaml: "${t.id}" repeats phase "${phase.key}"`);
    }
    phaseKeys.add(phase.key);
    if (phase.bestOf != null && (!Number.isInteger(phase.bestOf) || phase.bestOf < 1 || phase.bestOf % 2 === 0)) {
      problems.push(`tournaments.yaml: "${t.id}" phase "${phase.key}" has an invalid bestOf`);
    }
    if (phase.teamCount && phase.advance && phase.advance > phase.teamCount) {
      problems.push(`tournaments.yaml: "${t.id}" phase "${phase.key}" advances too many teams`);
    }
  }

  if (t.prizePool && !/^[A-Z]{3}$/.test(t.prizePool.currency)) {
    problems.push(`tournaments.yaml: "${t.id}" uses an invalid prize currency`);
  }

  const payouts = t.prizePool?.distribution;
  if (payouts) {
    const coveredPlaces = new Set();
    for (const row of payouts) {
      if (row.to != null && row.to < row.place) {
        problems.push(`tournaments.yaml: "${t.id}" has a prize row where "to" is before "place"`);
      }
      for (let place = row.place; place <= (row.to ?? row.place); place += 1) {
        if (coveredPlaces.has(place)) {
          problems.push(`tournaments.yaml: "${t.id}" awards place ${place} more than once`);
        }
        coveredPlaces.add(place);
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
  `data ok: ${teams.length} teams, ${tournaments.length} tournaments, ${matches.length} group matches, ${bracketMatchCount} bracket matches`,
);

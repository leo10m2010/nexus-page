import test from "node:test";
import assert from "node:assert/strict";
import { parse, stringify } from "yaml";
import { parseWikiDate, parseTournamentMatches, compareTournament, applyApproved } from "../netlify/lib/liquipedia-matches.js";
import { createSyncHandler, serializeApproved } from "../netlify/lib/liquipedia-sync.js";

const sourceUrl = "https://liquipedia.net/dota2/NEXUS_SERIES/1";
const wiki = (maps = ["2", "2", "skip"], date = "September 6, 2026 - 12:00 {{Abbr/PET}}", away = "Pibbles Corp") => `Two modified-GSL groups of four teams each
{{Matchlist|id=groupA|M1={{Match|opponent1={{TeamOpponent|Amaru Gaming}}|opponent2={{TeamOpponent|${away}}}|date=${date}|${maps.map((winner, i) => `map${i + 1}={{Map|${winner === "skip" ? "finished=skip" : `winner=${winner}`}|t1h1=lina}}`).join("|")}
}}
}}`;
const remote = (text = wiki()) => ({ revision: 42, timestamp: "2026-09-07T12:00:00Z", page: "NEXUS SERIES/1", url: sourceUrl, wikitext: text });
const resultOnlyWiki = (home, away) => `{{Matchlist|id=groupA|gsl=losersfirst|M1={{Match
|opponent1={{TeamOpponent|Amaru Gaming|score=${home}}}
|opponent2={{TeamOpponent|Pibbles Corp|score=${away}}}
|date=September 6, 2026 - 12:00 {{Abbr/PET}}
}}
}}`;
const snapshot = () => ({
  tournament: { id: "season-one", name: "Nexus Series I", startDate: "2026-09-06", endDate: "2026-09-15", phases: [{ key: "groupStage", format: "roundRobin", bestOf: 3 }], participants: [{ team: "amaru" }, { team: "pibble" }], broadcastTalent: [{ name: "Keep me" }] },
  teams: [{ id: "amaru", name: "Amaru Gaming" }, { id: "pibble", name: "Pibble Corp" }],
  groupMatches: [{ id: "s1-ga1", tournament: "season-one", stage: "groupStage", group: "A", startsAt: "2026-09-06T17:00:00Z", home: "amaru", away: "pibble", custom: "preserve" }],
  bracket: { id: "season-one", defaultBestOf: 3, matches: [] },
  mapping: { page: "NEXUS SERIES/1", matches: { "groupA/M1": "s1-ga1" }, aliases: { "Pibbles Corp": "pibble" } },
});

test("dates use explicit zones and reject invalid dates", () => {
  assert.equal(parseWikiDate("September 6, 2026 - 12:00 {{Abbr/PET}}"), "2026-09-06T17:00:00Z");
  assert.equal(parseWikiDate("September 6, 2026 - 19:00 {{Abbr/CEST}}"), "2026-09-06T17:00:00Z");
  assert.equal(parseWikiDate("December 6, 2026 - 18:00 {{Abbr/CET}}"), "2026-12-06T17:00:00Z");
  assert.equal(parseWikiDate("February 30, 2026 - 12:00 {{Abbr/PET}}"), null);
  assert.equal(parseWikiDate("September 6, 2026 - 24:00 {{Abbr/PET}}"), null);
  assert.equal(parseWikiDate("tomorrow"), null);
});
test("completed series count winners and ignore skipped maps", () => {
  const match = parseTournamentMatches(wiki()).matches[0];
  assert.deepEqual(match.score, { home: 0, away: 2 }); assert.equal(match.state, "finished"); assert.equal(match.id, "groupA/M1");
  assert.deepEqual(parseTournamentMatches(wiki(["1", "2", "2"])).matches[0].score, { home: 1, away: 2 });
  assert.deepEqual(parseTournamentMatches(wiki(["1", "2", "1", "1", "skip"])).matches[0].score, { home: 3, away: 1 });
});
test("W/FF without map records is selectable using the configured best-of", () => {
  const data = snapshot(), plan = compareTournament(data, remote(resultOnlyWiki("FF", "W")));
  assert.deepEqual(plan.rows[0].issues, []);
  assert.equal(plan.rows[0].selectable, true);
  assert.equal(plan.rows[0].walkover, "away");
  assert.equal(plan.rows[0].score, null);
  assert.equal(plan.rows[0].state, "finished");
  const result = applyApproved(data, plan, ["groupA/M1"]);
  assert.equal(result.snapshot.groupMatches[0].walkover, "away");
  assert.equal(result.snapshot.groupMatches[0].groupRound, "opening");
  assert.equal(result.snapshot.groupMatches[0].score, undefined);
});
test("administrative results replace numeric scores without storing null or invented maps", () => {
  const data = snapshot(); data.groupMatches[0].score = { home: 0, away: 2 };
  data.files = { "src/data/matches/s1-ga1.yaml": { text: stringify(data.groupMatches[0]) } };
  const result = applyApproved(data, compareTournament(data, remote(resultOnlyWiki("FF", "W"))), ["groupA/M1"]);
  const matchFile = serializeApproved(data, result).find((file) => file.path.endsWith("s1-ga1.yaml"));
  const saved = parse(matchFile.content);
  assert.equal(saved.walkover, "away"); assert.ok(!("score" in saved));
  assert.equal(compareTournament(result.snapshot, remote(resultOnlyWiki("FF", "W"))).rows[0].selectable, false);
});
test("numeric opponent scores can finish a series without individual map records", () => {
  const plan = compareTournament(snapshot(), remote(resultOnlyWiki("2", "1")));
  assert.equal(plan.rows[0].selectable, true); assert.deepEqual(plan.rows[0].score, { home: 2, away: 1 });
  assert.equal(compareTournament(snapshot(), remote(resultOnlyWiki("1", "0"))).rows[0].selectable, false);
});
test("unknown or conflicting administrative outcomes remain blocked", () => {
  for (const scores of [["W", "W"], ["FF", ""], ["DQ", "W"]]) {
    const row = compareTournament(snapshot(), remote(resultOnlyWiki(...scores))).rows[0];
    assert.equal(row.selectable, false); assert.equal(row.walkover, null); assert.equal(row.score, null);
  }
});
test("map count is not used as the best-of when tournament context is available", () => {
  const partial = compareTournament(snapshot(), remote(wiki(["2"])));
  assert.equal(partial.rows[0].score, null); assert.equal(partial.rows[0].selectable, false);
  const finished = compareTournament(snapshot(), remote(wiki(["2", "2"])));
  assert.deepEqual(finished.rows[0].score, { home: 0, away: 2 }); assert.equal(finished.rows[0].selectable, true);
});
test("pending matches without map templates can still update confirmed schedules", () => {
  const text = resultOnlyWiki("", "").replace("12:00", "13:00");
  const row = compareTournament(snapshot(), remote(text)).rows[0];
  assert.equal(row.selectable, true); assert.equal(row.state, "pending");
  assert.equal(row.changes.startsAt.after, "2026-09-06T18:00:00Z");
});
test("tournament boundaries follow Peru dates rather than the UTC date", () => {
  const early = compareTournament(snapshot(), remote(wiki(undefined, "September 6, 2026 - 01:00 {{Abbr/UTC}}")));
  assert.equal(early.rows[0].selectable, false);
  assert.ok(early.rows[0].issues.includes("Fecha fuera del torneo."));
  const late = compareTournament(snapshot(), remote(wiki(undefined, "September 16, 2026 - 02:00 {{Abbr/UTC}}")));
  assert.ok(!late.rows[0].issues.includes("Fecha fuera del torneo."));
});
test("empty, partial and invalid maps are never final results", () => {
  for (const maps of [["", "", ""], ["1", "", ""], ["1", "2", ""], ["1", "1", "invalid"]]) assert.equal(parseTournamentMatches(wiki(maps)).matches[0].score, null);
  assert.equal(parseTournamentMatches(wiki(["", "", ""])).matches[0].state, "pending");
  assert.equal(compareTournament(snapshot(), remote(wiki(["1", "", ""]))).rows[0].selectable, false);
});
test("duplicate source identities and unrecognized pages fail closed", () => {
  assert.throws(() => parseTournamentMatches(wiki() + wiki()), /duplicada/);
  assert.throws(() => parseTournamentMatches("maintenance"), /no devolvió/);
});
test("aliases resolve to existing IDs without mutating the snapshot", () => {
  const data = snapshot(), original = structuredClone(data), plan = compareTournament(data, remote());
  assert.equal(plan.rows[0].selectable, true); assert.deepEqual(Object.keys(plan.rows[0].changes), ["score"]);
  assert.deepEqual(plan.formatChange, { before: "roundRobin", after: "modifiedGsl" }); assert.deepEqual(data, original);
});
test("only selected fields change and source revision is recorded", () => {
  const data = snapshot(), result = applyApproved(data, compareTournament(data, remote()), ["groupA/M1"]);
  assert.deepEqual(result.snapshot.groupMatches[0].score, { home: 0, away: 2 });
  assert.equal(result.snapshot.groupMatches[0].custom, "preserve"); assert.equal(result.snapshot.tournament.phases[0].format, "roundRobin");
  assert.deepEqual(result.snapshot.tournament.broadcastTalent, data.tournament.broadcastTalent);
  assert.equal(result.snapshot.mapping.revisions["groupA/M1"], 42); assert.equal(data.groupMatches[0].score, undefined);
});
test("format changes need separate approval", () => {
  const data = snapshot(), result = applyApproved(data, compareTournament(data, remote()), [], true);
  assert.equal(result.snapshot.tournament.phases[0].format, "modifiedGsl"); assert.equal(result.snapshot.groupMatches[0].score, undefined);
});
test("unknown teams and unmatched fixtures are blocked", () => {
  for (const text of [wiki(undefined, undefined, "Unknown"), wiki().replace("id=groupA", "id=other")]) {
    const plan = compareTournament(snapshot(), remote(text)); assert.equal(plan.rows[0].selectable, false);
    assert.throws(() => applyApproved(snapshot(), plan, [plan.rows[0].sourceId]), /bloqueado/);
  }
});
test("missing remote results never erase stored results", () => {
  const data = snapshot(); data.groupMatches[0].score = { home: 0, away: 2 };
  assert.deepEqual(compareTournament(data, remote(wiki(["", "", ""]))).rows[0].changes, {});
});
test("duplicate approvals and stale values are rejected", () => {
  const data = snapshot(), plan = compareTournament(data, remote());
  assert.throws(() => applyApproved(data, plan, ["groupA/M1", "groupA/M1"]), /Selección inválida/);
  assert.throws(() => applyApproved(data, plan, []), /Selecciona/);
  data.groupMatches[0].score = { home: 2, away: 0 };
  assert.throws(() => applyApproved(data, plan, ["groupA/M1"]), /datos cambiaron/);
});
test("winner corrections cannot silently alter a scored downstream round", () => {
  const data = snapshot(); data.groupMatches[0].score = { home: 2, away: 0 };
  data.bracket.matches.push({ id: "final", stage: "grandFinal", startsAt: "2026-09-15T20:00:00Z", homeSource: { match: "s1-ga1", outcome: "winner" }, score: { home: 2, away: 0 } });
  assert.throws(() => applyApproved(data, compareTournament(data, remote()), ["groupA/M1"]), /rondas posteriores/);
});

const token = "test_token_for_authenticated_mock_only";
const event = (body) => ({ httpMethod: "POST", headers: { authorization: `Bearer ${token}`, origin: "https://nexusseries.org", host: "nexusseries.org" }, body: JSON.stringify({ tournament: "season-one", ...body }) });
function githubMock({ push = true, race = false } = {}) {
  const data = snapshot(), calls = [], files = {
    "src/data/liquipedia/season-one.json": JSON.stringify(data.mapping),
    "src/data/tournaments/season-one.yaml": stringify(data.tournament),
    "src/data/matches/s1-ga1.yaml": "# Keep comment\n" + stringify(data.groupMatches[0]),
    "src/data/brackets/season-one.yaml": stringify(data.bracket),
    "src/data/teams/amaru.yaml": stringify(data.teams[0]),
    "src/data/teams/pibble.yaml": stringify(data.teams[1]),
  };
  const entries = Object.keys(files).map((path, index) => ({ path, type: "blob", sha: `blob${index}`, size: files[path].length }));
  const fetcher = async (url, options) => {
    const root = "https://api.github.com/repos/leo10m2010/nexus-page";
    const path = url === root ? "" : url.slice(root.length + 1);
    calls.push({ url, path, ...options, body: options.body ? JSON.parse(options.body) : null });
    const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
    if (url === `${root}/`) return json({ message: "Not Found" }, 404);
    if (path === "") return json({ permissions: { push } });
    if (path === "git/ref/heads/main") return json({ object: { sha: "head1" } });
    if (path === "git/commits/head1") return json({ tree: { sha: "tree1" } });
    if (path === "git/trees/tree1?recursive=1") return json({ tree: entries });
    if (path.startsWith("git/blobs/")) { const entry = entries.find((e) => path === `git/blobs/${e.sha}`); return json({ encoding: "base64", content: Buffer.from(files[entry.path]).toString("base64") }); }
    if (path === "git/trees" && options.method === "POST") return json({ sha: "newtree" });
    if (path === "git/commits" && options.method === "POST") return json({ sha: "newcommit" });
    if (path === "git/refs/heads/main" && options.method === "PATCH") return json({}, race ? 422 : 200);
    throw new Error(`Unexpected request ${path}`);
  };
  return { fetcher, calls };
}
test("authentication and origin are checked before any requests", async () => {
  const handler = createSyncHandler({ fetcher: () => { throw new Error("network must not run"); } });
  assert.equal((await handler({ httpMethod: "GET" })).statusCode, 405);
  assert.equal((await handler({ httpMethod: "POST", headers: {} })).statusCode, 401);
  const bad = event({ action: "preview" }); bad.headers.origin = "https://other.example";
  assert.equal((await handler(bad)).statusCode, 403);
});
test("read-only accounts cannot sync", async () => {
  const mock = githubMock({ push: false });
  assert.equal((await createSyncHandler({ fetcher: mock.fetcher })(event({ action: "preview" }))).statusCode, 403); assert.equal(mock.calls.length, 1);
});
test("preview performs no writes and does not expose tokens", async () => {
  const mock = githubMock(), handler = createSyncHandler({ fetcher: mock.fetcher, loadRevision: async () => remote() });
  const result = await handler(event({ action: "preview" }));
  assert.equal(result.statusCode, 200); assert.equal(JSON.parse(result.body).rows[0].selectable, true);
  assert.ok(mock.calls.every((call) => call.method === "GET")); assert.ok(!result.body.includes(token));
  assert.equal(mock.calls[0].url, "https://api.github.com/repos/leo10m2010/nexus-page");
});
test("a trailing slash on GitHub repository lookup reproduces the reported 502", async () => {
  const mock = githubMock();
  const fetcher = (url, options) => mock.fetcher(url === "https://api.github.com/repos/leo10m2010/nexus-page" ? `${url}/` : url, options);
  const result = await createSyncHandler({ fetcher, loadRevision: async () => remote() })(event({ action: "preview" }));
  assert.equal(result.statusCode, 502);
  assert.match(JSON.parse(result.body).error, /GitHub \(HTTP 404\)/);
  assert.ok(mock.calls.every((call) => call.method === "GET"));
});
test("approval writes one atomic non-force commit and preserves comments", async () => {
  const mock = githubMock(), handler = createSyncHandler({ fetcher: mock.fetcher, loadRevision: async (page, revision) => { assert.equal(page, "NEXUS SERIES/1"); assert.equal(revision, 42); return remote(); } });
  const result = await handler(event({ action: "apply", head: "head1", revision: 42, selected: ["groupA/M1"] }));
  assert.equal(result.statusCode, 200, result.body);
  const writes = mock.calls.filter((call) => call.method !== "GET"); assert.equal(writes.length, 3); assert.equal(writes[0].body.base_tree, "tree1");
  const match = writes[0].body.tree.find((file) => file.path === "src/data/matches/s1-ga1.yaml");
  assert.match(match.content, /# Keep comment/); assert.equal(parse(match.content).custom, "preserve");
  assert.ok(!writes[0].body.tree.some((file) => file.path.includes("tournaments/")));
  assert.deepEqual(writes[1].body.parents, ["head1"]); assert.equal(writes[2].body.force, false);
});
test("stale reviews, forged selections and source failures never write", async () => {
  for (const scenario of ["stale", "selection", "source"]) {
    const mock = githubMock(), handler = createSyncHandler({ fetcher: mock.fetcher, loadRevision: async () => { if (scenario === "source") throw new Error("Source unavailable"); return remote(); } });
    const result = await handler(event({ action: "apply", head: scenario === "stale" ? "oldhead" : "head1", revision: 42, selected: [scenario === "selection" ? "fake" : "groupA/M1"] }));
    assert.notEqual(result.statusCode, 200); assert.ok(mock.calls.every((call) => call.method === "GET"));
  }
});
test("concurrent pushes are rejected instead of forced", async () => {
  const mock = githubMock({ race: true });
  const result = await createSyncHandler({ fetcher: mock.fetcher, loadRevision: async () => remote() })(event({ action: "apply", head: "head1", revision: 42, selected: ["groupA/M1"] }));
  assert.equal(result.statusCode, 409);
});

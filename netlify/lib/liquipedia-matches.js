import { extractTemplates } from "./liquipedia.js";

const key = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const equal = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function parseWikiDate(value) {
  const match = String(value ?? "").trim().match(/^(\w+) (\d{1,2}), (\d{4})\s*-\s*(\d{1,2}):(\d{2})\s*\{\{Abbr\/(PET|UTC|CEST|CET)\}\}$/i);
  if (!match) return null;
  const month = MONTHS.findIndex((name) => name.toLowerCase() === match[1].toLowerCase());
  const [, , day, year, hour, minute, zone] = match;
  if (month < 0 || +hour > 23 || +minute > 59 || +day < 1) return null;
  const local = new Date(Date.UTC(+year, month, +day, +hour, +minute));
  if (local.getUTCMonth() !== month || local.getUTCDate() !== +day) return null;
  return new Date(+local - ({ PET: -5, UTC: 0, CEST: 2, CET: 1 }[zone.toUpperCase()] * 3600000)).toISOString().replace(".000Z", "Z");
}

export function parseTournamentMatches(wikitext) {
  const source = String(wikitext).replace(/<!--[^]*?-->/g, "");
  if (source.length > 500000) throw new Error("La página supera el tamaño admitido para revisión.");
  const matches = [], warnings = [], ids = new Set();
  for (const container of [...extractTemplates(source, "Matchlist"), ...extractTemplates(source, "Bracket")]) {
    const containerId = container.params.id;
    if (!containerId) { warnings.push("Hay un bloque sin ID; no se importará automáticamente."); continue; }
    for (const [slot, raw] of Object.entries(container.params)) {
      if (!/^(?:m\d+|r\d+m\d+)$/.test(slot)) continue;
      const parsed = extractTemplates(raw, "Match");
      if (parsed.length !== 1) { warnings.push(`No se reconoce ${containerId}/${slot}.`); continue; }
      const p = parsed[0].params;
      const id = `${containerId}/${slot.toUpperCase()}`;
      if (ids.has(id)) throw new Error(`Referencia duplicada en Liquipedia: ${id}`);
      ids.add(id);
      const opponent = (value) => extractTemplates(value ?? "", "TeamOpponent")[0]?.params["1"]?.trim() || null;
      const maps = Object.entries(p).filter(([name]) => /^map\d+$/.test(name)).sort(([a], [b]) => Number(a.slice(3)) - Number(b.slice(3))).map(([, value]) => extractTemplates(value, "Map")[0]?.params);
      const bestOf = p.bestof ? Number(p.bestof) : maps.length;
      const score = { home: 0, away: 0 };
      let invalidMaps = false;
      for (const map of maps) {
        if (!map) { invalidMaps = true; continue; }
        if (map.finished === "skip") continue;
        if (map.winner === "1") score.home++;
        else if (map.winner === "2") score.away++;
        else if (map.winner) invalidMaps = true;
      }
      const validBo = Number.isInteger(bestOf) && bestOf > 0 && bestOf <= 9 && bestOf % 2 === 1;
      const wins = (bestOf + 1) / 2;
      const finished = validBo && !invalidMaps && Math.max(score.home, score.away) === wins && Math.min(score.home, score.away) < wins;
      matches.push({ id, homeName: opponent(p.opponent1), awayName: opponent(p.opponent2), startsAt: parseWikiDate(p.date), bestOf: validBo ? bestOf : null,
        score: finished ? score : null, state: finished ? "finished" : score.home + score.away > 0 || invalidMaps ? "incomplete" : "pending" });
    }
  }
  if (!matches.length) throw new Error("Liquipedia no devolvió partidos reconocibles. No se modificó ningún dato.");
  return { matches, warnings, groupFormat: /two modified-GSL groups of four teams each/i.test(source) ? "modifiedGsl" : null };
}

export function compareTournament(snapshot, remote) {
  const { tournament, teams, groupMatches, bracket, mapping } = snapshot;
  const local = new Map([...groupMatches, ...(bracket?.matches ?? [])].map((match) => [match.id, match]));
  const parsed = parseTournamentMatches(remote.wikitext);
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const names = new Map();
  for (const team of teams) for (const name of [team.name, team.id]) {
    const normalized = key(name);
    const candidates = names.get(normalized) ?? new Set(); candidates.add(team.id); names.set(normalized, candidates);
  }
  for (const [name, id] of Object.entries(mapping.aliases ?? {})) {
    if (!teamById.has(id)) throw new Error(`El alias ${name} apunta a un equipo inexistente.`);
    names.set(key(name), new Set([id]));
  }
  const resolve = (name) => { const ids = names.get(key(name)); return ids?.size === 1 ? [...ids][0] : null; };
  const resolveLocal = (match, side, seen = new Set()) => {
    if (match?.[side]) return match[side];
    const origin = match?.[`${side}Source`];
    if (!origin || seen.has(match.id)) return null;
    const source = local.get(origin.match);
    if (!source?.score) return null;
    const next = new Set([...seen, match.id]);
    const winner = source.score.home > source.score.away ? "home" : "away";
    return resolveLocal(source, origin.outcome === "winner" ? winner : winner === "home" ? "away" : "home", next);
  };
  const rows = parsed.matches.map((match) => {
    const id = mapping.matches?.[match.id], current = local.get(id), changes = {}, issues = [];
    if (!current) issues.push("Partido sin vincular; requiere revisión de la configuración.");
    if (!match.startsAt) issues.push("Fecha u horario no reconocidos.");
    if (!match.bestOf) issues.push("No se reconoce el formato de la serie.");
    const home = match.homeName ? resolve(match.homeName) : null;
    const away = match.awayName ? resolve(match.awayName) : null;
    if (match.homeName && !home) issues.push(`Equipo no reconocido: ${match.homeName}`);
    if (match.awayName && !away) issues.push(`Equipo no reconocido: ${match.awayName}`);
    if (home && home === away) issues.push("Un equipo no puede jugar contra sí mismo.");
    for (const team of [home, away].filter(Boolean)) if (!(tournament.participants ?? []).some((p) => p.team === team)) issues.push("Equipo ajeno al torneo.");
    if (match.startsAt) {
      const peruDay = new Date(new Date(match.startsAt).getTime() - 5 * 3600000).toISOString().slice(0, 10);
      if (peruDay < String(tournament.startDate).slice(0, 10) || peruDay > String(tournament.endDate).slice(0, 10)) issues.push("Fecha fuera del torneo.");
    }
    if (current) {
      if (match.startsAt && new Date(current.startsAt).toISOString() !== new Date(match.startsAt).toISOString()) changes.startsAt = { before: current.startsAt, after: match.startsAt };
      const expectedBo = current.bestOf ?? (current.stage === "groupStage" ? tournament.phases?.find((p) => p.key === "groupStage")?.bestOf : bracket?.defaultBestOf);
      if (match.bestOf && expectedBo !== match.bestOf) issues.push(`Formato distinto: Bo${expectedBo} / Bo${match.bestOf}. Revisión manual necesaria.`);
      for (const [side, team] of [["home", home], ["away", away]]) {
        if (!team) continue;
        if (current[`${side}Source`]) {
          if (resolveLocal(current, side) !== team) issues.push("El equipo no coincide con la progresión local del bracket; actualiza primero las rondas anteriores.");
        } else if (current[side] !== team) changes[side] = { before: current[side] ?? null, after: team };
      }
      if (current.score && (changes.home || changes.away)) issues.push("No se cambian equipos de un partido con resultado guardado.");
      if (match.score) {
        if (!home || !away) issues.push("Resultado sin ambos equipos reconocidos.");
        else if (!equal(current.score, match.score)) changes.score = { before: current.score ?? null, after: match.score };
      }
      if (match.state === "incomplete") issues.push("Serie incompleta: no se guardará un resultado final.");
    }
    return { sourceId: match.id, id: id ?? null, home: match.homeName, away: match.awayName, currentHome: teamById.get(resolveLocal(current, "home"))?.name, currentAway: teamById.get(resolveLocal(current, "away"))?.name, startsAt: match.startsAt, score: match.score, state: match.state,
      changes, issues: [...new Set(issues)], selectable: issues.length === 0 && Object.keys(changes).length > 0 };
  });
  const groupPhase = tournament.phases?.find((p) => p.key === "groupStage");
  const missing = Object.keys(mapping.matches ?? {}).filter((id) => !parsed.matches.some((m) => m.id === id));
  if (missing.length) parsed.warnings.push(`${missing.length} partidos vinculados no aparecen en Liquipedia; se conservarán sin cambios.`);
  const formatChange = parsed.groupFormat && groupPhase && groupPhase.format !== parsed.groupFormat
    ? { before: groupPhase.format, after: parsed.groupFormat } : null;
  return { revision: remote.revision, timestamp: remote.timestamp, url: remote.url, rows, formatChange, warnings: parsed.warnings };
}

export function applyApproved(snapshot, plan, selected, approveFormat = false, now = new Date().toISOString()) {
  if (!Array.isArray(selected) || selected.length > 100 || new Set(selected).size !== selected.length) throw new Error("Selección inválida.");
  const copy = structuredClone(snapshot), changedIds = [];
  const local = new Map([...copy.groupMatches, ...(copy.bracket?.matches ?? [])].map((m) => [m.id, m]));
  const dependsOn = (candidate, id, seen = new Set()) => {
    if (!candidate || seen.has(candidate.id)) return false;
    const next = new Set([...seen, candidate.id]);
    return [candidate.homeSource, candidate.awaySource].some((source) => source && (source.match === id || dependsOn(local.get(source.match), id, next)));
  };
  for (const sourceId of selected) {
    const row = plan.rows.find((candidate) => candidate.sourceId === sourceId);
    if (!row?.selectable || !local.has(row.id)) throw new Error("La selección contiene un cambio bloqueado o inexistente.");
    const match = local.get(row.id);
    if (match.score && row.changes.score && (match.score.home > match.score.away) !== (row.changes.score.after.home > row.changes.score.after.away)
      && [...local.values()].some((candidate) => candidate.score && dependsOn(candidate, match.id))) throw new Error("Este ganador ya alimenta un partido con resultado. Revisa manualmente las rondas posteriores.");
    for (const [field, change] of Object.entries(row.changes)) {
      if (!["startsAt", "home", "away", "score"].includes(field) || !equal(match[field], change.before)) throw new Error("Los datos cambiaron. Revisa de nuevo antes de guardar.");
      match[field] = structuredClone(change.after);
    }
    copy.mapping.revisions ??= {};
    copy.mapping.revisions[sourceId] = plan.revision;
    match.liquipediaRevision = plan.revision;
    match.liquipediaUrl = plan.url;
    changedIds.push(row.id);
  }
  if (approveFormat) {
    if (!plan.formatChange || copy.tournament.phases.find((p) => p.key === "groupStage")?.format !== plan.formatChange.before) throw new Error("El formato ya cambió; revisa de nuevo.");
    copy.tournament.phases.find((p) => p.key === "groupStage").format = plan.formatChange.after;
    copy.mapping.formatRevision = plan.revision;
  }
  for (const match of local.values()) for (const side of ["home", "away"]) {
    const origin = match[`${side}Source`];
    if (origin && new Date(local.get(origin.match)?.startsAt) >= new Date(match.startsAt)) throw new Error("Un cambio de fecha contradice el orden del bracket.");
  }
  if (!changedIds.length && !approveFormat) throw new Error("Selecciona al menos un cambio.");
  copy.mapping.lastImportedAt = now;
  return { snapshot: copy, changedIds, formatChanged: approveFormat };
}

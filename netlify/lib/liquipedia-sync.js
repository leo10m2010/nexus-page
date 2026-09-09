import { parse, parseDocument } from "yaml";
import { loadLiquipediaRevision } from "./liquipedia.js";
import { compareTournament, applyApproved } from "./liquipedia-matches.js";

const HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
const reply = (statusCode, body) => ({ statusCode, headers: HEADERS, body: JSON.stringify(body) });
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

export function serializeApproved(original, result) {
  const files = new Map();
  const update = (path, steps, value) => {
    if (!files.has(path)) files.set(path, parseDocument(original.files[path].text));
    files.get(path).setIn(steps, value);
  };
  const all = [...result.snapshot.groupMatches, ...(result.snapshot.bracket?.matches ?? [])];
  for (const id of result.changedIds) {
    const next = all.find((m) => m.id === id);
    const old = [...original.groupMatches, ...(original.bracket?.matches ?? [])].find((m) => m.id === id);
    const group = original.groupMatches.some((m) => m.id === id);
    const path = group ? `src/data/matches/${id}.yaml` : `src/data/brackets/${original.tournament.id}.yaml`;
    const prefix = group ? [] : ["matches", original.bracket.matches.findIndex((m) => m.id === id)];
    for (const field of ["home", "away", "startsAt", "score", "liquipediaRevision", "liquipediaUrl"]) if (JSON.stringify(next[field]) !== JSON.stringify(old[field])) update(path, [...prefix, field], next[field]);
  }
  if (result.formatChanged) {
    const index = original.tournament.phases.findIndex((p) => p.key === "groupStage");
    update(`src/data/tournaments/${original.tournament.id}.yaml`, ["phases", index, "format"], "modifiedGsl");
  }
  return [
    ...[...files].map(([path, document]) => ({ path, content: document.toString() })),
    { path: `src/data/liquipedia/${original.tournament.id}.json`, content: JSON.stringify(result.snapshot.mapping, null, 2) + "\n" },
  ];
}

export function createSyncHandler({ fetcher = fetch, loadRevision = loadLiquipediaRevision, repo = "leo10m2010/nexus-page", branch = "main" } = {}) {
  return async (event) => {
    if (event.httpMethod !== "POST") return { ...reply(405, { error: "Usa POST." }), headers: { ...HEADERS, Allow: "POST" } };
    const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    if (!/^Bearer [A-Za-z0-9_\-.]{20,}$/.test(headers.authorization ?? "")) return reply(401, { error: "Conecta tu cuenta de GitHub para continuar." });
    let publishing = false;
    try {
      if (headers.origin && new URL(headers.origin).host !== headers.host) throw fail("La solicitud debe venir del panel.", 403);
      if (event.isBase64Encoded || !event.body || event.body.length > 12000) throw fail("Solicitud inválida.");
      const request = JSON.parse(event.body);
      const id = request.tournament;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id ?? "") || id.length > 80) throw fail("Torneo inválido.");
      if (!["preview", "apply"].includes(request.action)) throw fail("Acción inválida.");
      const api = async (path, method = "GET", body) => {
        const response = await fetcher(`https://api.github.com/repos/${repo}${path ? `/${path}` : ""}`, {
          method, headers: { Authorization: headers.authorization, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "NexusSeriesSync/1.0" },
          ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) {
          if (response.status === 401) throw fail("La sesión de GitHub venció. Conecta de nuevo.", 401);
          if (response.status === 403) throw fail("GitHub no autorizó la operación o alcanzó su límite. Inténtalo más tarde.", 403);
          if (method === "PATCH" && response.status === 422) throw fail("Hubo otro cambio en la web. Revisa de nuevo antes de guardar.", 409);
          throw fail(`No se pudo completar la operación en GitHub (HTTP ${response.status}).`, 502);
        }
        return response.json();
      };
      const repository = await api("");
      if (!repository.permissions?.push) throw fail("Tu cuenta no tiene permiso para editar esta web.", 403);
      const reference = await api(`git/ref/heads/${branch}`);
      const head = reference.object.sha;
      if (request.action === "apply" && request.head !== head) throw fail("La web cambió desde la revisión. Vuelve a consultar Liquipedia.", 409);
      const commit = await api(`git/commits/${head}`);
      const tree = await api(`git/trees/${commit.tree.sha}?recursive=1`);
      if (tree.truncated) throw fail("No se pudo leer el repositorio completo.", 502);
      const files = {};
      const load = async (path) => {
        const item = tree.tree.find((entry) => entry.path === path && entry.type === "blob");
        if (!item || item.size > 500000) throw fail(`Archivo no disponible para sincronizar: ${path}`);
        const blob = await api(`git/blobs/${item.sha}`);
        if (blob.encoding !== "base64") throw fail("Formato de archivo no reconocido.", 502);
        const text = Buffer.from(blob.content, "base64").toString("utf8");
        const data = path.endsWith(".json") ? JSON.parse(text) : parse(text);
        files[path] = { text, data, sha: item.sha };
        return data;
      };
      const mapping = await load(`src/data/liquipedia/${id}.json`);
      const tournament = await load(`src/data/tournaments/${id}.yaml`);
      if (tournament.id !== id || typeof mapping.page !== "string") throw fail("La configuración del torneo no coincide.");
      const paths = new Set(tree.tree.filter((entry) => /^src\/data\/teams\/[a-z0-9-]+\.yaml$/.test(entry.path)).map((entry) => entry.path));
      for (const matchId of Object.values(mapping.matches ?? {})) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(matchId)) throw fail("La referencia local de un partido es inválida.");
        const path = `src/data/matches/${matchId}.yaml`;
        if (tree.tree.some((entry) => entry.path === path)) paths.add(path);
      }
      const bracketPath = `src/data/brackets/${id}.yaml`;
      if (tree.tree.some((entry) => entry.path === bracketPath)) paths.add(bracketPath);
      if (paths.size > 150) throw fail("La consulta supera el límite de archivos.");
      const queue = [...paths];
      await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await load(queue.shift()); }));
      const snapshot = { files, tournament, mapping,
        teams: Object.entries(files).filter(([path]) => path.startsWith("src/data/teams/")).map(([, file]) => file.data),
        groupMatches: Object.entries(files).filter(([path]) => path.startsWith("src/data/matches/")).map(([, file]) => file.data).filter((m) => m.tournament === id),
        bracket: files[bracketPath]?.data,
      };
      if (request.action === "apply" && (!Number.isSafeInteger(request.revision) || request.revision <= 0)) throw fail("Revisión inválida.");
      const remote = await loadRevision(mapping.page, request.action === "apply" ? request.revision : undefined);
      const plan = compareTournament(snapshot, remote);
      if (request.action === "preview") return reply(200, { head, ...plan });
      const result = applyApproved(snapshot, plan, request.selected, request.approveFormat === true);
      const changes = serializeApproved(snapshot, result);
      const newTree = await api("git/trees", "POST", { base_tree: commit.tree.sha, tree: changes.map((file) => ({ ...file, mode: "100644", type: "blob" })) });
      const newCommit = await api("git/commits", "POST", { message: `Actualiza ${tournament.name} desde Liquipedia (revisión ${remote.revision})`, tree: newTree.sha, parents: [head] });
      publishing = true;
      await api(`git/refs/heads/${branch}`, "PATCH", { sha: newCommit.sha, force: false });
      return reply(200, { commit: newCommit.sha, updated: result.changedIds.length, formatUpdated: result.formatChanged, message: "Cambios guardados. La web se actualizará al terminar el despliegue." });
    } catch (error) {
      if (publishing && !error.status) return reply(502, { error: "No se pudo confirmar el guardado. Vuelve a revisar antes de repetir la operación." });
      return reply(error.status ?? error.statusCode ?? (error.name === "SyntaxError" ? 400 : 502), { error: error.message || "No se pudo sincronizar. No se guardaron cambios." });
    }
  };
}

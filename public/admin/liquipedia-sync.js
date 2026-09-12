(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const login = $("sync-login"), preview = $("sync-preview"), save = $("sync-save"), select = $("sync-tournament");
  let token = "", plan = null, busy = false, connecting = false;
  const status = (message, error = false) => { $("sync-status").textContent = message; $("sync-status").dataset.error = String(error); };
  const selected = () => [...document.querySelectorAll("#sync-matches input:checked")].map((input) => input.value);
  const controls = () => {
    preview.disabled = busy || !token;
    select.disabled = busy;
    save.disabled = busy || !plan || (!selected().length && !$("sync-format").checked);
    save.textContent = selected().length ? `Guardar seleccionados (${selected().length})` : "Guardar seleccionados";
    login.disabled = busy || connecting;
    $("sync-format").disabled = busy || !plan?.formatChange;
    document.querySelectorAll("#sync-matches input").forEach((input) => { input.disabled = busy || !plan || input.dataset.selectable !== "true"; });
  };
  const request = async (body) => {
    const response = await fetch("/api/liquipedia/sync", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) });
    let result;
    try { result = await response.json(); }
    catch {
      throw new Error(body.action === "apply"
        ? "No se pudo confirmar el guardado. Revisa de nuevo antes de repetir la operación."
        : `No se pudo leer la respuesta del servidor (HTTP ${response.status}). Inténtalo de nuevo.`);
    }
    if (!response.ok) { if (response.status === 401) token = ""; throw new Error(result.error || "No se pudo completar la actualización."); }
    return result;
  };
  const dates = (value) => {
    if (!value) return "Sin horario";
    const date = new Date(value);
    return ["America/Lima", "Europe/Berlin"].map((timeZone, index) => {
      const zone = index ? new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" }).formatToParts(date).find((part) => part.type === "timeZoneName").value : "PET";
      return `${new Intl.DateTimeFormat("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }).format(date)} ${zone}`;
    }).join(" / ");
  };
  const text = (tag, value, className) => { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; };
  const reviewState = (row) => {
    if (row.issues.length) return "review";
    if (!row.selectable) return "synced";
    const result = row.changes.score || row.changes.walkover;
    if (result?.after && !row.changes.score?.before && !row.changes.walkover?.before) return "new";
    return "changed";
  };
  const stateLabels = { new: "Resultado nuevo", changed: "Cambios disponibles", review: "Requiere revisión", synced: "Ya al día" };
  const render = () => {
    $("sync-review").hidden = false;
    const counts = { new: 0, changed: 0, review: 0, synced: 0 };
    plan.rows.forEach((row) => { counts[reviewState(row)]++; });
    $("sync-summary").replaceChildren(...Object.entries(counts).map(([state, count]) => {
      const node = text("span", `${stateLabels[state]}: ${count}`, "review-count");
      node.dataset.state = state;
      return node;
    }));
    $("sync-updated").hidden = !counts.synced;
    $("sync-updated").open = false;
    $("sync-updated-label").textContent = `Ya al día (${counts.synced}) · Ver partidos`;
    $("sync-empty").hidden = !!(counts.new + counts.changed + counts.review);
    $("sync-empty").textContent = plan.rows.length ? "Todos los partidos están al día. No hay resultados ni horarios nuevos para guardar." : "No hay partidos disponibles para revisar.";
    const source = new URL(plan.url?.startsWith("https://liquipedia.net/") ? plan.url : "https://liquipedia.net/dota2/");
    source.searchParams.set("oldid", plan.revision);
    $("sync-source").href = source.href;
    $("sync-source").textContent = `Fuente · revisión ${plan.revision}`;
    $("sync-warnings").textContent = plan.warnings.join(" ");
    $("sync-format-row").hidden = !plan.formatChange;
    $("sync-format").checked = false;
    $("sync-format-label").textContent = plan.formatChange ? "Corregir formato de grupos a GSL modificado (dos grupos; avanzan dos equipos de cada grupo)." : "";
    $("sync-matches").replaceChildren();
    $("sync-updated-matches").replaceChildren();
    for (const row of plan.rows) {
      const state = reviewState(row);
      const item = document.createElement("li"), label = document.createElement(row.selectable ? "label" : "div"), copy = document.createElement("span");
      item.dataset.state = state;
      label.className = "match-heading";
      if (row.selectable) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox"; checkbox.value = row.sourceId; checkbox.dataset.selectable = "true";
        label.append(checkbox);
      }
      copy.append(text("span", stateLabels[state], "review-state"));
      copy.append(text("strong", `${row.home || "Por definir"} vs ${row.away || "Por definir"}`));
      copy.append(text("span", row.walkover ? `Finalizado por retirada · ${row.walkover === "home" ? "W - FF" : "FF - W"}` : row.score ? `Finalizado · ${row.score.home} - ${row.score.away}` : row.state === "incomplete" ? "Resultado incompleto" : "Pendiente", "match-state"));
      copy.append(text("span", dates(row.startsAt), "change-line"));
      label.append(copy); item.append(label);
      for (const [field, change] of Object.entries(row.changes)) {
        const value = (v, before) => v == null ? "Sin dato" : field === "score" ? `${v.home} - ${v.away}` : field === "walkover" ? (v === "home" ? "W - FF" : "FF - W") : field === "groupRound" ? ({ opening: "Apertura", elimination: "Eliminación", winners: "Ganadores", decider: "Partido decisivo" })[v] : field === "startsAt" ? dates(v) : field === "home" ? (before ? row.currentHome : row.home) || v : field === "away" ? (before ? row.currentAway : row.away) || v : String(v);
        item.append(text("p", `${({ startsAt: "Horario", score: "Resultado", walkover: "Resultado por retirada", groupRound: "Ronda", home: "Equipo A", away: "Equipo B" })[field]}: ${value(change.before, true)} → ${value(change.after, false)}`, "change-line"));
      }
      for (const issue of row.issues) item.append(text("p", issue, "issue"));
      $(state === "synced" ? "sync-updated-matches" : "sync-matches").append(item);
    }
  };
  login.addEventListener("click", () => {
    if (connecting) return;
    const popup = window.open("/api/auth", "nexus-liquipedia-auth", "width=620,height=720");
    if (!popup) { status("Permite la ventana de GitHub e inténtalo de nuevo.", true); return; }
    connecting = true; controls();
    status("Completa la conexión con GitHub en la ventana abierta.");
    const cleanup = () => { window.removeEventListener("message", receive); clearInterval(watch); connecting = false; controls(); };
    const receive = (event) => {
      if (event.origin !== location.origin || event.source !== popup || typeof event.data !== "string") return;
      if (event.data === "authorizing:github") { popup.postMessage("authorizing:github", location.origin); return; }
      if (!event.data.startsWith("authorization:github:")) return;
      try {
        if (!event.data.startsWith("authorization:github:success:")) throw new Error("GitHub no autorizó la conexión.");
        const result = JSON.parse(event.data.slice("authorization:github:success:".length));
        if (typeof result.token !== "string" || !result.token) throw new Error("No se recibió una sesión válida.");
        token = result.token; status("GitHub conectado. Ya puedes revisar Liquipedia."); login.textContent = "Reconectar GitHub";
      } catch (error) { status(error.message, true); }
      cleanup(); popup.close(); controls();
    };
    window.addEventListener("message", receive);
    const start = Date.now();
    const watch = setInterval(() => { if (popup.closed || Date.now() - start > 300000) { cleanup(); status("Conexión cerrada. Puedes intentarlo de nuevo.", true); } }, 1000);
  });
  preview.addEventListener("click", async () => {
    busy = true; plan = null; $("sync-review").hidden = true; controls(); status("Consultando partidos y comparando con la web...");
    try {
      plan = await request({ action: "preview", tournament: select.value }); render();
      status(plan.rows.some((row) => row.selectable) || plan.formatChange
        ? "Revisión lista. Marca los cambios nuevos que quieres guardar."
        : plan.rows.some((row) => row.issues.length)
          ? "Hay datos que requieren revisión. Consulta el motivo indicado en cada partido."
          : "La web ya coincide con Liquipedia. No hay cambios nuevos para guardar.");
    }
    catch (error) { status(error.message, true); }
    finally { busy = false; controls(); }
  });
  select.addEventListener("change", () => { plan = null; $("sync-review").hidden = true; controls(); });
  $("sync-review").addEventListener("change", controls);
  save.addEventListener("click", () => {
    if (!plan || save.disabled) return;
    $("sync-confirm-copy").textContent = `${selected().length} partidos seleccionados${$("sync-format").checked ? " y el formato de grupos" : ""}.`;
    $("sync-confirm").returnValue = ""; $("sync-confirm").showModal();
  });
  $("sync-confirm").addEventListener("close", async () => {
    if ($("sync-confirm").returnValue !== "confirm" || !plan || busy) return;
    busy = true; controls(); status("Guardando los cambios aprobados...");
    try {
      const result = await request({ action: "apply", tournament: select.value, head: plan.head, revision: plan.revision, selected: selected(), approveFormat: $("sync-format").checked });
      status(result.message); $("sync-review").hidden = true;
    } catch (error) { status(error.message, true); }
    finally { plan = null; busy = false; controls(); }
  });
})();

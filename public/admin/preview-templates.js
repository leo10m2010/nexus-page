CMS.registerPreviewStyle("/admin/preview.css");

var FORMAT_LABELS = {
  doubleElimination: "Doble eliminación",
  singleElimination: "Eliminación simple",
  roundRobin: "Round robin",
};

var STATUS_LABELS = {
  upcoming: "Próximo",
  live: "En vivo",
  finished: "Finalizado",
};

var STAGE_LABELS = {
  groupStage: "Fase de grupos",
  lowerRound: "Ronda inferior",
  quarterfinal: "Cuartos de final",
  semifinal: "Semifinal",
  upperFinal: "Final del bracket superior",
  lowerFinal: "Final del bracket inferior",
  final: "Final",
  grandFinal: "Gran final",
  thirdPlace: "Tercer puesto",
};

var PHASE_LABELS = {
  groupStage: "Fase de grupos",
  playoffs: "Playoffs",
  finals: "Finales",
};

var DOTA_ICON_URL = "https://cdn.simpleicons.org/dota2/aeb8cc";
var TEAM_META = {
  "amaru-gaming": { name: "Amaru Gaming", logo: "/teams/amaru-gaming.webp" },
  chandogs: { name: "Chandogs", logo: "/teams/chandogs.webp" },
  "estar-backs": { name: "Estar Backs", logo: "/teams/estar-backs.webp" },
  "giordota-team": { name: "GiorDota Team", logo: "/teams/giordota-team.webp" },
  "pibble-corp": { name: "Pibble Corp", logo: "/teams/pibble-corp.webp" },
  rebeldes: { name: "Rebeldes", logo: null },
  teamdk: { name: "TeamDk", logo: "/teams/teamdk.webp" },
  "the-house-esports": { name: "The House Esports", logo: "/teams/the-house-esports.webp" },
};

var nxWindow = /** @type {any} */ (window);
nxWindow.NX_DOTA_ICON_URL = DOTA_ICON_URL;
nxWindow.NX_TEAM_META = TEAM_META;

function prizeTotal(prizePool) {
  var distribution = prizePool && prizePool.get("distribution");
  if (!distribution || distribution.size === 0) return null;
  return distribution.reduce(function (sum, row) {
    var place = Number(row.get("place"));
    var to = Number(row.get("to") || place);
    return sum + Number(row.get("amount") || 0) * (to - place + 1);
  }, 0);
}

function formatSummary(phases) {
  if (!phases || phases.size === 0) return "?";
  var seen = {};
  return phases
    .map(function (phase) { return phase.get("format"); })
    .filter(function (format) {
      if (seen[format]) return false;
      seen[format] = true;
      return true;
    })
    .map(function (format) { return FORMAT_LABELS[format] || format; })
    .join(" + ");
}

function hasCompleteScore(score) {
  return Boolean(
    score &&
    Number.isInteger(score.get("home")) &&
    Number.isInteger(score.get("away"))
  );
}

function formatDate(value) {
  if (!value) return null;
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  }) + " PET";
}

function formatDateOnly(value) {
  if (!value) return null;
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function flagUrl(code) {
  if (!code || code.length !== 2) return null;
  return "/admin/flags/" + code.toLowerCase() + ".svg";
}

function humanizeTeamId(id) {
  if (!id) return "Por definir";
  return id.split("-").map(function (part) {
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function teamName(id) {
  return id && TEAM_META[id] ? TEAM_META[id].name : humanizeTeamId(id);
}

function teamLogo(id) {
  if (!id) return DOTA_ICON_URL;
  if (TEAM_META[id] && Object.prototype.hasOwnProperty.call(TEAM_META[id], "logo")) {
    return TEAM_META[id].logo || DOTA_ICON_URL;
  }
  return "/teams/" + id + ".webp";
}

function usesFallbackLogo(id) {
  return !id || Boolean(TEAM_META[id] && TEAM_META[id].logo === null);
}

function useDotaFallback(event) {
  if (event.target.dataset.fallback === "true") return;
  event.target.dataset.fallback = "true";
  event.target.classList.add("nx-match-logo--fallback");
  event.target.src = DOTA_ICON_URL;
}

function matchTeam(id, away) {
  var name = h("span", { className: "nx-match-team-name" }, teamName(id));
  var logo = h("img", {
    className: "nx-match-logo" + (usesFallbackLogo(id) ? " nx-match-logo--fallback" : ""),
    src: teamLogo(id),
    alt: "",
    onError: useDotaFallback,
  });
  return away
    ? h("span", { className: "nx-match-team nx-match-team--away" }, logo, name)
    : h("span", { className: "nx-match-team nx-match-team--home" }, name, logo);
}

var TeamPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var data = entry.get("data");
    var logo = data.get("logo");
    var players = data.get("players");

    return h("div", { className: "nx-preview" },
      h("div", { className: "nx-card nx-team-card" },
        logo
          ? h("img", { className: "nx-team-logo", src: this.props.getAsset(logo).toString(), alt: "" })
          : h("div", { className: "nx-team-logo nx-team-logo--empty" }),
        h("div", null,
          h("h1", { className: "nx-team-name" }, data.get("name") || "Nombre del equipo"),
          h("div", { className: "nx-team-meta" },
            h("span", { className: "nx-tag" }, data.get("tag") || "TAG")
          )
        )
      ),
      players && players.size > 0
        ? h("ul", { className: "nx-roster" },
            players.map(function (p, i) {
              var flag = flagUrl(p.get("country"));
              return h("li", { key: i, className: "nx-roster-row" },
                flag
                  ? h("img", {
                      className: "nx-flag-img",
                      src: flag,
                      alt: "",
                      onError: function (e) { e.target.style.visibility = "hidden"; },
                    })
                  : h("span", { className: "nx-flag-img nx-flag-img--empty" }),
                h("span", { className: "nx-handle" }, p.get("handle") || "—"),
                p.get("country") ? h("span", { className: "nx-country" }, p.get("country")) : null
              );
            }).toArray()
          )
        : h("p", { className: "nx-empty" }, "Sin jugadores todavía")
    );
  },
});

var TournamentPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var data = entry.get("data");
    var prizePool = data.get("prizePool");
    var phases = data.get("phases");
    var participants = data.get("participants");
    var total = prizeTotal(prizePool);

    return h("div", { className: "nx-preview" },
      h("div", { className: "nx-card nx-tournament-card" },
        h("div", { className: "nx-tournament-top" },
          h("span", { className: "nx-badge" }, STATUS_LABELS[data.get("status")] || data.get("status") || "Estado"),
          prizePool && total != null
            ? h("span", { className: "nx-prize" }, (prizePool.get("currency") || "") + " " + total)
            : null
        ),
        h("h1", { className: "nx-tournament-name" }, data.get("name") || "Nombre del torneo"),
        h("div", { className: "nx-tournament-facts" },
          h("div", null,
            h("p", { className: "nx-fact-label" }, "Fechas"),
            h("p", { className: "nx-fact-value" }, (formatDateOnly(data.get("startDate")) || "?") + " – " + (formatDateOnly(data.get("endDate")) || "?"))
          ),
          h("div", null,
            h("p", { className: "nx-fact-label" }, "Equipos"),
            h("p", { className: "nx-fact-value" }, participants ? participants.size : 0)
          ),
          h("div", null,
            h("p", { className: "nx-fact-label" }, "Formato"),
            h("p", { className: "nx-fact-value" }, formatSummary(phases))
          ),
          h("div", null,
            h("p", { className: "nx-fact-label" }, "Región"),
            h("p", { className: "nx-fact-value" }, data.get("region") || "?")
          )
        )
      ),
      phases && phases.size > 0
        ? h("div", { className: "nx-phases" },
            phases.map(function (ph, i) {
              return h("div", { key: i, className: "nx-card nx-phase-card" },
                h("p", { className: "nx-fact-label" }, PHASE_LABELS[ph.get("key")] || ph.get("key")),
                h("p", { className: "nx-fact-value" }, FORMAT_LABELS[ph.get("format")] || ph.get("format"))
              );
            }).toArray()
          )
        : null
    );
  },
});

var MatchPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var data = entry.get("data");
    var score = data.get("score");
    var home = data.get("home");
    var away = data.get("away");

    return h("div", { className: "nx-preview" },
      h("p", { className: "nx-match-stage" },
        (STAGE_LABELS[data.get("stage")] || data.get("stage") || "Etapa") +
        (data.get("group") ? " · Grupo " + data.get("group") : "") +
        (data.get("bestOf") ? " · Bo" + data.get("bestOf") : " · Bo heredado")
      ),
      h("div", { className: "nx-card nx-match-card" },
        matchTeam(home, false),
        h("span", { className: "nx-match-score" },
          hasCompleteScore(score) ? score.get("home") + " – " + score.get("away") : "vs"
        ),
        matchTeam(away, true)
      ),
      h("p", { className: "nx-match-date" }, formatDate(data.get("startsAt")) || "Fecha por definir")
    );
  },
});

var BRACKET_SIDE_LABELS = {
  upper: "Bracket superior",
  lower: "Bracket inferior",
  final: "Gran final",
};

function previewHasScoreValues(match) {
  return Boolean(
    match &&
    match.score &&
    Number.isFinite(Number(match.score.home)) &&
    Number.isFinite(Number(match.score.away))
  );
}

function previewHasWinningScore(match, defaultBestOf) {
  if (!previewHasScoreValues(match)) return false;
  var bestOf = Number(match.bestOf) || Number(defaultBestOf) || 3;
  var winsNeeded = Math.floor(bestOf / 2) + 1;
  return Number(match.score.home) !== Number(match.score.away) &&
    Math.max(Number(match.score.home), Number(match.score.away)) === winsNeeded &&
    Math.min(Number(match.score.home), Number(match.score.away)) < winsNeeded;
}

function previewMatchLabel(match, matches) {
  if (!match) return "Cruce desconocido";
  var label = STAGE_LABELS[match.stage] || match.stage;
  var repeats = matches.filter(function (candidate) {
    return candidate.stage === match.stage && candidate.bracket === match.bracket && candidate.round === match.round;
  }).length > 1;
  return repeats ? label + " " + match.slot : label;
}

function resolvePreviewTeam(matches, match, side, defaultBestOf, stack) {
  if (!match) return null;
  if (match[side]) return match[side];
  var source = match[side + "Source"];
  if (!source) return null;

  var path = stack || {};
  if (path[match.id]) return null;
  var sourceMatch = matches.find(function (candidate) { return candidate.id === source.match; });
  if (!sourceMatch || !previewHasWinningScore(sourceMatch, defaultBestOf)) return null;

  var nextPath = Object.assign({}, path);
  nextPath[match.id] = true;
  var home = resolvePreviewTeam(matches, sourceMatch, "home", defaultBestOf, nextPath);
  var away = resolvePreviewTeam(matches, sourceMatch, "away", defaultBestOf, nextPath);
  if (!home || !away || Number(sourceMatch.score.home) === Number(sourceMatch.score.away)) return null;

  var homeWins = Number(sourceMatch.score.home) > Number(sourceMatch.score.away);
  if (source.outcome === "winner") return homeWins ? home : away;
  return homeWins ? away : home;
}

function previewSourceLabel(matches, match, side) {
  var source = match[side + "Source"];
  if (!source) return null;
  var sourceMatch = matches.find(function (candidate) { return candidate.id === source.match; });
  return (source.outcome === "winner" ? "Ganador" : "Perdedor") + " de " + previewMatchLabel(sourceMatch, matches);
}

function previewBracketLogo(id) {
  if (!id) return h("span", { className: "nx-bracket-preview-logo nx-bracket-preview-logo--empty", "aria-hidden": "true" });
  return h("img", {
    className: "nx-bracket-preview-logo" + (usesFallbackLogo(id) ? " nx-bracket-preview-logo--fallback" : ""),
    src: teamLogo(id),
    alt: "",
    onError: function (event) {
      if (event.target.dataset.fallback === "true") return;
      event.target.dataset.fallback = "true";
      event.target.classList.add("nx-bracket-preview-logo--fallback");
      event.target.src = DOTA_ICON_URL;
    },
  });
}

function previewBracketMatch(match, matches, defaultBestOf) {
  var home = resolvePreviewTeam(matches, match, "home", defaultBestOf);
  var away = resolvePreviewTeam(matches, match, "away", defaultBestOf);
  var hasScore = previewHasScoreValues(match);
  var hasWinner = previewHasWinningScore(match, defaultBestOf);
  var homeWins = hasWinner && Number(match.score.home) > Number(match.score.away);
  var awayWins = hasWinner && Number(match.score.away) > Number(match.score.home);

  function seat(side, id, wins) {
    var sourceLabel = previewSourceLabel(matches, match, side);
    return h(
      "div",
      { className: "nx-bracket-preview-seat" + (wins ? " nx-bracket-preview-seat--winner" : "") },
      previewBracketLogo(id),
      h(
        "span",
        { className: "nx-bracket-preview-team" },
        h("strong", null, id ? teamName(id) : "Por definir"),
        sourceLabel ? h("small", null, sourceLabel) : null
      ),
      h("span", { className: "nx-bracket-preview-score" }, hasScore ? match.score[side] : "–")
    );
  }

  return h(
    "article",
    { key: match.id, className: "nx-bracket-preview-match" },
    h(
      "header",
      null,
      h("strong", null, previewMatchLabel(match, matches)),
      h("span", null, "Bo" + (match.bestOf || defaultBestOf) + (match.bestOf ? "" : " heredado") + " · " + (formatDate(match.startsAt) || "Fecha por definir"))
    ),
    seat("home", home, homeWins),
    seat("away", away, awayWins)
  );
}

var BracketPreview = createClass({
  render: function () {
    var data = this.props.entry.get("data");
    var value = data.get("matches");
    var defaultBestOf = Number(data.get("defaultBestOf")) || 3;
    var matches = value && typeof value.toJS === "function"
      ? value.toJS()
      : Array.isArray(value)
        ? value
        : [];

    return h(
      "div",
      { className: "nx-preview nx-bracket-preview" },
      h(
        "div",
        { className: "nx-bracket-preview-head" },
        h("div", null,
          h("p", { className: "nx-match-stage" }, "ELIMINATORIAS · " + (data.get("tournament") || "Torneo")),
          h("h1", null, "Bracket completo")
        ),
        h("span", null, matches.length + " cruces")
      ),
      ["upper", "lower", "final"].map(function (side) {
        var sideMatches = matches.filter(function (match) { return match.bracket === side; });
        if (!sideMatches.length) return null;
        var rounds = Array.from(new Set(sideMatches.map(function (match) { return Number(match.round); }))).sort(function (a, b) { return a - b; });
        return h(
          "section",
          { key: side, className: "nx-bracket-preview-side" },
          h("h2", null, BRACKET_SIDE_LABELS[side]),
          h(
            "div",
            { className: "nx-bracket-preview-rounds" },
            rounds.map(function (round) {
              return h(
                "div",
                { key: round, className: "nx-bracket-preview-round" },
                h("h3", null, side === "final" ? "Partido decisivo" : "Ronda " + round),
                sideMatches
                  .filter(function (match) { return Number(match.round) === round; })
                  .sort(function (a, b) { return Number(a.slot) - Number(b.slot); })
                  .map(function (match) { return previewBracketMatch(match, matches, defaultBestOf); })
              );
            })
          )
        );
      })
    );
  },
});

CMS.registerPreviewTemplate("equipos", TeamPreview);
CMS.registerPreviewTemplate("torneos", TournamentPreview);
CMS.registerPreviewTemplate("partidos", MatchPreview);
CMS.registerPreviewTemplate("brackets", BracketPreview);

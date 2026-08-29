CMS.registerPreviewStyle("/admin/preview.css");

var FORMAT_LABELS = {
  doubleElimination: "Doble eliminación",
  singleElimination: "Eliminación simple",
  roundRobin: "Round robin",
  swiss: "Suizo",
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
    timeZone: "UTC",
  }) + " UTC";
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

var TeamPreview = createClass({
  render: function () {
    var entry = this.props.entry;
    var data = entry.get("data");
    var logo = data.get("logo");
    var players = data.get("players");

    return h("div", { className: "nx-preview" },
      h("div", { className: "nx-card nx-team-card" },
        logo
          ? h("img", { className: "nx-team-logo", src: this.props.getAsset(logo).toString() })
          : h("div", { className: "nx-team-logo nx-team-logo--empty" }),
        h("div", null,
          h("h1", { className: "nx-team-name" }, data.get("name") || "Nombre del equipo"),
          h("div", { className: "nx-team-meta" },
            h("span", { className: "nx-tag" }, data.get("tag") || "TAG"),
            h("span", { className: "nx-region" }, data.get("region") || "Región")
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
                      alt: p.get("country"),
                      onError: function (e) { e.target.style.visibility = "hidden"; },
                    })
                  : h("span", { className: "nx-flag-img nx-flag-img--empty" }),
                h("span", { className: "nx-handle" }, p.get("handle") || "—"),
                p.get("role") ? h("span", { className: "nx-role" }, p.get("role")) : null
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

    return h("div", { className: "nx-preview" },
      h("div", { className: "nx-card nx-tournament-card" },
        h("div", { className: "nx-tournament-top" },
          h("span", { className: "nx-badge" }, STATUS_LABELS[data.get("status")] || data.get("status") || "Estado"),
          prizePool
            ? h("span", { className: "nx-prize" }, (prizePool.get("currency") || "") + " " + (prizePool.get("total") || 0))
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
            h("p", { className: "nx-fact-value" }, data.get("teamCount") || "?")
          ),
          h("div", null,
            h("p", { className: "nx-fact-label" }, "Formato"),
            h("p", { className: "nx-fact-value" }, FORMAT_LABELS[data.get("format")] || data.get("format") || "?")
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
                h("p", { className: "nx-fact-label" }, STAGE_LABELS[ph.get("key")] || ph.get("key")),
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

    return h("div", { className: "nx-preview" },
      h("p", { className: "nx-match-stage" },
        (STAGE_LABELS[data.get("stage")] || data.get("stage") || "Etapa") +
        (data.get("group") ? " · Grupo " + data.get("group") : "") +
        (data.get("bestOf") ? " · Bo" + data.get("bestOf") : "")
      ),
      h("div", { className: "nx-card nx-match-card" },
        h("span", { className: "nx-match-team" }, data.get("home") || "Por definir"),
        h("span", { className: "nx-match-score" },
          score && score.size === 2 ? score.get(0) + " – " + score.get(1) : "vs"
        ),
        h("span", { className: "nx-match-team nx-match-team--away" }, data.get("away") || "Por definir")
      ),
      h("p", { className: "nx-match-date" }, formatDate(data.get("startsAt")) || "Fecha por definir")
    );
  },
});

CMS.registerPreviewTemplate("equipos", TeamPreview);
CMS.registerPreviewTemplate("torneos", TournamentPreview);
CMS.registerPreviewTemplate("partidos", MatchPreview);

(function () {
  "use strict";

  var PERU_OFFSET_MS = 5 * 60 * 60 * 1000;
  var PERU_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var ISO_DATE_PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?Z/g;
  var TEAM_CACHE_KEY = "nx-admin-team-meta";
  var nxWindow = /** @type {any} */ (window);
  var DOTA_ICON_URL = nxWindow.NX_DOTA_ICON_URL || "https://cdn.simpleicons.org/dota2/aeb8cc";
  var DEFAULT_TEAM_META = nxWindow.NX_TEAM_META || {};

  function dismissAdminToast(toast) {
    if (!toast || toast.dataset.closing === "true") return;
    toast.dataset.closing = "true";
    toast.classList.remove("nx-toast--visible");
    window.setTimeout(function () { toast.remove(); }, 180);
  }

  function createToastIcon(tone) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", tone === "error" ? "M12 8v5m0 3h.01M10.3 3.9 2.5 18a2 2 0 0 0 1.75 3h15.5a2 2 0 0 0 1.75-3L13.7 3.9a2 2 0 0 0-3.4 0Z" : "m5 12 4 4L19 6");
    svg.appendChild(path);
    return svg;
  }

  function showAdminToast(message, tone) {
    var region = document.querySelector(".nx-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "nx-toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-relevant", "additions");
      document.body.appendChild(region);
    }

    var toast = document.createElement("div");
    toast.className = "nx-toast nx-toast--" + (tone === "error" ? "error" : "success");
    toast.setAttribute("role", tone === "error" ? "alert" : "status");
    var icon = createToastIcon(tone);
    icon.classList.add("nx-toast-icon");
    var copy = document.createElement("span");
    copy.className = "nx-toast-copy";
    copy.textContent = message;
    var close = document.createElement("button");
    close.type = "button";
    close.className = "nx-toast-close";
    close.setAttribute("aria-label", "Cerrar notificación");
    close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    close.addEventListener("click", function () { dismissAdminToast(toast); });
    toast.append(icon, copy, close);
    region.appendChild(toast);
    window.requestAnimationFrame(function () { toast.classList.add("nx-toast--visible"); });
    window.setTimeout(function () { dismissAdminToast(toast); }, 4500);
    return toast;
  }

  nxWindow.NXAdminToast = showAdminToast;
  (nxWindow.NXPendingAlerts || []).splice(0).forEach(function (message) {
    showAdminToast(message, "error");
  });

  function toPeruInputValue(value) {
    if (!value) return "";
    var timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
    if (isNaN(timestamp)) return "";
    return new Date(timestamp - PERU_OFFSET_MS).toISOString().slice(0, 16);
  }

  function fromPeruInputValue(value) {
    if (!value) return "";
    var parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!parts) return value;
    var timestamp = Date.UTC(
      Number(parts[1]),
      Number(parts[2]) - 1,
      Number(parts[3]),
      Number(parts[4]),
      Number(parts[5]),
      Number(parts[6] || 0)
    ) + PERU_OFFSET_MS;
    return new Date(timestamp).toISOString().replace(".000Z", "Z");
  }

  function utcNow() {
    return new Date().toISOString().slice(0, 19) + "Z";
  }

  function formatPeruSummaryDate(value) {
    var date = new Date(Date.parse(value) - PERU_OFFSET_MS);
    var day = date.getUTCDate();
    var month = PERU_MONTHS[date.getUTCMonth()];
    var hour = String(date.getUTCHours()).padStart(2, "0");
    var minute = String(date.getUTCMinutes()).padStart(2, "0");
    return day + " " + month + ", " + hour + ":" + minute + " PET";
  }

  function formatSummaryDates() {
    var headings = document.querySelectorAll('[class*="ListCardTitle"], [class*="CardHeading"]');
    headings.forEach(function (heading) {
      heading.childNodes.forEach(function (node) {
        if (node.nodeType !== Node.TEXT_NODE || !ISO_DATE_PATTERN.test(node.nodeValue)) return;
        ISO_DATE_PATTERN.lastIndex = 0;
        node.nodeValue = node.nodeValue.replace(ISO_DATE_PATTERN, formatPeruSummaryDate);
      });
      ISO_DATE_PATTERN.lastIndex = 0;
    });
  }

  function readTeamCache() {
    try {
      return JSON.parse(localStorage.getItem(TEAM_CACHE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function cacheVisibleTeams() {
    if (window.location.hash.indexOf("#/collections/equipos") !== 0 || window.location.hash.includes("/entries/")) return;

    var cache = readTeamCache();
    var changed = false;
    document.querySelectorAll('[class*="-ListCard-"], [class*="-GridCard-"]').forEach(function (card) {
      var link = card.querySelector('a[href*="#/collections/equipos/entries/"]');
      var heading = card.querySelector('[class*="ListCardTitle"], [class*="CardHeading"]');
      if (!link || !heading) return;

      var match = link.getAttribute("href").match(/#\/collections\/equipos\/entries\/([^/?#]+)/);
      if (!match) return;

      var id = decodeURIComponent(match[1]);
      var image = card.querySelector('[class*="StyledImage"]');
      var previous = cache[id] || {};
      var next = {
        name: heading.textContent.trim().replace(/\s+\([^)]*\)\s*$/, ""),
      };
      if (image && image.getAttribute("src")) next.logo = image.getAttribute("src");
      else if (Object.prototype.hasOwnProperty.call(previous, "logo")) next.logo = previous.logo;

      cache[id] = next;
      DEFAULT_TEAM_META[id] = Object.assign({}, DEFAULT_TEAM_META[id] || {}, next);
      changed = true;
    });

    if (changed) localStorage.setItem(TEAM_CACHE_KEY, JSON.stringify(cache));
  }

  function humanizeTeamId(id) {
    if (!id) return "Por definir";
    return id.split("-").map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function getTeamMeta(id, cache) {
    if (!id) return { name: "Por definir", logo: null };
    var base = DEFAULT_TEAM_META[id] || {};
    var stored = cache[id] || {};
    var hasStoredLogo = Object.prototype.hasOwnProperty.call(stored, "logo");
    var hasBaseLogo = Object.prototype.hasOwnProperty.call(base, "logo");
    return {
      name: stored.name || base.name || humanizeTeamId(id),
      logo: hasStoredLogo ? stored.logo : (hasBaseLogo ? base.logo : "/teams/" + id + ".webp"),
    };
  }

  function createTeamLogo(meta, className, fallbackClassName) {
    var logo = document.createElement("img");
    logo.className = className + (!meta.logo ? " " + fallbackClassName : "");
    logo.src = meta.logo || DOTA_ICON_URL;
    logo.alt = "";
    logo.loading = "lazy";
    logo.decoding = "async";
    logo.addEventListener("error", function () {
      if (logo.dataset.fallback === "true") return;
      logo.dataset.fallback = "true";
      logo.classList.add(fallbackClassName);
      logo.src = DOTA_ICON_URL;
    });
    return logo;
  }

  function enhanceTeamCards() {
    if (window.location.hash.indexOf("#/collections/equipos") !== 0 || window.location.hash.includes("/entries/")) return;

    var cache = readTeamCache();
    document.querySelectorAll('[class*="-ListCard-"]').forEach(function (card) {
      if (card.querySelector(".nx-team-list-content")) return;

      var link = card.querySelector('[class*="ListCardLink"], a');
      var source = card.querySelector('[class*="ListCardTitle"]');
      var href = link && link.getAttribute("href");
      var match = href && href.match(/#\/collections\/equipos\/entries\/([^/?#]+)/);
      if (!link || !source || !match) return;

      var meta = getTeamMeta(decodeURIComponent(match[1]), cache);
      var content = document.createElement("span");
      content.className = "nx-team-list-content";
      var label = document.createElement("span");
      label.className = "nx-team-list-label";
      label.textContent = source.textContent.trim();

      card.classList.add("nx-team-list-card");
      link.classList.add("nx-team-list-link");
      source.classList.add("nx-team-list-source");
      content.append(
        createTeamLogo(meta, "nx-team-list-logo", "nx-team-list-logo--fallback"),
        label
      );
      link.appendChild(content);
    });
  }

  function parseMatchSummary(value) {
    var parts = value.split(/\s+·\s+/);
    if (parts.length < 3) return null;
    var versus = parts.slice(2).join(" · ").match(/^(.*?)\s*vs\s*(.*?)$/i);
    if (!versus) return null;
    return {
      date: parts[0],
      group: parts[1],
      home: versus[1].trim(),
      away: versus[2].trim(),
    };
  }

  function createMatchDate(value) {
    var date = document.createElement("time");
    date.className = "nx-match-list-date";
    date.title = value;
    var parts = value.match(/^(\d{1,2})\s+([^,]+),\s+(\d{2}:\d{2})\s+PET$/i);
    if (!parts) {
      date.textContent = value;
      return date;
    }

    var day = document.createElement("span");
    day.className = "nx-match-list-day";
    day.textContent = parts[1] + " " + parts[2].toUpperCase();
    var hour = document.createElement("span");
    hour.className = "nx-match-list-hour";
    hour.textContent = parts[3] + " PET";
    date.append(day, hour);
    return date;
  }

  function createMatchTeam(id, away, cache) {
    var meta = getTeamMeta(id, cache);
    var team = document.createElement("span");
    team.className = "nx-match-list-team " + (away ? "nx-match-list-team--away" : "nx-match-list-team--home");

    var name = document.createElement("span");
    name.className = "nx-match-list-name";
    name.textContent = meta.name;

    var logo = createTeamLogo(meta, "nx-match-list-logo", "nx-match-list-logo--fallback");

    if (away) team.append(logo, name);
    else team.append(name, logo);
    return team;
  }

  function enhanceMatchCards() {
    if (window.location.hash.indexOf("#/collections/partidos") !== 0 || window.location.hash.includes("/entries/")) return;

    var cache = readTeamCache();
    document.querySelectorAll('[class*="-ListCard-"], [class*="-GridCard-"]').forEach(function (card) {
      if (card.querySelector(".nx-match-card-content")) return;

      var link = card.querySelector('[class*="ListCardLink"], [class*="GridCardLink"], a');
      var source = card.querySelector('[class*="ListCardTitle"], [class*="CardHeading"]');
      var match = source && parseMatchSummary(source.textContent.trim());
      if (!link || !source || !match) return;

      card.classList.add("nx-match-entry-card");
      link.classList.add("nx-match-entry-link");
      source.classList.add("nx-match-summary-source");
      if (card.parentElement) card.parentElement.classList.add("nx-match-entries");

      var content = document.createElement("span");
      content.className = "nx-match-card-content";
      var versus = document.createElement("span");
      versus.className = "nx-match-list-vs";
      versus.textContent = "VS";
      var group = document.createElement("span");
      group.className = "nx-match-list-group";
      group.textContent = match.group;

      content.append(
        createMatchDate(match.date),
        createMatchTeam(match.home, false, cache),
        versus,
        createMatchTeam(match.away, true, cache),
        group
      );
      link.appendChild(content);
    });
  }

  var BRACKET_SIDE_LABELS = {
    upper: "Bracket superior",
    lower: "Bracket inferior",
    final: "Gran final",
  };

  var BRACKET_STAGE_LABELS = {
    lowerRound: "Ronda inferior",
    quarterfinal: "Cuartos de final",
    semifinal: "Semifinal",
    upperFinal: "Final superior",
    lowerFinal: "Final inferior",
    final: "Final",
    grandFinal: "Gran final",
    thirdPlace: "Tercer puesto",
  };

  function bracketMatchesToJS(value) {
    if (!value) return [];
    var plain = typeof value.toJS === "function" ? value.toJS() : value;
    return Array.isArray(plain) ? plain : [];
  }

  function cloneBracketMatches(matches) {
    return JSON.parse(JSON.stringify(matches));
  }

  function bracketMatchLabel(match, matches) {
    if (!match) return "Cruce desconocido";
    var label = BRACKET_STAGE_LABELS[match.stage] || humanizeTeamId(match.stage);
    var repeats = matches.filter(function (candidate) {
      return candidate.stage === match.stage && candidate.bracket === match.bracket && candidate.round === match.round;
    }).length > 1;
    return repeats ? label + " " + match.slot : label;
  }

  function bracketBestOf(match, defaultBestOf) {
    return Number(match && match.bestOf) || Number(defaultBestOf) || 3;
  }

  function hasBracketScoreValues(match) {
    return Boolean(
      match &&
      match.score &&
      match.score.home !== "" &&
      match.score.away !== "" &&
      Number.isFinite(Number(match.score.home)) &&
      Number.isFinite(Number(match.score.away))
    );
  }

  function hasBracketScore(match, defaultBestOf) {
    if (!hasBracketScoreValues(match)) return false;
    var winsNeeded = Math.floor(bracketBestOf(match, defaultBestOf) / 2) + 1;
    return Number(match.score.home) !== Number(match.score.away) &&
      Math.max(Number(match.score.home), Number(match.score.away)) === winsNeeded &&
      Math.min(Number(match.score.home), Number(match.score.away)) < winsNeeded;
  }

  function resolveBracketTeamId(matches, match, side, defaultBestOf, stack) {
    if (!match) return null;
    if (match[side]) return match[side];

    var source = match[side + "Source"];
    if (!source) return null;
    var path = stack || new Set();
    if (path.has(match.id)) return null;

    var sourceMatch = matches.find(function (candidate) { return candidate.id === source.match; });
    if (!sourceMatch || !hasBracketScore(sourceMatch, defaultBestOf)) return null;

    var nextPath = new Set(path);
    nextPath.add(match.id);
    var home = resolveBracketTeamId(matches, sourceMatch, "home", defaultBestOf, nextPath);
    var away = resolveBracketTeamId(matches, sourceMatch, "away", defaultBestOf, nextPath);
    if (!home || !away || Number(sourceMatch.score.home) === Number(sourceMatch.score.away)) return null;

    var homeWins = Number(sourceMatch.score.home) > Number(sourceMatch.score.away);
    if (source.outcome === "winner") return homeWins ? home : away;
    return homeWins ? away : home;
  }

  function bracketDependsOn(match, sourceId, matchById, seen) {
    var visited = seen || new Set();
    if (visited.has(match.id)) return false;
    visited.add(match.id);

    return ["homeSource", "awaySource"].some(function (field) {
      var source = match[field];
      if (!source) return false;
      if (source.match === sourceId) return true;
      var sourceMatch = matchById.get(source.match);
      return sourceMatch ? bracketDependsOn(sourceMatch, sourceId, matchById, visited) : false;
    });
  }

  function clearBracketDescendantScores(matches, sourceId) {
    var matchById = new Map(matches.map(function (match) { return [match.id, match]; }));
    matches.forEach(function (match) {
      if (bracketDependsOn(match, sourceId, matchById) && match.score) delete match.score;
    });
  }

  function bracketOutcomeSignature(matches, match, defaultBestOf) {
    if (!hasBracketScore(match, defaultBestOf)) return "";
    var home = resolveBracketTeamId(matches, match, "home", defaultBestOf);
    var away = resolveBracketTeamId(matches, match, "away", defaultBestOf);
    if (!home || !away) return "";
    return Number(match.score.home) > Number(match.score.away)
      ? home + "|" + away
      : away + "|" + home;
  }

  function bracketTeamOptions(matches) {
    var cache = readTeamCache();
    var ids = new Set(Object.keys(DEFAULT_TEAM_META).concat(Object.keys(cache)));
    matches.forEach(function (match) {
      if (match.home) ids.add(match.home);
      if (match.away) ids.add(match.away);
    });
    return Array.from(ids).map(function (id) {
      return { id: id, meta: getTeamMeta(id, cache) };
    }).sort(function (a, b) {
      return a.meta.name.localeCompare(b.meta.name);
    });
  }

  function bracketTeamMark(id, cache) {
    if (!id) return h("span", { className: "nx-bracket-editor-logo nx-bracket-editor-logo--empty", "aria-hidden": "true" });
    var meta = getTeamMeta(id, cache);
    return h("img", {
      className: "nx-bracket-editor-logo" + (!meta.logo ? " nx-bracket-editor-logo--fallback" : ""),
      src: meta.logo || DOTA_ICON_URL,
      alt: "",
      onError: function (event) {
        if (event.target.dataset.fallback === "true") return;
        event.target.dataset.fallback = "true";
        event.target.classList.add("nx-bracket-editor-logo--fallback");
        event.target.src = DOTA_ICON_URL;
      },
    });
  }

  var BRACKET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var BRACKET_SIDES = ["upper", "lower", "final"];

  function bracketValidationLabel(match, index) {
    return match && match.id ? 'El cruce "' + match.id + '"' : "El cruce " + (index + 1);
  }

  function hasBracketScoreValue(score, side) {
    return Boolean(score) && score[side] !== "" && score[side] != null;
  }

  function getBracketValidationError(matches, defaultBestOf) {
    if (!Number.isInteger(defaultBestOf) || defaultBestOf < 1 || defaultBestOf % 2 === 0) {
      return "El mejor de predeterminado debe ser un número impar positivo.";
    }
    if (!Array.isArray(matches) || !matches.length) {
      return "El bracket necesita al menos un cruce.";
    }

    var matchById = new Map();
    var positions = new Set();
    var directTeams = new Set();
    var sourceUses = new Set();

    for (var index = 0; index < matches.length; index += 1) {
      var match = matches[index];
      var label = bracketValidationLabel(match, index);
      if (!match || typeof match !== "object" || Array.isArray(match)) {
        return label + " no tiene una estructura válida.";
      }
      if (typeof match.id !== "string" || !BRACKET_ID_PATTERN.test(match.id)) {
        return label + " necesita un ID con minúsculas, números y guiones.";
      }
      if (matchById.has(match.id)) {
        return label + " repite un ID ya utilizado.";
      }
      matchById.set(match.id, match);

      if (!Object.prototype.hasOwnProperty.call(BRACKET_STAGE_LABELS, match.stage)) {
        return label + " tiene una etapa no permitida.";
      }
      if (!BRACKET_SIDES.includes(match.bracket)) {
        return label + " tiene un lado de bracket no permitido.";
      }
      if (!Number.isInteger(match.round) || match.round < 1 || !Number.isInteger(match.slot) || match.slot < 1) {
        return label + " necesita ronda y posición enteras positivas.";
      }
      var position = match.bracket + ":" + match.round + ":" + match.slot;
      if (positions.has(position)) {
        return label + " repite una posición ya utilizada.";
      }
      positions.add(position);

      if (typeof match.startsAt !== "string" || !Number.isFinite(Date.parse(match.startsAt))) {
        return label + " necesita una fecha válida.";
      }
      if (match.bestOf != null && (!Number.isInteger(match.bestOf) || match.bestOf < 1 || match.bestOf % 2 === 0)) {
        return label + " necesita un mejor de impar positivo.";
      }

      for (var sideIndex = 0; sideIndex < 2; sideIndex += 1) {
        var side = sideIndex === 0 ? "home" : "away";
        var directTeam = match[side];
        var source = match[side + "Source"];
        if (directTeam != null && directTeam !== "" && typeof directTeam !== "string") {
          return label + " tiene un equipo directo inválido.";
        }
        if (directTeam && source) {
          return label + " no puede usar equipo directo y origen en el mismo asiento.";
        }
        if (directTeam && directTeams.has(directTeam)) {
          return "El equipo " + humanizeTeamId(directTeam) + " ocupa más de un asiento inicial.";
        }
        if (directTeam) directTeams.add(directTeam);

        if (source != null) {
          if (!source || typeof source !== "object" || Array.isArray(source)) {
            return label + " tiene un origen inválido.";
          }
          if (typeof source.match !== "string" || !BRACKET_ID_PATTERN.test(source.match)) {
            return label + " tiene un ID de origen inválido.";
          }
          if (source.outcome !== "winner" && source.outcome !== "loser") {
            return label + " tiene un resultado de origen inválido.";
          }
          var sourceUse = source.match + ":" + source.outcome;
          if (sourceUses.has(sourceUse)) {
            return "El origen " + sourceUse + " alimenta más de un asiento.";
          }
          sourceUses.add(sourceUse);
        }
      }

      if (match.home && match.home === match.away) {
        return label + " no puede enfrentar al mismo equipo consigo mismo.";
      }
      if (match.score != null) {
        if (!match.score || typeof match.score !== "object" || Array.isArray(match.score)) {
          return label + " tiene un resultado inválido.";
        }
        var hasHomeScore = hasBracketScoreValue(match.score, "home");
        var hasAwayScore = hasBracketScoreValue(match.score, "away");
        if (!hasHomeScore || !hasAwayScore) {
          return label + " necesita ambos valores del resultado o ninguno.";
        }
        if (!Number.isInteger(match.score.home) || match.score.home < 0 || !Number.isInteger(match.score.away) || match.score.away < 0) {
          return label + " necesita resultados enteros no negativos.";
        }
        if (!hasBracketScore(match, defaultBestOf)) {
          return label + " tiene un resultado incompatible con Bo" + bracketBestOf(match, defaultBestOf) + ".";
        }
      }
    }

    for (var matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
      var currentMatch = matches[matchIndex];
      for (var currentSideIndex = 0; currentSideIndex < 2; currentSideIndex += 1) {
        var currentSide = currentSideIndex === 0 ? "home" : "away";
        var currentSource = currentMatch[currentSide + "Source"];
        if (!currentSource) continue;
        var sourceMatch = matchById.get(currentSource.match);
        if (!sourceMatch) {
          return bracketValidationLabel(currentMatch, matchIndex) + ' apunta al origen inexistente "' + currentSource.match + '".';
        }
        if (Date.parse(sourceMatch.startsAt) >= Date.parse(currentMatch.startsAt)) {
          return bracketValidationLabel(currentMatch, matchIndex) + " debe comenzar después de sus cruces de origen.";
        }
      }
    }

    var visiting = new Set();
    var visited = new Set();
    var cycleAt = "";
    function visit(match) {
      if (cycleAt || visited.has(match.id)) return;
      if (visiting.has(match.id)) {
        cycleAt = match.id;
        return;
      }
      visiting.add(match.id);
      ["homeSource", "awaySource"].forEach(function (field) {
        var sourceMatch = matchById.get(match[field] && match[field].match);
        if (sourceMatch) visit(sourceMatch);
      });
      visiting.delete(match.id);
      visited.add(match.id);
    }
    matches.forEach(visit);
    if (cycleAt) return 'El bracket contiene un ciclo de progresión en "' + cycleAt + '".';

    for (var resolvedIndex = 0; resolvedIndex < matches.length; resolvedIndex += 1) {
      var resolvedMatch = matches[resolvedIndex];
      var resolvedHome = resolveBracketTeamId(matches, resolvedMatch, "home", defaultBestOf);
      var resolvedAway = resolveBracketTeamId(matches, resolvedMatch, "away", defaultBestOf);
      if (resolvedHome && resolvedAway && resolvedHome === resolvedAway) {
        return bracketValidationLabel(resolvedMatch, resolvedIndex) + " resuelve el mismo equipo en ambos lados.";
      }
      if (resolvedMatch.score && (!resolvedHome || !resolvedAway)) {
        return bracketValidationLabel(resolvedMatch, resolvedIndex) + " no puede tener resultado hasta resolver ambos equipos.";
      }
    }

    return "";
  }

  var BracketEditorControl = createClass({
    getMatches: function () {
      return bracketMatchesToJS(this.props.value);
    },

    isValid: function () {
      var error = getBracketValidationError(this.getMatches(), this.getDefaultBestOf());
      return error ? { error: { message: error } } : true;
    },

    commit: function (matches) {
      this.props.onChange(matches);
    },

    getDefaultBestOf: function () {
      var data = this.props.entry && this.props.entry.get("data");
      return Number(data && data.get("defaultBestOf")) || 3;
    },

    updateDate: function (index, value) {
      var matches = cloneBracketMatches(this.getMatches());
      matches[index].startsAt = fromPeruInputValue(value);
      this.commit(matches);
    },

    updateBestOf: function (index, value) {
      var matches = cloneBracketMatches(this.getMatches());
      var match = matches[index];
      var defaultBestOf = this.getDefaultBestOf();
      var previousOutcome = bracketOutcomeSignature(matches, match, defaultBestOf);
      if (value === "") delete match.bestOf;
      else match.bestOf = Number(value);
      if (previousOutcome !== bracketOutcomeSignature(matches, match, defaultBestOf)) {
        clearBracketDescendantScores(matches, match.id);
      }
      this.commit(matches);
    },

    updateDirectTeam: function (index, side, value) {
      var matches = cloneBracketMatches(this.getMatches());
      var match = matches[index];
      var duplicate = value && matches.some(function (candidate) {
        return ["home", "away"].some(function (candidateSide) {
          return candidate[candidateSide] === value && !(candidate.id === match.id && candidateSide === side);
        });
      });
      if (duplicate) return;
      if (value) match[side] = value;
      else delete match[side];
      if (match.score) delete match.score;
      clearBracketDescendantScores(matches, match.id);
      this.commit(matches);
    },

    updateScore: function (index, side, value) {
      var matches = cloneBracketMatches(this.getMatches());
      var match = matches[index];
      var defaultBestOf = this.getDefaultBestOf();
      var previousOutcome = bracketOutcomeSignature(matches, match, defaultBestOf);
      var score = Object.assign({}, match.score || {});
      if (value === "") delete score[side];
      else score[side] = Number(value);
      if (!Object.prototype.hasOwnProperty.call(score, "home") && !Object.prototype.hasOwnProperty.call(score, "away")) {
        delete match.score;
      } else {
        match.score = score;
      }
      if (previousOutcome !== bracketOutcomeSignature(matches, match, defaultBestOf)) {
        clearBracketDescendantScores(matches, match.id);
      }
      this.commit(matches);
    },

    renderSeat: function (matches, match, index, side, options, cache, defaultBestOf) {
      var self = this;
      var source = match[side + "Source"];
      var resolvedId = resolveBracketTeamId(matches, match, side, defaultBestOf);
      var label = side === "home" ? "Equipo local" : "Equipo visitante";

      if (source) {
        var sourceMatch = matches.find(function (candidate) { return candidate.id === source.match; });
        var sourceLabel = (source.outcome === "winner" ? "Ganador" : "Perdedor") + " de " + bracketMatchLabel(sourceMatch, matches);
        var resolvedMeta = resolvedId ? getTeamMeta(resolvedId, cache) : null;
        return h(
          "div",
          { className: "nx-bracket-editor-field" },
          h("span", { className: "nx-bracket-editor-label" }, label),
          h(
            "div",
            { className: "nx-bracket-editor-seat nx-bracket-editor-seat--source" },
            bracketTeamMark(resolvedId, cache),
            h(
              "span",
              { className: "nx-bracket-editor-seat-copy" },
              h("strong", null, resolvedMeta ? resolvedMeta.name : "Por definir"),
              h("small", null, sourceLabel)
            )
          )
        );
      }

      return h(
        "div",
        { className: "nx-bracket-editor-field" },
        h("label", { className: "nx-bracket-editor-label", htmlFor: this.props.forID + "-" + match.id + "-" + side }, label),
        h(
          "div",
          { className: "nx-bracket-editor-seat" },
          bracketTeamMark(resolvedId, cache),
          h(
            "select",
            {
              id: this.props.forID + "-" + match.id + "-" + side,
              value: match[side] || "",
              disabled: Boolean(this.props.isDisabled),
              onChange: function (event) { self.updateDirectTeam(index, side, event.target.value); },
            },
            h("option", { value: "" }, "Seleccionar equipo"),
            options.map(function (option) {
              var usedElsewhere = matches.some(function (candidate) {
                return ["home", "away"].some(function (candidateSide) {
                  return candidate[candidateSide] === option.id && !(candidate.id === match.id && candidateSide === side);
                });
              });
              return h("option", { key: option.id, value: option.id, disabled: usedElsewhere }, option.meta.name);
            })
          )
        )
      );
    },

    renderMatch: function (matches, match, index, options, cache, defaultBestOf) {
      var self = this;
      var homeId = resolveBracketTeamId(matches, match, "home", defaultBestOf);
      var awayId = resolveBracketTeamId(matches, match, "away", defaultBestOf);
      var scoreEnabled = Boolean(homeId && awayId) && !this.props.isDisabled;
      var completeScore = hasBracketScore(match, defaultBestOf);
      var hasScoreValues = hasBracketScoreValues(match);
      var tied = hasScoreValues && Number(match.score.home) === Number(match.score.away);
      var homeWins = completeScore && !tied && Number(match.score.home) > Number(match.score.away);
      var winnerId = completeScore && !tied ? (homeWins ? homeId : awayId) : null;
      var winnerMeta = winnerId ? getTeamMeta(winnerId, cache) : null;
      var effectiveBestOf = bracketBestOf(match, defaultBestOf);
      var winsNeeded = Math.floor(effectiveBestOf / 2) + 1;

      return h(
        "article",
        { key: match.id, className: "nx-bracket-editor-match" + (tied ? " nx-bracket-editor-match--invalid" : "") },
        h(
          "header",
          { className: "nx-bracket-editor-match-head" },
          h("h5", null, bracketMatchLabel(match, matches)),
          h("span", null, match.id)
        ),
        h(
          "div",
          { className: "nx-bracket-editor-seats" },
          this.renderSeat(matches, match, index, "home", options, cache, defaultBestOf),
          this.renderSeat(matches, match, index, "away", options, cache, defaultBestOf)
        ),
        h(
          "div",
          { className: "nx-bracket-editor-settings" },
          h(
            "label",
            { className: "nx-bracket-editor-field" },
            h("span", { className: "nx-bracket-editor-label" }, "Fecha y hora PET"),
            h("input", {
              type: "datetime-local",
              step: "60",
              value: toPeruInputValue(match.startsAt),
              disabled: Boolean(this.props.isDisabled),
              onChange: function (event) { self.updateDate(index, event.target.value); },
            })
          ),
          h(
            "label",
            { className: "nx-bracket-editor-field nx-bracket-editor-bo" },
            h("span", { className: "nx-bracket-editor-label" }, "Mejor de"),
            h("input", {
              type: "number",
              min: "1",
              step: "2",
              placeholder: "3",
              value: match.bestOf == null ? "" : match.bestOf,
              disabled: Boolean(this.props.isDisabled),
              onChange: function (event) { self.updateBestOf(index, event.target.value); },
              "aria-label": "Mejor de para " + bracketMatchLabel(match, matches),
            })
          )
        ),
        h(
          "fieldset",
          { className: "nx-bracket-editor-score", disabled: !scoreEnabled },
          h("legend", null, "Resultado · Bo" + effectiveBestOf),
          h(
            "label",
            null,
            h("span", null, homeId ? getTeamMeta(homeId, cache).name : "Local"),
            h("input", {
              type: "number",
              min: "0",
              max: String(winsNeeded),
              inputMode: "numeric",
              value: match.score && match.score.home != null ? match.score.home : "",
              onChange: function (event) { self.updateScore(index, "home", event.target.value); },
              "aria-label": "Mapas del equipo local en " + bracketMatchLabel(match, matches),
            })
          ),
          h("span", { className: "nx-bracket-editor-score-separator", "aria-hidden": "true" }, "–"),
          h(
            "label",
            null,
            h("span", null, awayId ? getTeamMeta(awayId, cache).name : "Visitante"),
            h("input", {
              type: "number",
              min: "0",
              max: String(winsNeeded),
              inputMode: "numeric",
              value: match.score && match.score.away != null ? match.score.away : "",
              onChange: function (event) { self.updateScore(index, "away", event.target.value); },
              "aria-label": "Mapas del equipo visitante en " + bracketMatchLabel(match, matches),
            })
          )
        ),
        !homeId || !awayId
          ? h("p", { className: "nx-bracket-editor-note" }, "El resultado se habilita cuando ambos equipos estén definidos.")
          : tied
            ? h("p", { className: "nx-bracket-editor-note nx-bracket-editor-note--error" }, "El resultado no puede terminar empatado.")
            : hasScoreValues && !completeScore
              ? h("p", { className: "nx-bracket-editor-note" }, "Para cerrar el Bo" + effectiveBestOf + ", el ganador necesita " + winsNeeded + " mapas.")
            : winnerMeta
              ? h("p", { className: "nx-bracket-editor-note nx-bracket-editor-note--winner" }, "Avanza: " + winnerMeta.name)
              : null
      );
    },

    renderSide: function (matches, side, options, cache, defaultBestOf) {
      var self = this;
      var sideMatches = matches.filter(function (match) { return match.bracket === side; });
      if (!sideMatches.length) return null;
      var rounds = Array.from(new Set(sideMatches.map(function (match) { return Number(match.round); }))).sort(function (a, b) { return a - b; });

      return h(
        "section",
        { key: side, className: "nx-bracket-editor-side" },
        h("h4", null, BRACKET_SIDE_LABELS[side] || side),
        h(
          "div",
          { className: "nx-bracket-editor-rounds" },
          rounds.map(function (round) {
            return h(
              "div",
              { key: round, className: "nx-bracket-editor-round" },
              h("p", { className: "nx-bracket-editor-round-label" }, side === "final" ? "Partido decisivo" : "Ronda " + round),
              sideMatches
                .filter(function (match) { return Number(match.round) === round; })
                .sort(function (a, b) { return Number(a.slot) - Number(b.slot); })
                .map(function (match) {
                  return self.renderMatch(matches, match, matches.indexOf(match), options, cache, defaultBestOf);
                })
            );
          })
        )
      );
    },

    render: function () {
      var matches = this.getMatches();
      var cache = readTeamCache();
      var options = bracketTeamOptions(matches);
      var defaultBestOf = this.getDefaultBestOf();
      var validationError = getBracketValidationError(matches, defaultBestOf);
      var wrapper = (this.props.classNameWrapper || "") + " nx-bracket-editor";

      return h(
        "div",
        { className: wrapper },
        h(
          "div",
          { className: "nx-bracket-editor-intro" },
          h("div", null,
            h("h3", null, "Editor completo de eliminatorias"),
            h("p", null, "Los asientos derivados se completan con el ganador o perdedor del cruce anterior.")
          ),
          h("span", null, "1 solo guardado")
        ),
        h("p", { className: "nx-bracket-editor-warning" }, "Si una corrección cambia quién avanza, se limpian los resultados posteriores para evitar inconsistencias."),
        validationError
          ? h("p", { className: "nx-bracket-editor-warning nx-bracket-editor-warning--error", role: "alert" }, validationError)
          : null,
        matches.length
          ? ["upper", "lower", "final"].map(function (side) {
              return this.renderSide(matches, side, options, cache, defaultBestOf);
            }, this)
          : h("p", { className: "nx-bracket-editor-empty" }, "Este bracket todavía no tiene cruces configurados.")
      );
    },
  });

  var PeruDateTimeControl = createClass({
    handleChange: function (event) {
      this.props.onChange(fromPeruInputValue(event.target.value));
    },

    handleNow: function () {
      this.props.onChange(utcNow());
    },

    handleClear: function () {
      this.props.onChange("");
    },

    render: function () {
      var id = this.props.forID;
      var disabled = Boolean(this.props.isDisabled);
      return h(
        "div",
        { className: this.props.classNameWrapper + " nx-peru-datetime" },
        h("input", {
          id: id,
          type: "datetime-local",
          step: "60",
          value: toPeruInputValue(this.props.value),
          onChange: this.handleChange,
          onFocus: this.props.setActiveStyle,
          onBlur: this.props.setInactiveStyle,
          disabled: disabled,
          "aria-describedby": id + "-timezone",
        }),
        h(
          "span",
          {
            id: id + "-timezone",
            className: "nx-peru-timezone",
            title: "Hora de Lima, Perú (UTC-5)",
          },
          "PET · UTC-5"
        ),
        disabled ? null : h("button", { type: "button", "data-testid": "now-button", onClick: this.handleNow }, "Ahora"),
        disabled ? null : h("button", { type: "button", "data-testid": "clear-button", onClick: this.handleClear }, "Limpiar")
      );
    },
  });

  var dateTimeWidget = CMS.getWidget("datetime");
  CMS.registerWidget(
    "peru_datetime",
    PeruDateTimeControl,
    dateTimeWidget.preview,
    dateTimeWidget.schema
  );

  var listWidget = CMS.getWidget("list");
  CMS.registerWidget(
    "bracket_editor",
    BracketEditorControl,
    listWidget.preview,
    listWidget.schema
  );

  if (typeof CMS.registerEventListener === "function") {
    CMS.registerEventListener({
      name: "postSave",
      handler: function () {
        showAdminToast("Cambios guardados correctamente.", "success");
      },
    });
  }

  var mobileQuery = window.matchMedia("(max-width: 900px)");
  var toggle = null;
  var frameRequested = false;

  function setAttributeIfChanged(element, name, value) {
    if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  }

  function setPreviewOpen(open) {
    document.body.classList.toggle("nx-preview-open", open);
    syncEditor();
  }

  function createToggle() {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nx-preview-toggle";
    toggle.setAttribute("aria-controls", "nx-editor-form nx-editor-preview");
    toggle.addEventListener("click", function () {
      setPreviewOpen(!document.body.classList.contains("nx-preview-open"));
    });
    document.body.appendChild(toggle);
  }

  function updateToggle(open) {
    var state = open ? "preview" : "editor";
    if (toggle.dataset.state === state) {
      return;
    }

    var label = open ? "Volver a editar" : "Vista previa";
    var icon = open
      ? '<path d="M15 18l-6-6 6-6"/><path d="M9 12h10"/>'
      : '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>';

    toggle.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icon + "</svg><span>" + label + "</span>";
    toggle.dataset.state = state;
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("aria-pressed", String(open));
  }

  function syncEditor() {
    frameRequested = false;
    cacheVisibleTeams();
    enhanceTeamCards();
    formatSummaryDates();
    enhanceMatchCards();

    var formPane = document.querySelector(".SplitPane > .Pane1");
    var previewPane = document.querySelector(".SplitPane > .Pane2");
    var toolbar = document.querySelector('[class*="ToolbarContainer"]');
    var active = Boolean(formPane && previewPane && toolbar);

    document.body.classList.toggle("nx-editor-active", active);

    if (!active) {
      document.body.classList.remove("nx-preview-open");
      if (toggle) {
        toggle.remove();
        toggle = null;
      }
      return;
    }

    formPane.id = "nx-editor-form";
    previewPane.id = "nx-editor-preview";

    if (!toggle) {
      createToggle();
    }

    var open = document.body.classList.contains("nx-preview-open");
    updateToggle(open);

    if (mobileQuery.matches) {
      setAttributeIfChanged(formPane, "aria-hidden", String(open));
      setAttributeIfChanged(previewPane, "aria-hidden", String(!open));
    } else {
      formPane.removeAttribute("aria-hidden");
      previewPane.removeAttribute("aria-hidden");
    }
  }

  function scheduleSync() {
    if (!frameRequested) {
      frameRequested = true;
      window.requestAnimationFrame(syncEditor);
    }
  }

  new MutationObserver(scheduleSync).observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("hashchange", function () {
    document.body.classList.remove("nx-preview-open");
    scheduleSync();
  });

  mobileQuery.addEventListener("change", scheduleSync);

  scheduleSync();
})();

(function () {
  "use strict";

  var nxWindow = /** @type {any} */ (window);
  var createElement = h;
  var makeClass = createClass;
  var IMPORT_FIELDS = [
    { name: "name", label: "Nombre" },
    { name: "tag", label: "Tag" },
    { name: "id", label: "ID interno", newOnly: true },
    { name: "country", label: "País" },
    { name: "region", label: "Región" },
    { name: "players", label: "Plantilla activa" },
    { name: "logo", label: "Logo" },
  ];

  function toPlain(value) {
    if (value && typeof value.toJS === "function") return value.toJS();
    return value;
  }

  function getCurrentData(props) {
    var data = props.entry && props.entry.get("data");
    return data && typeof data.toJS === "function" ? data.toJS() : {};
  }

  function valuesEqual(left, right) {
    return JSON.stringify(left == null ? null : left) === JSON.stringify(right == null ? null : right);
  }

  function hasImportValue(name, value) {
    if (name === "players") return Array.isArray(value) && value.length > 0;
    if (name === "logo") return Boolean(value && value.dataUrl);
    return value != null && value !== "";
  }

  function getFiber(element) {
    if (!element) return null;
    var key = Object.keys(element).find(function (name) {
      return name.indexOf("__reactFiber$") === 0 || name.indexOf("__reactInternalInstance$") === 0;
    });
    return key ? element[key] : null;
  }

  function getEditorInstance() {
    var panes = document.querySelectorAll('[class*="ControlPaneContainer"]');
    for (var index = panes.length - 1; index >= 0; index -= 1) {
      var fiber = getFiber(panes[index]);
      while (fiber) {
        var instance = fiber.stateNode;
        if (
          instance &&
          typeof instance.handleChangeDraftField === "function" &&
          instance.props &&
          instance.props.collection &&
          instance.props.collection.get("name") === "equipos"
        ) {
          return instance;
        }
        fiber = fiber.return;
      }
    }
    return null;
  }

  function getDecapStore() {
    var fiber = getFiber(document.querySelector('[class*="AppMainContainer"]'));
    while (fiber) {
      var props = fiber.memoizedProps || fiber.pendingProps;
      if (props && props.store && typeof props.store.getState === "function") return props.store;
      fiber = fiber.return;
    }
    return null;
  }

  function toImmutable(value, editor) {
    if (Array.isArray(value)) {
      var list = editor.props.fields.clear();
      value.forEach(function (item) { list = list.push(toImmutable(item, editor)); });
      return list;
    }
    if (value && typeof value === "object") {
      var map = editor.props.collection.clear();
      Object.keys(value).forEach(function (key) { map = map.set(key, toImmutable(value[key], editor)); });
      return map;
    }
    return value;
  }

  function updateDraftFields(updates) {
    var editor = getEditorInstance();
    if (!editor) throw new Error("No se pudo conectar con el borrador de Decap.");
    Object.keys(updates).forEach(function (name) {
      var field = editor.props.fields.find(function (candidate) { return candidate.get("name") === name; });
      if (!field) return;
      editor.handleChangeDraftField(field, toImmutable(updates[name], editor));
    });
  }

  function digestFile(file) {
    return file.arrayBuffer().then(function (buffer) {
      return crypto.subtle.digest("SHA-1", buffer);
    }).then(function (digest) {
      return Array.from(new Uint8Array(digest)).map(function (byte) {
        return byte.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(",");
    var mime = (parts[0].match(/^data:([^;]+)/) || [])[1] || "image/png";
    var binary = atob(parts[1] || "");
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, type, quality); });
  }

  async function createOptimizedLogo(dataUrl, teamId) {
    var source = dataUrlToBlob(dataUrl);
    try {
      var bitmap = await createImageBitmap(source);
      var scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      var canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      var context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      var optimized = await canvasToBlob(canvas, "image/webp", 0.9);
      if (optimized) return new File([optimized], teamId + ".webp", { type: "image/webp" });
    } catch (error) {
      console.warn("No se pudo convertir el logo a WebP; se conservará su formato.", error);
    }

    var extension = source.type === "image/svg+xml" ? "svg" : source.type.split("/")[1] || "png";
    return new File([source], teamId + "." + extension.replace("jpeg", "jpg"), { type: source.type });
  }

  function createAssetProxy(path, url, file, field) {
    return {
      path: path,
      url: url,
      fileObj: file,
      field: field,
      toString: function () { return this.url; },
      toBase64: async function () {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () { resolve(String(reader.result || "").split("base64,")[1] || ""); };
          reader.readAsDataURL(file);
        });
      },
    };
  }

  async function attachLogoToDraft(logo, teamId) {
    var editor = getEditorInstance();
    var store = getDecapStore();
    if (!editor || !store) throw new Error("No se pudo conectar el logo con el borrador de Decap.");

    var field = editor.props.fields.find(function (candidate) { return candidate.get("name") === "logo"; });
    var file = await createOptimizedLogo(logo.dataUrl, teamId);
    var path = "public/teams/" + file.name;
    var publicPath = "/teams/" + file.name;
    var state = store.getState();
    var mediaFiles = state.entryDraft.getIn(["entry", "mediaFiles"]);
    if (mediaFiles) {
      mediaFiles.forEach(function (mediaFile) {
        if (mediaFile.get("path") === path || mediaFile.getIn(["field", "name"]) === "logo") {
          store.dispatch({ type: "REMOVE_DRAFT_ENTRY_MEDIA_FILE", payload: { id: mediaFile.get("id") } });
          store.dispatch({ type: "REMOVE_ASSET", payload: mediaFile.get("path") });
          store.dispatch({ type: "REMOVE_ASSET", payload: publicPath });
        }
      });
    }

    var id = await digestFile(file);
    var objectUrl = URL.createObjectURL(file);
    var mediaFile = {
      id: id,
      name: file.name,
      displayURL: objectUrl,
      draft: true,
      file: file,
      size: file.size,
      url: objectUrl,
      path: path,
      field: field,
    };
    store.dispatch({ type: "ADD_ASSET", payload: createAssetProxy(publicPath, objectUrl, file, field) });
    store.dispatch({ type: "ADD_DRAFT_ENTRY_MEDIA_FILE", payload: mediaFile });
    return publicPath;
  }

  function summarizeValue(name, value) {
    if (value == null || value === "") return "Sin dato";
    if (name === "players") {
      return value.length ? value.map(function (player) { return player.handle; }).join(", ") : "Sin plantilla";
    }
    if (name === "logo") return value.fileName || "Logo disponible";
    return String(value);
  }

  function getCandidateValue(team, name, state) {
    if (name === "tag") return state.importTag;
    if (name === "id") return state.importId;
    return team[name];
  }

  function getLogoChanged(team, current) {
    if (!team.logo) return false;
    if (!current.logo) return true;
    return !current.liquipediaLogoSha1 || current.liquipediaLogoSha1 !== team.logo.sha1;
  }

  var LiquipediaTeamControl = makeClass({
    getInitialState: function () {
      return {
        query: toPlain(this.props.value) || "",
        loading: false,
        applying: false,
        error: "",
        result: null,
        selections: {},
        importTag: "",
        importId: "",
      };
    },

    isValid: function () {
      var value = toPlain(this.props.value);
      if (!value) return true;
      return /^https:\/\/liquipedia\.net\/dota2\/.+/.test(value)
        ? true
        : { error: { message: "La fuente debe ser una página de Liquipedia Dota 2." } };
    },

    handleQuery: function (event) {
      this.setState({ query: event.target.value, error: "" });
    },

    handleKeyDown: function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        this.handleSearch();
      }
    },

    handleSearch: async function () {
      var query = this.state.query.trim();
      if (!query || this.state.loading) return;
      this.setState({ loading: true, error: "", result: null });
      try {
        var response = await fetch("/api/liquipedia/team?input=" + encodeURIComponent(query), {
          headers: { Accept: "application/json" },
        });
        var payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "No se pudo consultar Liquipedia.");

        var current = getCurrentData(this.props);
        var team = payload.team;
        var isNew = !current.id;
        var selections = {};
        IMPORT_FIELDS.forEach(function (field) {
          var value = field.name === "logo" ? team.logo : team[field.name];
          if (!hasImportValue(field.name, value) || (field.newOnly && !isNew)) {
            selections[field.name] = false;
            return;
          }
          if (isNew) {
            selections[field.name] = true;
          } else if (field.name === "tag" || field.name === "id") {
            selections[field.name] = false;
          } else if (field.name === "logo") {
            selections[field.name] = getLogoChanged(team, current);
          } else {
            selections[field.name] = !valuesEqual(current[field.name], value);
          }
        });

        this.setState({
          loading: false,
          result: payload,
          selections: selections,
          importTag: team.tag || "",
          importId: isNew ? team.id || "" : current.id,
        });
      } catch (error) {
        this.setState({ loading: false, error: error.message || "No se pudo consultar Liquipedia." });
        if (typeof nxWindow.NXAdminToast === "function") nxWindow.NXAdminToast(error.message, "error");
      }
    },

    toggleSelection: function (name) {
      var selections = Object.assign({}, this.state.selections);
      selections[name] = !selections[name];
      this.setState({ selections: selections });
    },

    handleImportedTag: function (event) {
      this.setState({ importTag: event.target.value.toUpperCase().slice(0, 4) });
    },

    handleImportedId: function (event) {
      this.setState({ importId: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") });
    },

    handleApply: async function () {
      if (!this.state.result || this.state.applying) return;
      var current = getCurrentData(this.props);
      var team = this.state.result.team;
      var selections = this.state.selections;
      var id = current.id || this.state.importId;
      var tag = this.state.importTag;

      if (selections.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
        this.setState({ error: "El ID debe usar minúsculas, números y guiones." });
        return;
      }
      if (selections.tag && !/^.{2,4}$/.test(tag)) {
        this.setState({ error: "El tag debe tener entre 2 y 4 caracteres." });
        return;
      }

      this.setState({ applying: true, error: "" });
      try {
        var updates = {};
        IMPORT_FIELDS.forEach(function (field) {
          if (!selections[field.name] || field.name === "logo") return;
          updates[field.name] = getCandidateValue(team, field.name, { importTag: tag, importId: id });
        });
        if (selections.logo && team.logo) updates.logo = await attachLogoToDraft(team.logo, id);

        if (selections.logo && team.logo) {
          updates.liquipediaLogoSource = team.logo.descriptionUrl;
          if (team.logo.sha1) updates.liquipediaLogoSha1 = team.logo.sha1;
        }
        updates.liquipediaImportedAt = this.state.result.fetchedAt;
        this.props.onChange(team.liquipediaUrl);
        updateDraftFields(updates);
        this.setState({ applying: false });
        if (typeof nxWindow.NXAdminToast === "function") {
          nxWindow.NXAdminToast("Datos de Liquipedia aplicados. Revisa y publica los cambios.", "success");
        }
      } catch (error) {
        this.setState({ applying: false, error: error.message || "No se pudo aplicar la importación." });
        if (typeof nxWindow.NXAdminToast === "function") nxWindow.NXAdminToast(error.message, "error");
      }
    },

    renderDiff: function (field, team, current) {
      var imported = getCandidateValue(team, field.name, this.state);
      if (!hasImportValue(field.name, imported) || (field.newOnly && current.id)) return null;
      var currentValue = current[field.name];
      var changed = field.name === "logo"
        ? getLogoChanged(team, current)
        : !valuesEqual(currentValue, imported);
      var selected = Boolean(this.state.selections[field.name]);

      return createElement("label", {
        key: field.name,
        className: "nx-lp-diff" + (selected ? " nx-lp-diff--selected" : ""),
      },
        createElement("input", {
          type: "checkbox",
          checked: selected,
          onChange: this.toggleSelection.bind(this, field.name),
          disabled: !changed && Boolean(currentValue),
        }),
        createElement("span", { className: "nx-lp-diff-copy" },
          createElement("span", { className: "nx-lp-diff-label" }, field.label),
          createElement("span", { className: "nx-lp-diff-values" },
            currentValue
              ? createElement("span", { className: "nx-lp-diff-before" }, summarizeValue(field.name, currentValue))
              : createElement("span", { className: "nx-lp-diff-empty" }, "Sin dato local"),
            createElement("span", { className: "nx-lp-diff-arrow", "aria-hidden": "true" }, "→"),
            createElement("span", { className: "nx-lp-diff-after" }, summarizeValue(field.name, imported))
          )
        ),
        createElement("span", { className: "nx-lp-diff-state" }, changed ? "Importar" : "Sin cambios")
      );
    },

    renderResult: function () {
      if (!this.state.result) return null;
      var team = this.state.result.team;
      var current = getCurrentData(this.props);
      var anySelected = Object.keys(this.state.selections).some(function (key) {
        return Boolean(this.state.selections[key]);
      }, this);

      return createElement("section", { className: "nx-lp-result", "aria-label": "Vista previa de Liquipedia" },
        createElement("div", { className: "nx-lp-team" },
          team.logo
            ? createElement("img", { src: team.logo.dataUrl, alt: "", className: "nx-lp-logo" })
            : createElement("span", { className: "nx-lp-logo nx-lp-logo--empty", "aria-hidden": "true" }, "N"),
          createElement("span", { className: "nx-lp-team-copy" },
            createElement("strong", null, team.name),
            createElement("span", null, [team.location, team.region].filter(Boolean).join(" · ") || "Ubicación no indicada"),
            createElement("a", { href: team.liquipediaUrl, target: "_blank", rel: "noopener noreferrer" }, "Abrir fuente en Liquipedia")
          )
        ),
        createElement("div", { className: "nx-lp-review-fields" },
          createElement("label", null,
            createElement("span", null, "Tag propuesto"),
            createElement("input", {
              type: "text",
              value: this.state.importTag,
              maxLength: 4,
              onChange: this.handleImportedTag,
              disabled: Boolean(current.id && !this.state.selections.tag),
            })
          ),
          !current.id && createElement("label", null,
            createElement("span", null, "ID interno"),
            createElement("input", {
              type: "text",
              value: this.state.importId,
              onChange: this.handleImportedId,
            })
          )
        ),
        createElement("div", { className: "nx-lp-diffs" },
          IMPORT_FIELDS.map(function (field) { return this.renderDiff(field, team, current); }, this)
        ),
        team.players.length === 0 && createElement("p", { className: "nx-lp-note" }, "Liquipedia no devolvió una plantilla activa; no se reemplazarán los jugadores locales."),
        team.logo && createElement("p", { className: "nx-lp-note" },
          "El logo se guardará localmente. Licencia: ",
          team.logo.licenseName || "revisar en la página del archivo",
          "."
        ),
        createElement("div", { className: "nx-lp-result-actions" },
          createElement("span", null, this.state.result.attribution),
          createElement("button", {
            type: "button",
            className: "nx-lp-apply",
            onClick: this.handleApply,
            disabled: this.state.applying || !anySelected,
          }, this.state.applying ? "Aplicando…" : "Aplicar seleccionados")
        )
      );
    },

    render: function () {
      return createElement("div", { className: "nx-lp-importer" },
        createElement("div", { className: "nx-lp-heading" },
          createElement("span", { className: "nx-lp-kicker" }, "Importación asistida"),
          createElement("strong", null, "Traer equipo desde Liquipedia"),
          createElement("p", null, "Pega la página del equipo o escribe su nombre. Nada cambia hasta que revises y apliques los campos.")
        ),
        createElement("div", { className: "nx-lp-search" },
          createElement("input", {
            id: this.props.forID,
            type: "text",
            value: this.state.query,
            onChange: this.handleQuery,
            onKeyDown: this.handleKeyDown,
            placeholder: "https://liquipedia.net/dota2/Amaru_Gaming",
            disabled: this.state.loading,
            "aria-label": "Nombre o URL del equipo en Liquipedia",
          }),
          createElement("button", {
            type: "button",
            onClick: this.handleSearch,
            disabled: this.state.loading || !this.state.query.trim(),
          }, this.state.loading ? "Consultando…" : this.props.value ? "Comprobar cambios" : "Buscar equipo")
        ),
        this.state.loading && createElement("p", { className: "nx-lp-loading", role: "status" }, "Consultando la página, la plantilla activa y el logo…"),
        this.state.error && createElement("p", { className: "nx-lp-error", role: "alert" }, this.state.error),
        this.renderResult()
      );
    },
  });

  var stringWidget = CMS.getWidget("string");
  CMS.registerWidget("liquipedia_team", LiquipediaTeamControl, stringWidget.preview, stringWidget.schema);
})();

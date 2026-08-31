(function () {
  "use strict";

  var nxWindow = /** @type {any} */ (window);
  var dialog = document.getElementById("nx-confirm-dialog");
  var title = document.getElementById("nx-confirm-title");
  var message = document.getElementById("nx-confirm-message");
  var cancelButton = dialog && dialog.querySelector('[value="cancel"]');
  var confirmButton = dialog && dialog.querySelector('[value="confirm"]');
  var queue = [];
  var currentRequest = null;
  var recentAction = null;
  var recentActionAt = 0;
  var activeSession = null;
  var pendingPopTarget = "";
  var pendingPopAt = 0;

  function getPresentation(copy) {
    var normalized = copy.toLocaleLowerCase("es");

    if (/dejar esta p[aá]gina|leave this page/.test(normalized)) {
      return {
        title: "Cambios sin guardar",
        message: "Si sales ahora, perderás los cambios realizados en esta entrada.",
        cancel: "Seguir editando",
        confirm: "Salir sin guardar",
        tone: "warning",
      };
    }

    if (/eliminar|borrar|delete|remove/.test(normalized)) {
      return {
        title: "Confirmar eliminación",
        message: copy,
        cancel: "Cancelar",
        confirm: "Eliminar",
        tone: "danger",
      };
    }

    return {
      title: "Confirmar acción",
      message: copy,
      cancel: "Cancelar",
      confirm: "Confirmar",
      tone: "default",
    };
  }

  function showNextRequest() {
    if (currentRequest || !queue.length || !dialog) return;

    currentRequest = queue.shift();
    var presentation = getPresentation(currentRequest.message);
    title.textContent = presentation.title;
    message.textContent = presentation.message;
    cancelButton.textContent = presentation.cancel;
    confirmButton.textContent = presentation.confirm;
    dialog.dataset.tone = presentation.tone;
    dialog.returnValue = "cancel";
    dialog.showModal();
    window.requestAnimationFrame(function () {
      cancelButton.focus();
    });
  }

  function enqueueConfirmation(copy, resolve) {
    queue.push({ message: String(copy || "¿Quieres continuar?"), resolve: resolve });
    showNextRequest();
  }

  function clearSession(session) {
    if (activeSession !== session) return;
    activeSession = null;
    recentAction = null;
    pendingPopTarget = "";
  }

  function retrySession(session) {
    window.queueMicrotask(function () {
      if (activeSession !== session) return;

      session.replaying = true;
      if (session.source && session.source.isConnected) {
        session.source.click();
      } else if (session.popTarget) {
        window.location.hash = new URL(session.popTarget).hash;
      }
      session.replaying = false;

      window.queueMicrotask(function () {
        if (!session.pending) clearSession(session);
      });
    });
  }

  function requestDecapConfirmation(copy) {
    var prompt = String(copy || "¿Quieres continuar?");

    if (activeSession && activeSession.approved[prompt]) {
      return true;
    }

    var now = performance.now();
    var action = now - recentActionAt < 1500 && recentAction && recentAction.isConnected
      ? recentAction
      : null;
    var popTarget = now - pendingPopAt < 1500 ? pendingPopTarget : "";
    var session = activeSession || {
      approved: Object.create(null),
      source: action,
      popTarget: popTarget,
      pending: false,
      replaying: false,
    };

    if (!session.source && action) session.source = action;
    if (!session.popTarget && popTarget) session.popTarget = popTarget;
    session.pending = true;
    activeSession = session;

    enqueueConfirmation(prompt, function (confirmed) {
      session.pending = false;
      if (!confirmed) {
        clearSession(session);
        return;
      }

      session.approved[prompt] = true;
      retrySession(session);
    });

    return false;
  }

  document.addEventListener("click", function (event) {
    if (!event.target || (dialog && dialog.contains(event.target))) return;
    var action = event.target.closest('a, button, [role="button"], input[type="submit"]');
    if (!action) return;
    recentAction = action;
    recentActionAt = performance.now();
    if (activeSession && activeSession.replaying) activeSession.source = action;
  }, true);

  window.addEventListener("popstate", function () {
    if (currentRequest || (activeSession && activeSession.pending)) return;
    pendingPopTarget = window.location.href;
    pendingPopAt = performance.now();
  }, true);

  window.addEventListener("beforeunload", function (event) {
    event.stopImmediatePropagation();
  }, true);

  if (dialog) {
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      dialog.close("cancel");
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close("cancel");
    });

    dialog.addEventListener("close", function () {
      if (!currentRequest) return;
      var request = currentRequest;
      currentRequest = null;
      var confirmed = dialog.returnValue === "confirm";
      window.queueMicrotask(function () {
        request.resolve(confirmed);
        showNextRequest();
      });
    });
  }

  nxWindow.NXConfirm = function (copy) {
    return new Promise(function (resolve) {
      enqueueConfirmation(copy, resolve);
    });
  };

  nxWindow.confirm = requestDecapConfirmation;
  nxWindow.NXPendingAlerts = nxWindow.NXPendingAlerts || [];
  nxWindow.alert = function (copy) {
    var notification = String(copy || "Ocurrió un error inesperado.");
    if (typeof nxWindow.NXAdminToast === "function") {
      nxWindow.NXAdminToast(notification, "error");
      return;
    }
    nxWindow.NXPendingAlerts.push(notification);
  };
})();

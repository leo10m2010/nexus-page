(function () {
  var TILES = [
    { id: "nx-partidos-map-tile", testid: "partidos-map", label: "Ver partidos", href: "/admin/partidos-viewer.html" },
    { id: "nx-bracket-map-tile", testid: "bracket-map", label: "Ver bracket", href: "/admin/bracket-editor.html" },
  ];

  function ensureTiles() {
    var list = document.querySelector('[class*="SidebarNavList"]');
    if (!list) return;
    var sampleLink = list.querySelector('[data-testid="equipos"]') || list.querySelector('[class*="SidebarNavLink"]');
    var sampleItem = sampleLink && sampleLink.closest("li");
    if (!sampleLink || !sampleItem) return;

    TILES.forEach(function (spec) {
      if (document.getElementById(spec.id)) return;
      var item = sampleItem.cloneNode(true);
      var tile = item.querySelector('[class*="SidebarNavLink"]') || item;

      tile.id = spec.id;
      tile.setAttribute("data-testid", spec.testid);
      tile.removeAttribute("aria-current");
      tile.classList.remove("sidebar-active");
      tile.setAttribute("href", spec.href);
      tile.childNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.textContent = spec.label;
        }
      });
      tile.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = spec.href;
      });
      list.appendChild(item);
    });
  }

  var observer = new MutationObserver(ensureTiles);
  observer.observe(document.body, { childList: true, subtree: true });
  ensureTiles();
})();

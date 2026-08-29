(function () {
  var TILE_ID = "nx-bracket-map-tile";

  function ensureTile() {
    var list = document.querySelector('[class*="SidebarNavList"]');
    if (!list) return;
    if (document.getElementById(TILE_ID)) return;

    var sample = list.querySelector('[class*="SidebarNavLink"]');
    var tile = sample ? sample.cloneNode(true) : document.createElement("a");

    tile.id = TILE_ID;
    tile.setAttribute("data-testid", "bracket-map");
    tile.removeAttribute("aria-current");
    tile.classList.remove("sidebar-active");
    tile.setAttribute("href", "/admin/bracket-editor.html");

    var textNode = null;
    tile.querySelectorAll("*").forEach(function (el) {
      if (el.children.length === 0 && el.textContent.trim()) textNode = el;
    });
    if (textNode) textNode.textContent = "Ver bracket";

    tile.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "/admin/bracket-editor.html";
    });

    list.appendChild(tile);
  }

  var observer = new MutationObserver(ensureTile);
  observer.observe(document.body, { childList: true, subtree: true });
  ensureTile();
})();

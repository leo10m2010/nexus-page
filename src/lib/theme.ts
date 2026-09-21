export const themeBootScript = `(() => {
  const root = document.documentElement;
  root.dataset.theme = "dark";
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("js-reveal");
  }
})();`;

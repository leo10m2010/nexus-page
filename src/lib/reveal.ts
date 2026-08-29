const root = document.documentElement;
const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));

const revealAll = () => {
  for (const el of items) el.classList.add("is-in");
};

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduced || !("IntersectionObserver" in window)) {
  revealAll();
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
  );

  for (const el of items) io.observe(el);

  window.setTimeout(() => {
    if (!root.querySelector(".reveal.is-in")) {
      io.disconnect();
      revealAll();
    }
  }, 2000);
}

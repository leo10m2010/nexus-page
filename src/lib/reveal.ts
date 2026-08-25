/* Scroll reveal via IntersectionObserver. No scroll listeners, no library.
   Elements reveal once and are then unobserved.

   The `.reveal` hidden state is armed by an inline head script that adds
   `.js-reveal` to <html>, so the page is readable when JS is off. The
   watchdog below covers the other failure mode: JS ran, armed the hidden
   state, but the observer never reports (offscreen or non-composited
   documents do this). Either way the content cannot get stuck invisible. */
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

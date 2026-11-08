// Loaded by the lesson page. A locked lesson: say why, and link to the lesson to do first.
(() => {
  const study = window.__study;
  if (!study || document.documentElement.dataset.locked !== "term") return;
  const m = location.pathname.match(/\/study\/([^/]+)\/(\d+)\/$/);
  const text = document.querySelector("[data-lock-text]");
  const go = document.querySelector("[data-lock-go]");
  const tr = study.tracks[m[1]];
  if (!tr || !text || !go) return;
  const step = tr.lessons.find((p) => p.s === tr.next);
  text.textContent = text.dataset.lockText.replace("{name}", window.__q(step?.n || ""));
  go.href = go.getAttribute("href").replace(/\/\d+\/$/, `/${tr.next.split("-").pop()}/`);
  go.textContent = go.dataset.label.replace("{name}", tr.next.split("-").pop());
})();

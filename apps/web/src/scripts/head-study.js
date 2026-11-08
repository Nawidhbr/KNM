// Loaded by BaseLayout.astro, in <head>, right after /<locale>/study-data.js (lib/study-data.ts).
// The study path: a lesson opens when the one before it in its theme has at least two stars (7/10 on its test).
// Scores live in this browser only. Sets data-locked / data-passed on <html> before paint, so a locked lesson never
// flashes its content.
(() => {
  const { path, gates, tracks } = window.__studyVars || { path: [], gates: {}, tracks: [] };
  try {
    const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "") ?? d; } catch { return d; } };
    const scores = read("scores", {});
    const visited = new Set(read("visited", []));
    const { stars } = window.__progress;
    const pr = window.__progress.progress({ path, tracks }, scores, visited);
    const root = document.documentElement;
    window.__study = { path, gates, scores, stars, tracks: pr.tracks, info: pr.info, blocker: pr.blocker, bookDone: pr.bookDone };
    window.__q = (x) => (["ar", "fa-af"].includes(root.lang) ? `«${x}»` : `“${x}”`);
    const lesson = location.pathname.match(/\/study\/([a-z-]+)\/(\d+)\/$/);
    if (lesson) {
      const x = pr.info(`${lesson[1]}-${lesson[2]}`);
      if (!x.open) root.dataset.locked = "term";
      if (x.done) root.dataset.passed = "";
    }
  } catch (e) { window.__report?.(e, "head-study"); }
})();

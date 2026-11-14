// Loaded by BaseLayout.astro, in <head>, right after /<locale>/study-data.js (lib/study-data.ts).
// The study path: a lesson opens when the one before it in its theme has at least two stars (7/10 on its test).
// Scores live in this browser only, and so does bought access (`access`). Sets data-locked / data-passed on <html> before paint, so a locked lesson never
// flashes its content.
(() => {
  const { path, gates, tracks, paid = [] } = window.__studyVars || { path: [], gates: {}, tracks: [] };
  try {
    const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "") ?? d; } catch { return d; } };
    const scores = read("scores", {});
    const visited = new Set(read("visited", []));
    const { stars } = window.__progress;
    const pr = window.__progress.progress({ path, tracks }, scores, visited);
    const root = document.documentElement;
    window.__study = { path, gates, scores, stars, tracks: pr.tracks, info: pr.info, blocker: pr.blocker, bookDone: pr.bookDone };
    window.__q = (x) => (["ar", "fa-af"].includes(root.lang) ? `«${x}»` : `“${x}”`);
    // Paid access: data-access on every page once bought (hides the offers); data-paywall on the pages of a theme that
    // needs access while there is none (shows the offer instead of the lesson).
    const access = window.__progress.hasAccess(read("access", null), Date.now());
    if (access) root.dataset.access = "";
    const theme = location.pathname.match(/\/study\/([a-z-]+)\/(?:\d+\/)?$/);
    if (theme && paid.includes(theme[1]) && !access) root.dataset.paywall = "";
    // The practice exam draws on every theme, so it needs access too while selling is on.
    if (/\/exam\/$/.test(location.pathname) && paid.length && !access) root.dataset.paywall = "";
    // Smart review: every answer to a question (lesson test, review, exam) is passed here; wrong ones come back later.
    window.__review = (id, ok) => {
      try {
        const all = read("review", {});
        const next = window.__progress.reviewAfter(all[id], ok, Date.now());
        if (next) all[id] = next; else delete all[id];
        localStorage.setItem("review", JSON.stringify(all));
      } catch {}
    };
    const lesson = location.pathname.match(/\/study\/([a-z-]+)\/(\d+)\/$/);
    if (lesson) {
      const x = pr.info(`${lesson[1]}-${lesson[2]}`);
      if (!x.open) root.dataset.locked = "term";
      if (x.done) root.dataset.passed = "";
    }
  } catch (e) { window.__report?.(e, "head-study"); }
})();

// Loaded by BaseLayout.astro. The settings menu (theme) and the progress marks on lesson lists.
const themeButton = document.getElementById("theme-toggle");
const currentTheme = () => document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const syncTheme = () => themeButton.setAttribute("aria-checked", String(currentTheme() === "dark"));
syncTheme();
themeButton.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch {}
  syncTheme();
});

// Progress, kept only in this browser: lessons passed (with their stars), the current one, locked ones.
(() => {
  const study = window.__study;
  if (!study) return;
  const starText = (n) => "★".repeat(n) + "☆".repeat(3 - n);
  // Every link to a lesson that has not opened yet gets a lock.
  for (const l of document.querySelectorAll('main a[href*="/study/"]')) {
    if (l.closest(".path")) continue;
    const m = new URL(l.href, location.href).pathname.match(/\/study\/([^/]+)\/(\d+)\/$/);
    if (m && !study.info(`${m[1]}-${m[2]}`).open) l.dataset.lock = "";
  }
  // The lesson lists of a theme page.
  for (const a of document.querySelectorAll(".path a[data-slug]")) {
    const slug = a.dataset.slug;
    const x = study.info(slug);
    if (x.done) a.dataset.state = "done";
    else if (x.next && x.open) a.dataset.state = "current";
    else if (!x.open) a.dataset.state = "locked";
    const s = a.querySelector(".stars");
    const score = study.scores[slug];
    if (s && typeof score === "number") {
      const n = study.stars(score);
      s.dataset.n = String(n);
      s.textContent = starText(n);
      s.title = s.dataset.label.replace("{n}", n);
      s.hidden = false;
    }
  }
  // Theme cards and theme pages: "n of m passed" and the button to continue.
  for (const el of document.querySelectorAll("[data-theme-progress]")) {
    const tr = study.tracks[el.dataset.themeProgress];
    if (!tr) continue;
    const done = tr.lessons.filter((p) => tr.done.has(p.s)).length;
    const count = el.querySelector("[data-count]");
    if (count && done) { count.textContent = count.dataset.text.replace("{n}", done).replace("{m}", tr.lessons.length); count.hidden = false; }
    const go = el.querySelector("[data-continue]");
    if (go && done) {
      const all = done === tr.lessons.length;
      go.textContent = all ? go.dataset.done : go.dataset.label.replace("{n}", tr.next.split("-").pop());
      if (!all) go.href = go.href.replace(/\/\d+\/$/, `/${tr.next.split("-").pop()}/`);
    }
  }
  // The home page: continue with the next lesson of the theme last studied.
  const cta = document.querySelector("[data-home-continue]");
  if (cta) {
    const started = Object.values(study.tracks).filter((tr) => tr.lessons.some((p) => study.scores[p.s] != null));
    const tr = started.find((x) => x.lessons.some((p) => !x.done.has(p.s)));
    if (tr) {
      const step = tr.lessons.find((p) => p.s === tr.next);
      const id = Object.keys(study.tracks).find((k) => study.tracks[k] === tr);
      cta.href = cta.href.replace(/study\/.*$/, `study/${id}/${tr.next.split("-").pop()}/`);
      cta.textContent = cta.dataset.label.replace("{name}", step?.n || "");
    }
  }
})();

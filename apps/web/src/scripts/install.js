// Loaded by BaseLayout.astro (moved out of the page so browsers cache it; see CLAUDE.md).
// Install as an app (settings menu): the browser's own prompt where there is one, else a short how-to.
(() => {
  const box = document.querySelector(".install");
  if (!box) return;
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (standalone) return;
  box.hidden = false;
  let deferred = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; });
  addEventListener("appinstalled", () => { box.hidden = true; });
  const help = box.querySelector(".install-help");
  box.querySelector("[data-install]").addEventListener("click", async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      return;
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    help.textContent = ios ? help.dataset.ios : help.dataset.other;
    help.hidden = false;
  });
})();

// Pop-ups: word explanations (buttons .gloss) and the lock on lessons not yet open.
(() => {
  const pop = document.getElementById("gloss-pop");
  if (!pop || !pop.showPopover) return;
  const $ = (sel) => pop.querySelector(sel);
  const rtl = document.documentElement.dir === "rtl";
  let data = null;
  let anchor = null;
  const load = () => (data ??= fetch(pop.dataset.src).then((r) => r.json()).catch(() => ({})));
  const place = () => {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight, m = 16;
    let left = rtl ? r.right - w : r.left;
    left = Math.max(m, Math.min(left, innerWidth - w - m));
    let top = r.bottom + 8;
    if (top + h > innerHeight - m && r.top - h - 8 > m) top = r.top - h - 8;
    pop.style.left = left + "px";
    pop.style.top = Math.max(m, top) + "px";
  };
  const open = (el, { word, plain, note, href, linkText, arabic }) => {
    if (anchor) anchor.removeAttribute("aria-expanded");
    anchor = el;
    el.setAttribute("aria-expanded", "true");
    $(".gloss-word").textContent = word || "";
    $(".gloss-plain").textContent = plain || "";
    $(".gloss-note").textContent = note || "";
    $(".gloss-note").hidden = !note;
    const link = $(".gloss-link");
    link.hidden = !href;
    if (href) {
      link.href = href;
      $(".gloss-link-text").textContent = linkText || "";
    }
    if (!pop.matches(":popover-open")) pop.showPopover();
    place();
    $(".gloss-close").focus({ preventScroll: true });
  };
  pop.addEventListener("toggle", (e) => {
    if (e.newState === "closed" && anchor) { anchor.removeAttribute("aria-expanded"); anchor.focus({ preventScroll: true }); anchor = null; }
  });
  $("[data-close]").addEventListener("click", () => pop.hidePopover());
  addEventListener("scroll", () => { if (anchor) place(); }, { passive: true });
  addEventListener("resize", () => { if (anchor) place(); });

  document.addEventListener("click", async (e) => {
    const g = e.target.closest(".gloss");
    if (g) {
      e.preventDefault();
      const d = (await load())[g.dataset.g];
      if (!d) return;
      const here = location.pathname === d.h;
      open(g, { word: g.textContent, plain: d.p, note: d.n, href: here ? null : d.h, linkText: d.t, arabic: d.a });
      return;
    }
    // A locked lesson: explain instead of opening it.
    const link = e.target.closest("a[href]");
    const study = window.__study;
    if (!link || !study) return;
    const url = new URL(link.href, location.href);
    const lesson = url.pathname.match(/\/study\/([^/]+)\/(\d+)\/$/);
    if (!lesson) return;
    const [, book, n] = lesson;
    const x = study.info(`${book}-${n}`);
    if (x.open) return;
    e.preventDefault();
    const ds = pop.dataset;
    const tr = study.tracks[book];
    const plain = link.querySelector("strong")?.textContent || link.textContent.trim();
    const nextStep = tr.lessons.find((p) => p.s === tr.next);
    open(link, { word: ds.lockTitle, plain, note: ds.lockLesson.replace("{name}", window.__q(nextStep?.n || "")), href: url.pathname.replace(/\/\d+\/$/, `/${tr.next.split("-").pop()}/`), linkText: ds.lockCta.replace("{name}", tr.next.split("-").pop()) });
  });
})();



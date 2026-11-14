// Loaded by pages/[locale]/practice/index.astro (moved out of the page so browsers cache it; see CLAUDE.md).
(() => {
  const form = document.querySelector(".tikrar");
  const ds = form.dataset;
  const study = window.__study;
  const scores = study ? study.scores : {};
  const passed = (slug) => { if (!study) return false; const x = study.info(slug); return x.done && x.step?.q; };
  const lessons = [...form.querySelectorAll("[data-lesson]")];
  let data = null;
  const load = () => (data ??= fetch(ds.src).then((r) => r.json()));

  const fill = (text, v) => text.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

  // Passed lessons can be chosen, with their stars; the others are not listed one by one but counted per chapter.
  let passedAll = 0;
  for (const l of lessons) {
    const slug = l.dataset.lesson;
    const box = l.querySelector("input");
    if (passed(slug)) {
      passedAll++;
      const n = study.stars(scores[slug] ?? 0);
      const s = l.querySelector(".stars");
      s.textContent = "★".repeat(n) + "☆".repeat(3 - n);
      s.title = s.dataset.label.replace("{n}", n);
      s.hidden = false;
    } else {
      box.disabled = true;
      l.dataset.state = "locked";
      l.closest("li").hidden = true;
    }
  }
  for (const f of form.querySelectorAll(".tikrar-chapter")) {
    const boxes = [...f.querySelectorAll('input[name="lesson"]')];
    const open = boxes.filter((b) => !b.disabled).length;
    const rest = boxes.length - open;
    const head = f.querySelector("[data-chapter-all]");
    if (head && !open) { head.disabled = true; head.closest(".check").dataset.state = "locked"; }
    if (rest) {
      const p = f.querySelector(".tikrar-rest");
      p.querySelector("[data-rest-text]").textContent = fill(ds.rest, { n: rest });
      p.hidden = false;
    }
    if (!open) f.querySelector(".tikrar-lessons").hidden = true;
  }
  for (const b of form.querySelectorAll(".tikrar-book")) {
    const boxes = [...b.querySelectorAll('input[name="lesson"]')];
    const open = boxes.filter((x) => !x.disabled).length;
    const c = b.querySelector("[data-book-count]");
    c.textContent = fill(ds.of, { n: open, m: boxes.length });
    b.dataset.open = open ? "1" : "0";
    if (!open) { const all = b.querySelector("[data-book-all]"); all.disabled = true; all.closest(".check").hidden = true; }
  }

  // The reader's own madrasa path first; the other paths after it, under their own heading.
  const mine = study?.madrasa || document.documentElement.dataset.madrasa || "";
  const wrap = form.querySelector(".tikrar-paths");
  const own = mine && wrap.querySelector(`[data-tikrar-path="${CSS.escape(mine)}"]`);
  const others = wrap.querySelector(".tikrar-others-head");
  if (own) {
    wrap.prepend(own);
    own.querySelector(".tikrar-path-mine").hidden = false;
    own.after(others);
    others.hidden = wrap.querySelectorAll("[data-tikrar-path]").length < 2;
  }
  // Open the books with passed lessons; fold the rest.
  for (const b of form.querySelectorAll(".tikrar-book")) b.open = b.dataset.open === "1" && (!own || own.contains(b) || !own.querySelector('.tikrar-book[data-open="1"]'));

  // Nothing passed yet: say so, and show the way to the first lesson instead of an empty form.
  if (!passedAll) {
    document.querySelector("[data-empty]").hidden = false;
    form.hidden = true;
    document.querySelector(".tikrar-steps").hidden = true;
  }

  // Preselect a chapter from ?c=<chapter> (or a book from ?c=<book>).
  const pre = new URLSearchParams(location.search).get("c");
  if (pre) {
    const box = form.querySelector(`[data-chapter="${CSS.escape(pre)}"], [data-book="${CSS.escape(pre)}"]`);
    if (box) {
      box.querySelectorAll('input[name="lesson"]:not(:disabled)').forEach((b) => (b.checked = true));
      const book = box.closest(".tikrar-book");
      if (book) book.open = true;
    }
  }

  const chosen = () => [...form.querySelectorAll('input[name="lesson"]:checked')].map((b) => b.value);
  const pool = async () => {
    const all = await load();
    const set = new Set(chosen());
    return Object.entries(all).filter(([, q]) => q.t.some((t) => set.has(t)) && q.t.every((t) => passed(t)));
  };
  const tick = (head, boxes) => {
    if (!head) return;
    head.checked = boxes.length > 0 && boxes.every((b) => b.checked);
    head.indeterminate = !head.checked && boxes.some((b) => b.checked);
  };
  const sync = async () => {
    const sel = chosen();
    for (const f of form.querySelectorAll(".tikrar-chapter")) tick(f.querySelector("[data-chapter-all]"), [...f.querySelectorAll('input[name="lesson"]:not(:disabled)')]);
    for (const b of form.querySelectorAll(".tikrar-book")) tick(b.querySelector("[data-book-all]"), [...b.querySelectorAll('input[name="lesson"]:not(:disabled)')]);
    const open = [...form.querySelectorAll('input[name="lesson"]:not(:disabled)')];
    const all = form.querySelector("[data-all]");
    all.disabled = open.length === 0;
    tick(all, open);
    const n = sel.length ? (await pool()).length : 0;
    form.querySelector(".tikrar-count").textContent = n ? `${fill(ds.chosenText, { n: sel.length })} · ${ds.count.replace("{n}", n)}` : ds.none;
    form.querySelector("[data-start]").disabled = n === 0;
  };
  form.addEventListener("change", (e) => {
    const el = e.target;
    const set = (root) => root.querySelectorAll('input[name="lesson"]:not(:disabled)').forEach((b) => (b.checked = el.checked));
    if (el.matches("[data-all]")) set(form);
    if (el.matches("[data-book-all]")) set(el.closest(".tikrar-book"));
    if (el.matches("[data-chapter-all]")) set(el.closest(".tikrar-chapter"));
    sync();
  });

  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const test = document.querySelector(".tikrar-test");
  const list = test.querySelector(".quiz");
  const result = test.querySelector(".quiz-result");
  let answered = 0, right = 0, total = 0;

  // The last test asked for (chosen lessons or smart review), so "shuffle again" repeats it.
  let source = async () => { const qs = await pool(); if (form.elements.shuffleQ.checked) shuffle(qs); return qs; };
  const run = async () => {
    const qs = await source();
    const shuffleA = form.elements.shuffleA.checked;
    list.replaceChildren();
    answered = 0; right = 0; total = qs.length;
    result.hidden = true;
    qs.forEach(([id, q], n) => {
      const order = q.o.map((_, i) => i);
      if (shuffleA) shuffle(order);
      const li = document.createElement("li");
      li.className = "card question";
      const head = document.createElement("p"); head.className = "q-number eyebrow"; head.textContent = `${n + 1} / ${qs.length}`;
      const p = document.createElement("p"); p.className = "q-prompt"; p.textContent = q.p;
      li.append(head, p);
      if (q.a) { const ar = document.createElement("p"); ar.className = "ar q-ar"; ar.lang = "ar"; ar.textContent = q.a; li.append(ar); }
      const opts = document.createElement("div"); opts.className = "options";
      const fb = document.createElement("div"); fb.className = "feedback"; fb.hidden = true;
      const verdict = document.createElement("p"); verdict.className = "verdict";
      const expl = document.createElement("p"); expl.textContent = q.e;
      fb.append(verdict, expl);
      order.forEach((orig, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "option";
        const key = document.createElement("span"); key.className = "option-key"; key.setAttribute("aria-hidden", "true");
        const ks = document.createElement("span"); ks.textContent = ds.letters[i]; key.append(ks);
        const txt = document.createElement("span"); txt.textContent = q.o[orig];
        b.append(key, txt);
        b.addEventListener("click", () => {
          const ok = orig === q.k;
          opts.querySelectorAll(".option").forEach((o, j) => {
            o.disabled = true;
            if (order[j] === q.k) o.dataset.state = "right";
            else if (o === b) o.dataset.state = "wrong";
          });
          li.dataset.state = ok ? "right" : "wrong";
          verdict.textContent = ok ? ds.rightText : ds.wrongText;
          fb.hidden = false;
          answered++; if (ok) right++;
          window.__review?.(id, ok);
          if (answered === total) finish();
        });
        opts.append(b);
      });
      li.append(opts, fb);
      list.append(li);
    });
    form.hidden = true;
    test.hidden = false;
    scrollTo({ top: 0 });
  };
  const finish = () => {
    const score = Math.round((right / total) * 100) / 10;
    const n = study ? study.stars(score) : 0;
    result.querySelector(".quiz-stars").textContent = "★".repeat(n) + "☆".repeat(3 - n);
    result.querySelector(".quiz-score").textContent = ds.scoreText.replace("{score}", score.toLocaleString(document.documentElement.lang));
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    source = async () => { const qs = await pool(); if (form.elements.shuffleQ.checked) shuffle(qs); return qs; };
    run();
  });
  test.querySelector("[data-reshuffle]").addEventListener("click", run);
  test.querySelector("[data-choose]").addEventListener("click", () => {
    test.hidden = true;
    if (passedAll) form.hidden = false; else document.querySelector("[data-empty]").hidden = false;
    smartShow();
    scrollTo({ top: 0 });
  });

  // Smart review (lib/progress.js reviewAfter/reviewDue): questions answered wrongly before, when they are due again.
  const smart = document.querySelector("[data-smart]");
  const readReview = () => { try { return JSON.parse(localStorage.getItem("review") || "{}") || {}; } catch { return {}; } };
  const dueIds = () => {
    const r = readReview(), now = Date.now();
    return Object.keys(r).filter((id) => window.__progress?.reviewDue(r[id], now));
  };
  const smartShow = () => {
    const r = readReview();
    const ids = Object.keys(r);
    smart.hidden = ids.length === 0;
    // With questions to review, "nothing to review yet" (no lesson passed) would contradict the card above it.
    if (!passedAll) document.querySelector("[data-empty]").hidden = ids.length > 0;
    if (!ids.length) return;
    const due = dueIds();
    const text = smart.querySelector("[data-smart-text]");
    const btn = smart.querySelector("[data-smart-start]");
    if (due.length) {
      text.textContent = due.length === 1 ? smart.dataset.one : fill(smart.dataset.due, { n: due.length });
      btn.hidden = false;
    } else {
      const next = Math.min(...ids.map((id) => r[id].d).filter(Number.isFinite));
      text.textContent = fill(smart.dataset.later, { date: new Date(next).toLocaleDateString(document.documentElement.lang, { weekday: "long", day: "numeric", month: "long" }) });
      btn.hidden = true;
    }
  };
  smart.querySelector("[data-smart-start]").addEventListener("click", () => {
    source = async () => { const all = await load(); return shuffle(dueIds().filter((id) => all[id]).map((id) => [id, all[id]])); };
    smart.hidden = true;
    document.querySelector("[data-empty]").hidden = true;
    run();
  });
  smartShow();
  sync();
})();


// Loaded by pages/[locale]/exam.astro (the practice exam). Questions come from /<locale>/practice/questions.json;
// about the same number from each theme, shuffled, one at a time, with a clock. Answers are shown only at the end.
(() => {
  const root = document.querySelector("[data-exam]");
  if (!root) return;
  const v = JSON.parse(root.dataset.vars);
  const T = v.texts;
  const $ = (s) => root.querySelector(s);
  const fill = (text, x) => text.replace(/\{(\w+)\}/g, (_, k) => x[k] ?? "");
  const lang = document.documentElement.lang;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let data = null;
  const load = () => (data ??= fetch(root.dataset.src).then((r) => r.json()));

  let qs = [], answers = [], at = 0, end = 0, timer = 0, sure = false;
  const unanswered = () => qs.reduce((n, _, i) => n + (answers[i] === undefined ? 1 : 0), 0);

  /** About the same number from each theme; what is missing (a theme with few questions) comes from the rest. */
  const draw = (all) => {
    const byTheme = new Map(v.themes.map((t) => [t.id, []]));
    for (const [id, q] of Object.entries(all)) byTheme.get(q.h)?.push({ id, ...q });
    const per = Math.floor(v.count / byTheme.size);
    const picked = [], rest = [];
    for (const list of byTheme.values()) {
      shuffle(list);
      picked.push(...list.slice(0, per));
      rest.push(...list.slice(per));
    }
    shuffle(rest);
    picked.push(...rest.slice(0, Math.max(0, v.count - picked.length)));
    return shuffle(picked).map((q) => ({ ...q, order: shuffle(q.o.map((_, i) => i)) }));
  };

  const clock = () => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    $("[data-clock]").textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    $(".exam-clock").dataset.low = left <= 300 ? "1" : "0";
    if (left === 0) finish(true);
  };

  const show = (n) => {
    at = n;
    const q = qs[n];
    $("[data-pos]").textContent = fill(T.position, { n: n + 1, m: qs.length });
    $("[data-prompt]").textContent = q.p;
    const opts = $("[data-options]");
    opts.replaceChildren();
    q.order.forEach((orig, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "option";
      b.setAttribute("aria-pressed", String(answers[n] === orig));
      const key = document.createElement("span"); key.className = "option-key"; key.setAttribute("aria-hidden", "true");
      const ks = document.createElement("span"); ks.textContent = v.letters[i]; key.append(ks);
      const txt = document.createElement("span"); txt.textContent = q.o[orig];
      b.append(key, txt);
      b.addEventListener("click", () => {
        answers[n] = orig;
        opts.querySelectorAll(".option").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
        grid();
      });
      opts.append(b);
    });
    $("[data-prev]").disabled = n === 0;
    $("[data-next]").hidden = n === qs.length - 1;
    grid();
  };

  const grid = () => {
    const g = $("[data-grid]");
    if (g.children.length !== qs.length) {
      g.replaceChildren(...qs.map((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = String(i + 1);
        b.addEventListener("click", () => show(i));
        return b;
      }));
    }
    [...g.children].forEach((b, i) => {
      b.dataset.state = answers[i] === undefined ? "" : "answered";
      if (i === at) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    const open = unanswered();
    const u = $("[data-unanswered]");
    u.textContent = fill(T.unanswered, { n: open });
    u.hidden = !open || !sure;
    $("[data-submit]").textContent = sure && open ? T.submitSure : T.submit;
  };

  const start = async () => {
    $("[data-start]").disabled = true;
    qs = draw(await load());
    answers = new Array(qs.length);
    sure = false;
    end = Date.now() + v.minutes * 60000;
    clearInterval(timer);
    timer = setInterval(clock, 1000);
    clock();
    $("[data-intro]").hidden = true;
    $("[data-result]").hidden = true;
    $("[data-run]").hidden = false;
    $("[data-grid]").replaceChildren();
    show(0);
    scrollTo({ top: 0 });
    $("[data-start]").disabled = false;
  };

  const finish = (timeUp = false) => {
    clearInterval(timer);
    let right = 0;
    const per = new Map(v.themes.map((t) => [t.id, { n: 0, m: 0 }]));
    const wrong = [];
    qs.forEach((q, i) => {
      const ok = answers[i] === q.k;
      if (ok) right++;
      const p = per.get(q.h);
      if (p) { p.m++; if (ok) p.n++; }
      if (!ok) wrong.push([q, answers[i]]);
      if (answers[i] !== undefined) window.__review?.(q.id, ok);
    });
    const pct = Math.round((right / qs.length) * 100);
    $("[data-timeup]").hidden = !timeUp;
    $("[data-score]").textContent = fill(T.score, { n: right, m: qs.length, pct: pct.toLocaleString(lang) });
    const passed = right / qs.length >= v.pass;
    $("[data-verdict]").textContent = passed ? T.pass : T.fail;
    $("[data-result]").dataset.state = passed ? "pass" : "fail";

    const themes = $("[data-themes]");
    themes.replaceChildren(...v.themes.filter((t) => per.get(t.id).m).map((t) => {
      const p = per.get(t.id);
      const li = document.createElement("li");
      const name = document.createElement("span"); name.className = "exam-theme-name"; name.textContent = `${t.n}. ${t.title}`;
      const bar = document.createElement("span"); bar.className = "exam-bar-track"; bar.setAttribute("aria-hidden", "true");
      const fillEl = document.createElement("span"); fillEl.style.width = `${Math.round((p.n / p.m) * 100)}%`; bar.append(fillEl);
      const score = document.createElement("span"); score.className = "exam-theme-score"; score.textContent = fill(T.themeScore, { n: p.n, m: p.m });
      li.append(name, bar, score);
      li.dataset.state = p.n / p.m >= v.pass ? "pass" : "fail";
      if (p.n < p.m) {
        const a = document.createElement("a"); a.href = t.href; a.textContent = T.practiceTheme; a.className = "exam-theme-link";
        li.append(a);
      }
      return li;
    }));

    const list = $("[data-mistakes]");
    if (!wrong.length) {
      const li = document.createElement("li"); li.textContent = T.noMistakes; list.replaceChildren(li);
    } else {
      list.replaceChildren(...wrong.map(([q, a]) => {
        const li = document.createElement("li");
        li.className = "exam-mistake";
        const p = document.createElement("p"); p.className = "q-prompt"; p.textContent = q.p;
        const yours = document.createElement("p"); yours.className = "exam-yours"; yours.textContent = fill(T.yourAnswer, { a: a === undefined ? T.noAnswer : q.o[a] });
        const good = document.createElement("p"); good.className = "exam-right"; good.textContent = fill(T.rightAnswer, { a: q.o[q.k] });
        const e = document.createElement("p"); e.className = "muted"; e.textContent = q.e;
        li.append(p, yours, good, e);
        return li;
      }));
    }
    $("[data-run]").hidden = true;
    $("[data-result]").hidden = false;
    scrollTo({ top: 0 });
  };

  $("[data-start]").addEventListener("click", start);
  $("[data-again]").addEventListener("click", start);
  $("[data-prev]").addEventListener("click", () => at > 0 && show(at - 1));
  $("[data-next]").addEventListener("click", () => at < qs.length - 1 && show(at + 1));
  $("[data-submit]").addEventListener("click", () => {
    if (unanswered() && !sure) { sure = true; grid(); return; }
    finish();
  });
  // Keep the reader from losing a running exam by accident.
  addEventListener("beforeunload", (e) => { if (!$("[data-run]").hidden) e.preventDefault(); });
})();

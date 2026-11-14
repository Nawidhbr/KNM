// Loaded by TermQuiz.astro (moved out of the page so browsers cache it; see CLAUDE.md).
(() => {
  const box = document.querySelector(".term-quiz");
  if (!box) return;
  const ds = box.dataset;
  const slug = ds.slug;
  const read = () => { try { return JSON.parse(localStorage.getItem("scores") || "{}") || {}; } catch { return {}; } };
  // The same thresholds as lib/progress.js.
  const stars = (x) => window.__progress?.stars(x) ?? (x >= 9 ? 3 : x >= 7 ? 2 : x >= 4 ? 1 : 0);
  const starText = (n) => "★".repeat(n) + "☆".repeat(3 - n);
  const qs = [...box.querySelectorAll(".question")];
  const result = box.querySelector(".quiz-result");
  const best = box.querySelector(".quiz-best");
  let answers = {};

  const showBest = () => {
    const b = read()[slug];
    if (typeof b !== "number") return;
    best.textContent = starText(stars(b)) + "  " + ds.bestText.replace("{score}", b.toLocaleString(document.documentElement.lang));
    best.hidden = false;
  };

  const finish = () => {
    const right = Object.values(answers).filter(Boolean).length;
    const score = Math.round((right / qs.length) * 100) / 10;
    const n = stars(score);
    const all = read();
    if (typeof all[slug] !== "number" || score > all[slug]) all[slug] = score;
    try { localStorage.setItem("scores", JSON.stringify(all)); } catch {}
    // A signed-in reader's progress is saved to the account (later, with accounts).
    window.dispatchEvent(new Event("knm:progress"));
    result.querySelector(".quiz-stars").textContent = starText(n);
    result.querySelector(".quiz-score").textContent = ds.scoreText.replace("{score}", score.toLocaleString(document.documentElement.lang));
    const ok = stars(all[slug]) >= 2;
    result.querySelector(".quiz-verdict").textContent = ok ? ds.passedText : ds.failedText;
    result.dataset.state = n >= 2 ? "pass" : "fail";
    result.hidden = false;
    if (ok) {
      document.documentElement.dataset.passed = "";
      if (window.__study) window.__study.done.add(slug);
    }
    showBest();
  };

  qs.forEach((q, k) => {
    q.querySelectorAll(".option").forEach((b) => {
      b.addEventListener("click", () => {
        const chosen = Number(b.dataset.index);
        const answer = Number(q.dataset.answer);
        q.querySelectorAll(".option").forEach((o, i) => {
          o.disabled = true;
          if (i === answer) o.dataset.state = "right";
          else if (i === chosen) o.dataset.state = "wrong";
        });
        q.dataset.state = chosen === answer ? "right" : "wrong";
        q.querySelector(".verdict").textContent = chosen === answer ? ds.rightText : ds.wrongText;
        q.querySelector(".feedback").hidden = false;
        answers[k] = chosen === answer;
        if (q.dataset.q) window.__review?.(q.dataset.q, chosen === answer);
        if (Object.keys(answers).length === qs.length) finish();
      });
    });
  });

  box.querySelector("[data-again]").addEventListener("click", () => {
    answers = {};
    result.hidden = true;
    qs.forEach((q) => {
      delete q.dataset.state;
      q.querySelector(".feedback").hidden = true;
      q.querySelectorAll(".option").forEach((o) => { o.disabled = false; delete o.dataset.state; });
    });
    qs[0].scrollIntoView({ behavior: "smooth", block: "start" });
  });

  showBest();
})();

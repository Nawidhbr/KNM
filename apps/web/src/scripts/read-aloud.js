// Reading aloud with the browser's own speech (Web Speech API): nothing is sent to us or to another service by this
// site. Loaded on lesson, review and exam pages. The buttons appear only when the browser has a voice for the page's
// language, so Dutch is never read with an English voice. A lesson has one button for the whole text ([data-say-part]);
// every question (.question) gets its own small button, also questions built later by a script.
(() => {
  const synth = window.speechSynthesis;
  if (!synth || !window.SpeechSynthesisUtterance) return;
  const vars = JSON.parse(document.currentScript.dataset.vars);
  const lang = document.documentElement.lang || "nl";
  let voice = null, current = null;

  const clean = (s) => s.replace(/\s+/g, " ").trim();
  const stopAll = () => {
    synth.cancel();
    if (current) { current.setAttribute("aria-pressed", "false"); current.querySelector(".say-label").textContent = current.dataset.label; }
    current = null;
  };
  const speak = (btn, text) => {
    const was = current === btn;
    stopAll();
    if (was || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.9;
    u.onend = u.onerror = () => { if (current === btn) stopAll(); };
    current = btn;
    btn.setAttribute("aria-pressed", "true");
    btn.querySelector(".say-label").textContent = vars.stop;
    synth.speak(u);
  };
  const textOf = (btn) => {
    if (btn.dataset.say === "lesson") return [...document.querySelectorAll("[data-say-part]")].map((x) => clean(x.textContent)).join(". ");
    const q = btn.closest(".question");
    if (!q) return "";
    const prompt = clean(q.querySelector(".q-prompt")?.textContent || "");
    const options = [...q.querySelectorAll(".option")].map((o) => clean(o.textContent).replace(/^([A-G])\s*/, "$1: "));
    return [prompt, ...options].join(". ");
  };
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none"/></svg>';
  const make = (label, kind) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "say-btn";
    b.dataset.say = kind;
    b.dataset.label = label;
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = `${icon}<span class="say-label"></span>`;
    b.querySelector(".say-label").textContent = label;
    return b;
  };
  const addToQuestions = (root) => {
    for (const q of root.querySelectorAll ? root.querySelectorAll(".question") : []) {
      if (q.querySelector(":scope > .say-btn")) continue;
      q.prepend(make(vars.question, "q"));
    }
  };

  const start = () => {
    if (voice) return;
    voice = synth.getVoices().find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
    if (!voice) return;
    document.documentElement.dataset.say = "";
    for (const b of document.querySelectorAll('[data-say="lesson"]')) { b.hidden = false; b.dataset.label = b.querySelector(".say-label").textContent; }
    addToQuestions(document);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.matches?.(".question") ? addToQuestions(n.parentNode) : addToQuestions(n))))).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", (e) => {
      const b = e.target.closest?.(".say-btn");
      if (b) speak(b, textOf(b));
    });
    addEventListener("pagehide", stopAll);
  };
  start();
  synth.addEventListener?.("voiceschanged", start);
})();

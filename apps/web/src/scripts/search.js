// Loaded by Search.astro (moved out of the page so browsers cache it; see CLAUDE.md).
(() => {
  const { indexUrl } = JSON.parse(document.currentScript.dataset.vars);
  (() => {
    const dialog = document.getElementById("search");
    const input = document.getElementById("search-input");
    const list = document.getElementById("search-results");
    const hint = document.getElementById("search-hint");
    let index = null;
    let active = -1;

    // Latin: no case, no diacritics, no ʿ ʾ ' or hyphens, no leading "al-".
    // Arabic: no tashkīl or tatwīl, one alif, tāʾ marbūṭa as hāʾ, alif maqṣūra as yāʾ, no leading "ال".
    const norm = (s) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[ʿʾ'’‘`]/g, "")
        .replace(/[ً-ٰٟـ]/g, "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/[-_.,;:()«»"“”،؛]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const strip = (w) => w.replace(/^(al |al|ال)(?=\S)/, "").replace(/^al /, "");
    const words = (s) => norm(s).split(" ").filter(Boolean).map(strip);

    const load = async () => {
      if (index) return index;
      const res = await fetch(indexUrl);
      const items = await res.json();
      index = items.map((it) => ({
        ...it,
        names: it.n.map((n) => words(n).join(" ")),
        body: words(it.d).join(" "),
      }));
      return index;
    };

    const score = (it, q) => {
      const terms = q.split(" ");
      let best = 0;
      for (const name of it.names) {
        if (name === q) best = Math.max(best, 100);
        else if (name.startsWith(q)) best = Math.max(best, 80);
        else if (terms.every((t) => name.split(" ").some((w) => w.startsWith(t)))) best = Math.max(best, 60);
        else if (name.includes(q)) best = Math.max(best, 40);
      }
      if (best === 0 && terms.every((t) => it.body.includes(t))) best = it.k === "term" ? 20 : 10;
      return best;
    };

    const el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    };

    const render = (results, q) => {
      list.replaceChildren();
      active = -1;
      input.setAttribute("aria-expanded", String(results.length > 0));
      if (!q) { hint.hidden = false; hint.textContent = hint.dataset.hint; return; }
      if (results.length === 0) { hint.hidden = false; hint.textContent = hint.dataset.none; return; }
      hint.hidden = true;
      results.forEach((it, i) => {
        const li = el("li");
        li.setAttribute("role", "option");
        li.id = `search-opt-${i}`;
        const a = el("a", `search-hit search-${it.k}`);
        // The page opened shows the searched words in red (SearchHighlight reads `hl`).
        const hl = `hl=${encodeURIComponent(input.value.trim())}`;
        const [path, hash] = it.u.split("#");
        a.href = `${path}${path.includes("?") ? "&" : "?"}${hl}${hash ? `#${hash}` : ""}`;
        const main = el("span", "search-main");
        const H = window.__hl;
        const ts = H ? H.terms(input.value) : [];
        const plain = (x) => (x || "").replace(/<[^>]+>/g, "");
        // A sentence of the matn shows the piece where the words occur; other results show their title,
        // and when the words are not in the title, the piece of the description where they are.
        const inName = it.k !== "text" && H && [it.t, it.tr, it.ar].some((x) => x && ts.some((t) => H.fold(x).includes(t)));
        const snip = H && !inName ? H.snippet(plain(it.k === "text" ? it.t : it.d), ts) || (it.ar && H.snippet(it.ar, ts, 40)) : "";
        const titleText = it.k === "text" ? snip || (it.t.length > 110 ? it.t.slice(0, 110) + "…" : it.t) : it.t;
        const title = el("strong", "", titleText);
        if (it.k === "text" && snip && /[\u0600-\u06ff]/.test(snip) && !/[a-z]/i.test(snip)) title.lang = "ar";
        const line = el("span", "search-line");
        line.append(title);
        if (it.tr) line.append(el("span", "tr muted", ` · ${it.tr}`));
        main.append(line);
        if (it.k !== "text" && snip) {
          const sn = el("span", "search-snip", snip);
          if (/[\u0600-\u06ff]/.test(snip) && !/[a-z]/i.test(snip)) sn.lang = "ar";
          main.append(sn);
        }
        main.append(el("span", "search-where muted", it.w));
        a.append(main);
        if (it.k === "term") {
          const ar = el("span", "ar", it.ar);
          ar.lang = "ar";
          a.append(ar);
        }
        if (H) H.mark(a, ts);
        a.addEventListener("click", () => dialog.close());
        li.append(a);
        list.append(li);
      });
    };

    const run = async () => {
      const q = words(input.value).join(" ");
      if (!q) return render([], "");
      const items = await load();
      const results = items
        .map((it) => ({ it, s: score(it, q) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s || (a.it.k === b.it.k ? 0 : a.it.k === "term" ? -1 : 1))
        .slice(0, 12)
        .map((r) => r.it);
      render(results, q);
    };

    const move = (step) => {
      const opts = [...list.querySelectorAll("li")];
      if (opts.length === 0) return;
      opts[active]?.removeAttribute("aria-selected");
      active = (active + step + opts.length) % opts.length;
      opts[active].setAttribute("aria-selected", "true");
      opts[active].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", opts[active].id);
    };

    const open = () => {
      if (!dialog.open) dialog.showModal();
      input.select();
      load().catch(() => {});
    };

    document.getElementById("search-open").addEventListener("click", open);
    document.addEventListener("keydown", (e) => {
      const typing = e.target.closest?.("input, textarea, [contenteditable]");
      if (e.key === "/" && !typing && !dialog.open) { e.preventDefault(); open(); }
    });
    input.addEventListener("input", run);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); dialog.close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        const target = list.querySelectorAll("li a")[Math.max(active, 0)];
        if (target) { e.preventDefault(); dialog.close(); location.href = target.href; }
      }
    });
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  })();
})();

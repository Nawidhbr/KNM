// Loaded by HighlightLib.astro (moved out of the page so browsers cache it; see CLAUDE.md).
(() => {
  const foldChar = (c) =>
    c
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[ʿʾ'’‘`]/g, "")
      .replace(/[ً-ٰٟـ]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[-_]/g, " ");
  const fold = (s) => [...s].map(foldChar).join("");
  // The folded text and, for each folded character, where it came from in the original.
  const foldMap = (text) => {
    let folded = "";
    const from = [];
    let i = 0;
    for (const ch of text) {
      for (const x of foldChar(ch)) { folded += x; from.push(i); }
      i += ch.length;
    }
    return { folded, from };
  };
  const terms = (raw) =>
    [...new Set(
      fold(raw || "")
        .split(/[\s.,;:()«»"“”،؛]+/)
        .map((w) => w.replace(/^(al|ال)(?=\S{2,})/, ""))
        .filter((w) => w.length >= 2),
    )].sort((a, b) => b.length - a.length);
  const matches = (text, ts) => { const f = fold(text); return ts.every((t) => f.includes(t)); };
  // The pieces of a text that match, without overlaps, in order.
  const hitsIn = (text, ts) => {
    const { folded, from } = foldMap(text);
    const hits = [];
    for (const t of ts) {
      for (let at = folded.indexOf(t); at !== -1; at = folded.indexOf(t, at + t.length)) {
        const start = from[at];
        const end = at + t.length < from.length ? from[at + t.length] : text.length;
        if (!hits.some((h) => start < h.end && end > h.start)) hits.push({ start, end });
      }
    }
    return hits.sort((a, b) => a.start - b.start);
  };
  const SKIP = "script, style, textarea, input, select, option, button.theme-toggle, dialog:not([open]), [aria-hidden='true'], .tabbar, mark.search-hl";
  const mark = (root, ts) => {
    const out = [];
    if (!root || !ts || ts.length === 0) return out;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const text = node.nodeValue;
      const hits = hitsIn(text, ts);
      if (hits.length === 0) continue;
      const frag = document.createDocumentFragment();
      let pos = 0;
      for (const h of hits) {
        if (h.start > pos) frag.append(text.slice(pos, h.start));
        const m = document.createElement("mark");
        m.className = "search-hl";
        m.textContent = text.slice(h.start, h.end);
        frag.append(m);
        out.push(m);
        pos = h.end;
      }
      if (pos < text.length) frag.append(text.slice(pos));
      node.replaceWith(frag);
    }
    return out;
  };
  const clear = (root) => {
    if (!root) return;
    const parents = new Set();
    for (const m of root.querySelectorAll("mark.search-hl")) { parents.add(m.parentNode); m.replaceWith(m.textContent); }
    for (const p of parents) p.normalize();
  };
  const snippet = (text, ts, around = 60) => {
    const hits = hitsIn(text, ts);
    if (hits.length === 0) return "";
    let a = Math.max(0, hits[0].start - around);
    let b = Math.min(text.length, hits[0].end + around * 1.6);
    if (a > 0) { const sp = text.indexOf(" ", a); a = sp !== -1 && sp < hits[0].start ? sp + 1 : a; }
    if (b < text.length) { const sp = text.lastIndexOf(" ", b); b = sp > hits[0].end ? sp : b; }
    return (a > 0 ? "…" : "") + text.slice(a, b).trim() + (b < text.length ? "…" : "");
  };
  window.__hl = { fold, terms, matches, mark, clear, snippet };
})();

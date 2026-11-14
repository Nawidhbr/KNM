// Loaded by pages/[locale]/transfer.astro: progress to and from a link (#p=…), merged by lib/progress.js mergeProgress.
(() => {
  const root = document.querySelector("[data-transfer]");
  if (!root) return;
  const { locale, texts: T } = JSON.parse(root.dataset.vars);
  const $ = (s) => root.querySelector(s);
  const fill = (text, x) => text.replace(/\{(\w+)\}/g, (_, k) => x[k] ?? "");
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "") ?? d; } catch { return d; } };
  const P = window.__progress;
  const mine = () => ({ scores: read("scores", {}), visited: read("visited", []), review: read("review", {}), access: read("access", null) });
  const summary = (p) => fill(T.summary, {
    lessons: Object.values(p.scores || {}).filter((x) => Number.isFinite(x) && P.stars(x) >= 2).length,
    review: Object.keys(p.review || {}).length,
  });

  // UTF-8 JSON in base64url, so the link survives mail and chat apps.
  const encode = (o) => {
    const bytes = new TextEncoder().encode(JSON.stringify(o));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const decode = (s) => {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  };

  $("[data-mine]").textContent = summary(mine());

  $("[data-make-link]").addEventListener("click", () => {
    const m = mine();
    const url = `${location.origin}/${locale}/transfer/#p=${encode({ k: 1, s: m.scores, v: m.visited, r: m.review, a: m.access })}`;
    $("[data-url]").value = url;
    $("[data-link]").hidden = false;
    $("[data-url]").select();
  });
  $("[data-copy]").addEventListener("click", async () => {
    const input = $("[data-url]");
    try { await navigator.clipboard.writeText(input.value); } catch { input.select(); document.execCommand?.("copy"); }
    $("[data-copy]").textContent = T.copied;
    setTimeout(() => ($("[data-copy]").textContent = T.copy), 2000);
  });

  // A link opened here (also when only the #p=… part changed, which does not reload the page).
  let theirs = null;
  const status = $("[data-status]");
  const found = () => {
    const hash = new URLSearchParams(location.hash.slice(1)).get("p");
    if (!hash) return;
    theirs = null;
    try {
      const o = decode(hash);
      if (o && o.k === 1 && typeof o.s === "object") theirs = { scores: o.s || {}, visited: Array.isArray(o.v) ? o.v : [], review: o.r || {}, access: o.a || null };
    } catch {}
    status.hidden = true;
    if (!theirs) { status.textContent = T.broken; status.hidden = false; $("[data-found]").hidden = true; return; }
    $("[data-found-text]").textContent = fill(T.found, { summary: summary(theirs) });
    $("[data-found]").hidden = false;
  };
  $("[data-take]").addEventListener("click", () => {
    if (!theirs) return;
    const m = P.mergeProgress(mine(), theirs);
    try {
      localStorage.setItem("scores", JSON.stringify(m.scores));
      localStorage.setItem("visited", JSON.stringify(m.visited));
      localStorage.setItem("review", JSON.stringify(m.review));
      if (m.access) localStorage.setItem("access", JSON.stringify(m.access));
    } catch (e) { window.__report?.(e, "transfer"); }
    history.replaceState(null, "", location.pathname);
    $("[data-found]").hidden = true;
    status.textContent = T.done;
    status.hidden = false;
    $("[data-done-link]").hidden = false;
    $("[data-mine]").textContent = summary(mine());
    if (m.access) document.documentElement.dataset.access = "";
  });
  addEventListener("hashchange", found);
  found();
})();

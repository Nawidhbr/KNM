// Loaded by SearchHighlight.astro (moved out of the page so browsers cache it; see CLAUDE.md).
(() => {
  const params = new URLSearchParams(location.search);
  const raw = params.get("hl");
  if (!raw || !window.__hl) return;
  params.delete("hl");
  history.replaceState(null, "", location.pathname + (params.toString() ? `?${params}` : "") + location.hash);
  const marks = window.__hl.mark(document.querySelector("main") || document.body, window.__hl.terms(raw));
  if (marks.length === 0) return;
  // Show the first one: open the folded sections around it and scroll to it (unless the link points at a section).
  const first = marks[0];
  for (let d = first.closest("details"); d; d = d.parentElement?.closest("details")) d.open = true;
  if (!location.hash) requestAnimationFrame(() => first.scrollIntoView({ block: "center" }));
})();

// Loaded by FoldAll.astro (moved out of the page so browsers cache it; see CLAUDE.md).
// One button opens or closes every part and chapter at once: <details> in a text, or the parts of level 1.
(() => {
  const b = document.querySelector("[data-fold-all]");
  if (!b) return;
  const label = b.querySelector("span");
  const details = () => [...document.querySelectorAll("details.text-part, details.text-chapter")];
  const anyClosed = () => {
    const d = details();
    if (d.length) return d.some((x) => !x.open);
    return [...document.querySelectorAll("[data-part], [data-chapter]")].some((x) => x.dataset.open === "false");
  };
  const sync = () => {
    const closed = anyClosed();
    label.textContent = closed ? b.dataset.open : b.dataset.close;
    b.dataset.state = closed ? "closed" : "open";
  };
  b.addEventListener("click", () => {
    const open = anyClosed();
    const d = details();
    if (d.length) d.forEach((x) => { x.open = open; });
    else document.dispatchEvent(new CustomEvent("fold-all", { detail: { open } }));
    sync();
  });
  document.addEventListener("toggle", sync, true);
  document.addEventListener("fold-changed", sync);
  addEventListener("DOMContentLoaded", sync);
  sync();
})();

// Loaded by BaseLayout.astro (moved out of the page so browsers cache it; see CLAUDE.md).
if ("serviceWorker" in navigator && location.hostname !== "localhost") {
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js?lang=" + document.documentElement.lang).catch(() => {}));
}


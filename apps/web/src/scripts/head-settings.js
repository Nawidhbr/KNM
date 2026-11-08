// Loaded by BaseLayout.astro, in <head>. Apply a saved theme before first paint, so there is no flash.
try {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
} catch {}

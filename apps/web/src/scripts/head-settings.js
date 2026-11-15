// Loaded by BaseLayout.astro, in <head>. Apply a saved theme before first paint, so there is no flash.
try {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
  // The help translation the reader turned on (config/help.ts), shown under the Dutch on the Dutch pages.
  const help = localStorage.getItem("help");
  if (help && /^[a-z -]+$/.test(help)) document.documentElement.dataset.help = help;
} catch {}

// Loaded first in BaseLayout's <head>. Script errors in the reader's browser are sent to /api/error/ (a Vercel
// function that writes them to the function log; nothing is stored with them), so that a broken page shows up before
// a reader writes about it. Only on the live site, at most five reports per page, and nothing about the reader:
// the page, the message, where in which script, and the browser's name.
(() => {
  const { origin, version } = JSON.parse(document.currentScript.dataset.vars);
  let left = 5;
  const seen = new Set();
  const send = (kind, message, where) => {
    if (location.origin !== origin || left <= 0) return;
    const key = kind + message + where;
    if (seen.has(key)) return;
    seen.add(key);
    left--;
    const body = JSON.stringify({ kind, message: String(message).slice(0, 500), where: String(where || "").slice(0, 300), page: location.pathname, version, ua: navigator.userAgent.slice(0, 200) });
    try {
      if (!navigator.sendBeacon?.("/api/error/", new Blob([body], { type: "application/json" }))) fetch("/api/error/", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    } catch {}
  };
  // For errors a script catches itself (so the page keeps working) but that should still be known.
  window.__report = (e, where) => send("caught", e?.message || e, where || (e?.stack || "").split("\n")[1]?.trim());
  addEventListener("error", (e) => { if (e.message) send("error", e.message, `${(e.filename || "").replace(location.origin, "")}:${e.lineno}:${e.colno}`); });
  addEventListener("unhandledrejection", (e) => send("rejection", e.reason?.message || e.reason, (e.reason?.stack || "").split("\n")[1]?.trim()));
})();

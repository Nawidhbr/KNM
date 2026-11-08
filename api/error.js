/**
 * Script errors from readers' browsers (apps/web/src/scripts/error-report.js): written to the Vercel function log
 * (Vercel → the project → Logs, filter "client-error"), nothing stored besides. No IP address or other detail of the
 * reader is logged: the page, the message, where it happened, the site version and the browser's name.
 */
const LIMITS = { kind: 20, message: 500, where: 300, page: 300, version: 40, ua: 200 };

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  let b = req.body;
  if (typeof b === "string") {
    try {
      b = JSON.parse(b);
    } catch {
      b = {};
    }
  }
  if (!b || typeof b !== "object" || !b.message) return res.status(204).end();
  const r = Object.fromEntries(Object.entries(LIMITS).map(([k, n]) => [k, String(b[k] ?? "").slice(0, n)]));
  console.error("client-error", JSON.stringify(r));
  return res.status(204).end();
}

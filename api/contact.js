/**
 * The contact form (/<locale>/contact/): sends the message to SITE.email through Resend (https://resend.com),
 * with the writer's address as Reply-To, so an answer goes straight back to them. Nothing is stored here.
 *
 * Vercel environment variables:
 *   RESEND_API_KEY  the API key (without it the form answers 503 and the page offers the writer's own mail program)
 *   CONTACT_FROM    the sender, on a domain verified in Resend (default: KNM Leren <contact@awqatu.nl>)
 *   CONTACT_TO      where messages go (default: info@awqatu.nl)
 *
 * Spam: a hidden field that people leave empty, a minimum time on the page, and limits on every field.
 */
const LIMITS = { name: 120, email: 200, topic: 40, page: 300, message: 5000 };
const TOPICS = ["question", "correction", "school", "other"];
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method" });
  }
  let b = req.body;
  if (typeof b === "string") {
    try {
      b = JSON.parse(b);
    } catch {
      b = {};
    }
  }
  b = b && typeof b === "object" ? b : {};
  const f = Object.fromEntries(Object.keys(LIMITS).map((k) => [k, String(b[k] ?? "").trim()]));

  // A filled-in hidden field, or a form sent within three seconds of opening it, is a robot: say "sent" and drop it.
  const elapsed = Date.now() - Number(b.t || 0);
  if (b.website || !(elapsed > 3000)) return res.status(200).json({ ok: true });

  if (!f.name || !EMAIL.test(f.email) || f.message.length < 5 || !TOPICS.includes(f.topic)) return res.status(400).json({ ok: false, error: "invalid" });
  if (Object.entries(LIMITS).some(([k, n]) => f[k].length > n)) return res.status(400).json({ ok: false, error: "long" });

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: "unconfigured" });

  const subject = `[KNM Leren · ${f.topic}] ${f.name}`.replace(/[\r\n]+/g, " ");
  const lang = String(b.locale || "").slice(0, 5);
  const text = [`Name: ${f.name}`, `Email: ${f.email}`, `Topic: ${f.topic}`, f.page ? `Page: ${f.page}` : null, lang ? `Language: ${lang}` : null, "", f.message].filter((x) => typeof x === "string").join("\n");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || "KNM Leren <contact@awqatu.nl>",
        to: [process.env.CONTACT_TO || "info@awqatu.nl"],
        reply_to: f.email,
        subject,
        text,
      }),
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: "send" });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: "send" });
  }
}

/**
 * Start a payment (the buy page, /<locale>/unlock/): POST { email, locale, consent } → { ok, url }, where url is
 * Mollie's checkout. After paying, Mollie sends the buyer back to /<locale>/unlock/?code=<code>, which unlocks this
 * browser; api/mollie-webhook.js mails the same link. Nothing is stored here: the payment lives at Mollie.
 *
 * Vercel environment variables: PAYMENTS=on, MOLLIE_API_KEY (test_… to try, live_… to sell), ACCESS_SECRET (a long
 * random string; changing it makes every code invalid). Without them: 503, and the page says buying is not possible yet.
 */
import { OFFER } from "../apps/web/src/config/offer.js";
import { configured, makeCode, mollie, origin } from "./_access.js";

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const LOCALES = { nl: "nl_NL", en: "en_US" };
const TEXT = {
  nl: `KNM oefenen: alle thema's, ${OFFER.days} dagen toegang`,
  en: `KNM practice: every theme, ${OFFER.days} days of access`,
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
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
  const email = String(b.email || "").trim();
  const locale = LOCALES[b.locale] ? b.locale : "nl";
  if (!EMAIL.test(email) || email.length > 200 || b.consent !== true) return res.status(400).json({ ok: false, error: "invalid" });
  if (!configured()) return res.status(503).json({ ok: false, error: "unconfigured" });

  const site = origin(req);
  try {
    const p = await mollie("/payments", {
      method: "POST",
      body: JSON.stringify({
        amount: { currency: OFFER.currency, value: OFFER.price },
        description: TEXT[locale],
        redirectUrl: `${site}/${locale}/unlock/`,
        webhookUrl: `${site}/api/mollie-webhook`,
        locale: LOCALES[locale],
        metadata: { email, locale },
      }),
    });
    // Now that the payment has an id, send the buyer back with their code.
    const code = makeCode(p.id, process.env.ACCESS_SECRET);
    await mollie(`/payments/${p.id}`, { method: "PATCH", body: JSON.stringify({ redirectUrl: `${site}/${locale}/unlock/?code=${encodeURIComponent(code)}` }) });
    const url = p._links?.checkout?.href;
    if (!url) throw new Error("no checkout url");
    return res.status(200).json({ ok: true, url });
  } catch (e) {
    console.error("checkout", e?.message);
    return res.status(502).json({ ok: false, error: "mollie" });
  }
}

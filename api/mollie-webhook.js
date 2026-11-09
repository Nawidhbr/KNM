/**
 * Mollie calls this whenever a payment changes (POST, form field `id`). When a payment is paid, the buyer gets a mail
 * with their access link and the details of the purchase (a confirmation on a durable medium, as the law asks),
 * once: afterwards `mailed` is set in the payment's metadata. Always answers 200, so Mollie does not keep retrying;
 * the payment itself is fetched from Mollie, so a forged call can do nothing.
 *
 * Vercel environment variables: MOLLIE_API_KEY, ACCESS_SECRET, RESEND_API_KEY (without it no mail is sent; the buyer
 * still has access through the page they return to), MAIL_FROM (default: CONTACT_FROM or KNM <contact@nederlands.app>),
 * CONTACT_TO (Reply-To, default info@nederlands.app).
 */
import { OFFER } from "../apps/web/src/config/offer.js";
import { COMPANY } from "../apps/web/src/config/company.js";
import { accessFromPayment, makeCode, mollie, origin } from "./_access.js";

const money = (v, locale) => new Intl.NumberFormat(locale === "en" ? "en-GB" : "nl-NL", { style: "currency", currency: OFFER.currency }).format(v);
const day = (ms, locale) => new Date(ms).toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });

function mail(locale, { link, until, paymentId, paidAt, site }) {
  const price = Number(OFFER.price);
  const vat = price - price / (1 + OFFER.vatRate / 100);
  const company = [COMPANY.name, COMPANY.address, COMPANY.kvk && `KvK ${COMPANY.kvk}`, COMPANY.vat && `btw-id ${COMPANY.vat}`].filter(Boolean).join(" · ");
  if (locale === "en") {
    return {
      subject: "Your access to KNM practice",
      text: [
        "Thank you for your purchase.",
        "",
        "Open this link on every device where you want to practise:",
        link,
        "",
        `Your access lasts until ${day(until, locale)}.`,
        "",
        "Your purchase",
        `Every theme of KNM practice, ${OFFER.days} days of access: ${money(price, locale)} (incl. ${money(vat, locale)} VAT at ${OFFER.vatRate}%)`,
        `Paid on ${day(paidAt, locale)} · payment ${paymentId}`,
        "You asked for access straight away; with that, the 14-day right of withdrawal has lapsed. Not happy? Mail us within 14 days of buying and you get your money back.",
        `Terms: ${site}/en/terms/`,
        "",
        company,
        "This site is not affiliated with DUO or the government.",
      ].join("\n"),
    };
  }
  return {
    subject: "Je toegang tot KNM oefenen",
    text: [
      "Bedankt voor je aankoop.",
      "",
      "Open deze link op elk apparaat waarop je wilt oefenen:",
      link,
      "",
      `Je toegang loopt tot ${day(until, locale)}.`,
      "",
      "Je aankoop",
      `Alle thema's van KNM oefenen, ${OFFER.days} dagen toegang: ${money(price, locale)} (waarvan ${money(vat, locale)} btw, ${OFFER.vatRate}%)`,
      `Betaald op ${day(paidAt, locale)} · betaling ${paymentId}`,
      "Je hebt gevraagd om directe toegang; daarmee is je bedenktijd van 14 dagen vervallen. Niet tevreden? Mail ons binnen 14 dagen na je aankoop en je krijgt je geld terug.",
      `Voorwaarden: ${site}/nl/terms/`,
      "",
      company,
      "Deze site is niet verbonden aan DUO of de overheid.",
    ].join("\n"),
  };
}

export default async function handler(req, res) {
  let b = req.body;
  if (typeof b === "string") b = Object.fromEntries(new URLSearchParams(b));
  const id = String(b?.id || "");
  if (!/^tr_[A-Za-z0-9]+$/.test(id) || !process.env.MOLLIE_API_KEY || !process.env.ACCESS_SECRET) return res.status(200).end();
  try {
    const p = await mollie(`/payments/${id}`);
    const a = accessFromPayment(p, OFFER.days);
    const meta = p.metadata || {};
    if (!a.ok || meta.mailed || !meta.email || !process.env.RESEND_API_KEY) return res.status(200).end();
    const locale = meta.locale === "en" ? "en" : "nl";
    const site = origin(req);
    const link = `${site}/${locale}/unlock/?code=${encodeURIComponent(makeCode(id, process.env.ACCESS_SECRET))}`;
    const m = mail(locale, { link, until: a.until, paymentId: id, paidAt: Date.parse(p.paidAt), site });
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || process.env.CONTACT_FROM || "KNM <contact@nederlands.app>",
        to: [meta.email],
        reply_to: process.env.CONTACT_TO || "info@nederlands.app",
        subject: m.subject,
        text: m.text,
      }),
    });
    if (r.ok) await mollie(`/payments/${id}`, { method: "PATCH", body: JSON.stringify({ metadata: { ...meta, mailed: true } }) });
    else console.error("webhook mail", r.status);
  } catch (e) {
    console.error("webhook", e?.message);
  }
  return res.status(200).end();
}

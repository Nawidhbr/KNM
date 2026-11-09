/**
 * Check a code (the buy page): GET /api/redeem?code=<code> → { ok: true, until } or { ok: false, status }.
 * The code's signature proves it was made here; Mollie says whether its payment is paid (and not refunded).
 */
import { OFFER } from "../apps/web/src/config/offer.js";
import { accessFromPayment, mollie, readCode } from "./_access.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method" });
  }
  if (!process.env.MOLLIE_API_KEY || !process.env.ACCESS_SECRET) return res.status(503).json({ ok: false, status: "unconfigured" });
  const id = readCode(req.query?.code, process.env.ACCESS_SECRET);
  if (!id) return res.status(400).json({ ok: false, status: "invalid" });
  try {
    const p = await mollie(`/payments/${id}`);
    return res.status(200).json(accessFromPayment(p, OFFER.days));
  } catch (e) {
    console.error("redeem", e?.message);
    return res.status(502).json({ ok: false, status: "error" });
  }
}

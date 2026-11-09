/**
 * Access codes without a database. A code is the Mollie payment id with a signature: `tr_xxxxxxxxxx.<sig>`, where
 * sig = HMAC-SHA256(ACCESS_SECRET, payment id), base64url, 22 characters. Only this server can make one, so a code
 * cannot be guessed; whether it gives access is decided by asking Mollie about the payment (accessFromPayment).
 * Files in /api whose name starts with "_" are not functions on Vercel.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const ID = /^tr_[A-Za-z0-9]{6,32}$/;

export const sign = (paymentId, secret) => createHmac("sha256", secret).update(paymentId).digest("base64url").slice(0, 22);

export const makeCode = (paymentId, secret) => `${paymentId}.${sign(paymentId, secret)}`;

/** The payment id of a valid code, or null. */
export function readCode(code, secret) {
  const m = String(code || "").trim().match(/^(tr_[A-Za-z0-9]+)\.([A-Za-z0-9_-]{22})$/);
  if (!m || !ID.test(m[1]) || !secret) return null;
  const a = Buffer.from(m[2]);
  const b = Buffer.from(sign(m[1], secret));
  return a.length === b.length && timingSafeEqual(a, b) ? m[1] : null;
}

/**
 * What a Mollie payment gives: { ok: true, until } (ms) when it is paid and not refunded or charged back,
 * otherwise { ok: false, status: "pending" | "failed" | "refunded" }.
 */
export function accessFromPayment(p, days) {
  if (!p || typeof p !== "object") return { ok: false, status: "failed" };
  if (p.status === "paid") {
    const paid = Number(p.amount?.value || 0);
    const back = Number(p.amountRefunded?.value || 0) + Number(p.amountChargedBack?.value || 0);
    if (paid > 0 && back >= paid) return { ok: false, status: "refunded" };
    const at = Date.parse(p.paidAt || "");
    if (!Number.isFinite(at)) return { ok: false, status: "failed" };
    return { ok: true, until: at + days * 86400000 };
  }
  if (["open", "pending", "authorized"].includes(p.status)) return { ok: false, status: "pending" };
  return { ok: false, status: "failed" };
}

/** The address of the site: SITE_URL, a Vercel preview's own host (to test with a Mollie test key), or production. */
export function origin(req) {
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "");
  if (/^[a-z0-9-]+\.vercel\.app$/.test(host)) return `https://${host}`;
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return `https://${host}`;
}

/** A call to the Mollie API (v2) with the key in MOLLIE_API_KEY. */
export async function mollie(path, init = {}) {
  const r = await fetch(`https://api.mollie.com/v2${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`mollie ${path}: ${r.status} ${body?.detail || ""}`);
  return body;
}

export const configured = () => process.env.PAYMENTS === "on" && Boolean(process.env.MOLLIE_API_KEY && process.env.ACCESS_SECRET);

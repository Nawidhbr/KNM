import { describe, expect, it } from "vitest";
import { hasAccess } from "../src/lib/progress.js";
import { accessFromPayment, makeCode, readCode } from "../../../api/_access.js";

const DAY = 86400000;

describe("hasAccess", () => {
  const now = Date.UTC(2026, 10, 9);
  it("counts until the end date", () => {
    expect(hasAccess({ code: "x", until: now + DAY }, now)).toBe(true);
    expect(hasAccess({ code: "x", until: now - 1 }, now)).toBe(false);
  });
  it("needs a code and a number", () => {
    expect(hasAccess(null, now)).toBe(false);
    expect(hasAccess({ until: now + DAY }, now)).toBe(false);
    expect(hasAccess({ code: "x", until: "later" }, now)).toBe(false);
  });
});

describe("access codes", () => {
  const secret = "test-secret";
  it("reads back what it makes", () => {
    const code = makeCode("tr_WDqYK6vllg", secret);
    expect(readCode(code, secret)).toBe("tr_WDqYK6vllg");
    expect(readCode(`  ${code} `, secret)).toBe("tr_WDqYK6vllg");
  });
  it("refuses a changed id, a changed signature, another secret or no secret", () => {
    const code = makeCode("tr_WDqYK6vllg", secret);
    expect(readCode(code.replace("tr_WDqYK6vllg", "tr_WDqYK6vllh"), secret)).toBe(null);
    expect(readCode(code.slice(0, -1) + (code.endsWith("A") ? "B" : "A"), secret)).toBe(null);
    expect(readCode(code, "other")).toBe(null);
    expect(readCode(code, "")).toBe(null);
    expect(readCode("nonsense", secret)).toBe(null);
  });
});

describe("accessFromPayment", () => {
  const paid = { status: "paid", amount: { value: "4.99" }, paidAt: "2026-11-09T10:00:00+00:00" };
  it("gives the days from the moment of payment", () => {
    expect(accessFromPayment(paid, 365)).toEqual({ ok: true, until: Date.parse(paid.paidAt) + 365 * DAY });
  });
  it("gives nothing once refunded or charged back in full", () => {
    expect(accessFromPayment({ ...paid, amountRefunded: { value: "4.99" } }, 365)).toEqual({ ok: false, status: "refunded" });
    expect(accessFromPayment({ ...paid, amountChargedBack: { value: "4.99" } }, 365)).toEqual({ ok: false, status: "refunded" });
    expect(accessFromPayment({ ...paid, amountRefunded: { value: "1.00" } }, 365).ok).toBe(true);
  });
  it("waits for an open payment and refuses a failed one", () => {
    for (const status of ["open", "pending", "authorized"]) expect(accessFromPayment({ status }, 365)).toEqual({ ok: false, status: "pending" });
    for (const status of ["canceled", "expired", "failed"]) expect(accessFromPayment({ status }, 365)).toEqual({ ok: false, status: "failed" });
    expect(accessFromPayment(null, 365)).toEqual({ ok: false, status: "failed" });
  });
});

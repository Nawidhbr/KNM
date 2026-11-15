// Right-to-left help translations (Dari) quote Dutch words, abbreviations and numbers ("(gemeente)", "UWV",
// "0800-2000"). Inside right-to-left text the browser reorders such runs: a phone number after Arabic script comes out
// as "2000-0800". Each Latin or digit run is therefore isolated (<bdi>), so it keeps its own left-to-right order.
// scripts/practice.js has the same pattern; keep the two in step.
export const LATIN_RUN = /[A-Za-z0-9À-ɏ](?:[A-Za-z0-9À-ɏ .,:'’\/&+\-]*[A-Za-z0-9À-ɏ!?])?/g;

/** The text split into plain parts and Latin runs: [{ t, latin }]. */
export function bidiRuns(text) {
  const out = [];
  let at = 0;
  for (const m of text.matchAll(LATIN_RUN)) {
    if (m.index > at) out.push({ t: text.slice(at, m.index), latin: false });
    out.push({ t: m[0], latin: true });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ t: text.slice(at), latin: false });
  return out;
}

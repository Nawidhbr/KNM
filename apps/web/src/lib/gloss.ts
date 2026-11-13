import { getGlossary, type GlossaryEntry } from "@knm/content";

/**
 * Word explanations. Technical words in a text become small buttons; tapping
 * one opens a pop-up with a plain word or synonym (see BaseLayout). The data
 * for the pop-ups is served per language at /<locale>/glossary.json.
 */

const ARABIC_SCRIPT = new Set(["ar", "ur", "fa", "fa-af"]);
const MARKS = "[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]";
const MARK_RE = new RegExp(MARKS, "g");

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface Matcher {
  re: RegExp;
  lookup: Map<string, GlossaryEntry>;
  fold: (s: string) => string;
  arabicScript: boolean;
}

const cache = new Map<string, Matcher | null>();

function matcher(locale: string): Matcher | null {
  if (cache.has(locale)) return cache.get(locale)!;
  const { entries } = getGlossary(locale);
  if (entries.length === 0) {
    cache.set(locale, null);
    return null;
  }
  const arabicScript = ARABIC_SCRIPT.has(locale);
  const fold = (s: string) => s.normalize("NFC").replace(MARK_RE, "").toLocaleLowerCase(locale);
  const lookup = new Map<string, GlossaryEntry>();
  const forms: string[] = [];
  for (const e of entries) {
    for (const f of e.forms) {
      const k = fold(f);
      if (!lookup.has(k)) {
        lookup.set(k, e);
        forms.push(k);
      }
    }
  }
  forms.sort((a, b) => b.length - a.length);
  // In Arabic script, vowel marks may sit between any two letters, and one particle (و ف ب ل ك) may be attached in front.
  const pattern = forms.map((f) => (arabicScript ? [...f].map((ch) => escapeRe(ch) + MARKS + "*").join("") : escapeRe(f))).join("|");
  const prefix = arabicScript ? `(?:[وفبلك]${MARKS}*)?` : "";
  const re = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${prefix}(?:${pattern})(?![\\p{L}\\p{M}\\p{N}])`, "giu");
  const m = { re, lookup, fold, arabicScript };
  cache.set(locale, m);
  return m;
}

/**
 * Text → HTML with the technical words wrapped. Each concept is marked once
 * per text block (its first occurrence), so a paragraph is not a sea of
 * underlines. Pass `skip` to leave a concept unmarked (e.g. the term of the
 * page in its own definition).
 */
export function gloss(text: string, locale: string, skip?: string): string {
  const m = matcher(locale);
  if (!m || !text) return escapeHtml(text ?? "");
  const seen = new Set<string>(skip ? [skip] : []);
  let out = "";
  let last = 0;
  m.re.lastIndex = 0;
  for (let hit = m.re.exec(text); hit; hit = m.re.exec(text)) {
    const word = hit[0];
    let key = m.fold(word);
    let entry = m.lookup.get(key);
    if (!entry && m.arabicScript) entry = m.lookup.get((key = key.slice(1)));
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    out += escapeHtml(text.slice(last, hit.index));
    const button = `<button type="button" class="gloss" data-g="${entry.id}" aria-haspopup="dialog">${escapeHtml(word)}</button>`;
    last = hit.index + word.length;
    // A button is an atomic inline box, so a comma or full stop right after it
    // could wrap onto the next line on its own. Keep them together.
    const punct = /^[.,;:!?)\]»”’،؛؟]+/.exec(text.slice(last))?.[0];
    if (punct) {
      out += `<span class="gloss-nb">${button}${escapeHtml(punct)}</span>`;
      last += punct.length;
      m.re.lastIndex = last;
    } else out += button;
  }
  return out + escapeHtml(text.slice(last));
}

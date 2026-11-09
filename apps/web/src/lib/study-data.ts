import { createHash } from "node:crypto";
import { themes, trackSteps } from "./course";
import { needsAccess } from "./offer";
import progressSource from "./progress.js?raw";

/**
 * The data the head script (scripts/head-study.js) needs to set locks and progress before paint: every theme's
 * lessons in the language of the page. It is the same on every page of a language, so it is a file of its own,
 * /<locale>/study-data.js, cached for a year and versioned by a hash of its content (?v=…). It also carries the rules
 * of the path (lib/progress.js), so the head script and the tests run the same code.
 */
const memo = new Map<string, { body: string; v: string }>();
export function studyData(locale: string): { body: string; v: string } {
  const hit = memo.get(locale);
  if (hit) return hit;
  // The themes that need access, only while selling is on (otherwise every theme is free).
  const paid = themes().filter((x) => needsAccess(x.n)).map((x) => x.id);
  const data = { path: [], gates: {}, tracks: trackSteps(locale), previews: [], paid };
  const rules = progressSource.replace(/^export /gm, "");
  const body = `window.__studyVars=${JSON.stringify(data)};\nwindow.__progress=(()=>{${rules}\nreturn { progress, stars, hasAccess };})();\n`;
  const out = { body, v: createHash("sha256").update(body).digest("hex").slice(0, 10) };
  memo.set(locale, out);
  return out;
}

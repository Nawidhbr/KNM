/**
 * Prints how far the course covers the eindtermen, from generated/coverage.json (written by validate):
 * per theme the items tested, and per item its questions (checked against a source / all), lessons and topics.
 *
 *   npm run coverage            (all themes)
 *   npm run coverage -- 3       (theme 3 only)
 */
import { readFileSync } from "node:fs";

type Row = { theme: number; action: string; code: string; text: string; lessons: string[]; questions: number; checked: number; topics: string[] };
const rows: Row[] = JSON.parse(readFileSync(new URL("../generated/coverage.json", import.meta.url), "utf8"));
const only = Number(process.argv[2]) || 0;

let total = 0;
let done = 0;
for (let th = 1; th <= 8; th++) {
  if (only && th !== only) continue;
  const items = rows.filter((r) => r.theme === th);
  const tested = items.filter((r) => r.questions > 0).length;
  total += items.length;
  done += tested;
  console.log(`\nThema ${th}: ${tested} van ${items.length} eindtermen getoetst`);
  for (const r of items) {
    const mark = r.questions === 0 ? "  ·" : r.checked === r.questions ? "  ✓" : r.checked === 0 ? "  ?" : "  ~";
    const q = r.questions ? `${r.questions} vragen (${r.checked} met bron)` : "geen vragen";
    const t = r.topics.length ? `, kennisbank: ${r.topics.join(", ")}` : "";
    console.log(`${mark} ${r.code.padEnd(6)} ${q}${t}`);
    console.log(`         ${r.text.slice(0, 100)}`);
  }
}
console.log(`\nTotaal: ${done} van ${total} eindtermen getoetst (${Math.round((done / total) * 100)}%).`);
console.log("✓ elke vraag gecontroleerd tegen een bron · ~ deels · ? nog niet gecontroleerd · · nog geen vragen");

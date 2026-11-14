/**
 * Drawings in the house style ("Stedelijk"): thin black lines, white surfaces and flat blocks of red, blue and orange,
 * on a 160 × 100 grid with a ground line. Each lesson names one in its `picture`; it is shown beside the situation of the
 * lesson and with the lesson's questions in review and the practice exam. The marks carry classes (k: surface with a
 * line, l: line only, n: ink, w: always white, r/b/o: red, blue, orange), styled in styles/knm.css with the colour tokens, so the
 * drawings follow dark mode and need no inline styles (the CSP forbids them). No words in the drawings.
 */

const r = (x: number, y: number, w: number, h: number, c = "k", rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ""} class="${c}"/>`;
const p = (d: string, c = "k") => `<path d="${d}" class="${c}"/>`;
const c = (cx: number, cy: number, rad: number, cl = "k") => `<circle cx="${cx}" cy="${cy}" r="${rad}" class="${cl}"/>`;
const l = (x1: number, y1: number, x2: number, y2: number) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="l"/>`;
const ground = l(12, 88, 148, 88);
/** A five-pointed star around (cx, cy). */
const star = (cx: number, cy: number, ro: number, cl: string) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? ro * 0.42 : ro;
    return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  });
  return `<polygon points="${pts.join(" ")}" class="${cl}"/>`;
};
/** Four sails of a windmill around its hub, turned 45°: a spar with a white sail beside it. */
const blades = (cx: number, cy: number) =>
  [45, 135, 225, 315]
    .map((deg) => {
      const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
      const pt = (along: number, side: number) => `${(cx + ux * along + px * side).toFixed(1)} ${(cy + uy * along + py * side).toFixed(1)}`;
      return p(`M${pt(10, 0)} L${pt(34, 0)} L${pt(34, 9)} L${pt(10, 9)} Z`) + p(`M${pt(4, 0)} L${pt(36, 0)}`, "l");
    })
    .join("");
const house = (x: number, s = 1) => {
  const X = (n: number) => x + n * s;
  const Y = (n: number) => 88 - (88 - n) * s;
  return p(`M${X(0)} ${Y(88)} V${Y(46)} H${X(60)} V${Y(88)} Z`) + p(`M${X(-6)} ${Y(48)} L${X(30)} ${Y(18)} L${X(66)} ${Y(48)} Z`, "r") + r(X(24), Y(62), 14 * s, 26 * s, "o") + r(X(6), Y(54), 12 * s, 12 * s, "b") + r(X(42), Y(54), 12 * s, 12 * s);
};

export const PICTURES: Record<string, string> = {
  home: ground + house(50),
  contract: ground + r(40, 12, 50, 72) + l(48, 26, 82, 26) + l(48, 36, 82, 36) + l(48, 46, 76, 46) + l(48, 56, 82, 56) + p("M50 72 q6 -8 10 0 t10 0 t10 -2", "l") + c(110, 58, 11, "o") + c(110, 58, 4) + p("M121 58 H146 M138 58 V66 M144 58 V64", "l"),
  search: ground + house(22, 0.8) + c(108, 50, 20) + c(108, 50, 13, "b") + p("M122 64 L140 84", "l") + r(126, 70, 8, 18, "o", 2),
  plug: ground + c(110, 52, 22) + c(102, 52, 3, "n") + c(118, 52, 3, "n") + r(48, 42, 30, 20, "o", 3) + l(78, 47, 92, 47) + l(78, 57, 92, 57) + p("M48 52 C30 52 34 80 14 80", "l"),
  meter: ground + r(44, 14, 72, 70) + r(54, 24, 52, 16, "b") + r(60, 28, 6, 8) + r(70, 28, 6, 8) + r(80, 28, 6, 8) + r(90, 28, 6, 8) + p("M86 48 L72 66 H82 L76 80 L96 60 H86 L92 48 Z", "o"),
  bins: ground + r(26, 38, 30, 50, "b") + r(23, 32, 36, 6) + r(65, 38, 30, 50, "o") + r(62, 32, 36, 6) + r(104, 38, 30, 50, "r") + r(101, 32, 36, 6) + l(41, 48, 41, 78) + l(80, 48, 80, 78) + l(119, 48, 119, 78),
  doctor: ground + r(40, 24, 80, 64) + r(74, 32, 12, 26, "r") + r(67, 39, 26, 12, "r") + r(72, 64, 16, 24, "b") + r(48, 64, 14, 12) + r(98, 64, 14, 12),
  pharmacy: ground + r(42, 36, 32, 52, "k", 4) + r(46, 26, 24, 10, "b") + r(46, 52, 24, 20, "o") + p("M103 52 H116 V70 H103 A9 9 0 0 1 103 52 Z", "r") + p("M116 52 H129 A9 9 0 0 1 129 70 H116 Z"),
  pram: ground + p("M42 48 H118 A22 22 0 0 1 96 70 H64 A22 22 0 0 1 42 48 Z") + p("M118 48 A30 30 0 0 0 88 18 V48 Z", "o") + p("M42 48 L32 30 H22", "l") + c(62, 80, 8) + c(98, 80, 8) + c(62, 80, 2, "n") + c(98, 80, 2, "n"),
  ambulance: ground + r(24, 42, 92, 36) + p("M116 52 H134 L144 66 V78 H116 Z") + r(24, 56, 92, 8, "r") + r(122, 56, 12, 10, "b") + r(62, 32, 14, 10, "b") + c(48, 80, 8) + c(124, 80, 8) + r(40, 46, 12, 6, "r"),
  umbrella: ground + p("M30 56 Q80 0 130 56 Q118 48 105 56 Q93 48 80 56 Q67 48 55 56 Q42 48 30 56 Z", "o") + p("M80 56 V80 A6 6 0 0 1 68 80", "l") + l(80, 22, 80, 16) + l(40, 18, 36, 26) + l(122, 14, 118, 22) + l(140, 30, 136, 38),
  laptop: ground + r(46, 18, 68, 48) + r(53, 25, 54, 34, "b") + p("M34 70 H126 L118 80 H42 Z") + r(70, 34, 20, 16, "o", 2) + p("M74 34 V30 A6 6 0 0 1 86 30 V34", "l"),
  ship: p("M14 86 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0", "l") + p("M34 62 H128 L114 80 H48 Z", "r") + l(70, 62, 70, 14) + l(98, 62, 98, 22) + r(56, 18, 28, 18) + r(56, 40, 28, 18) + r(86, 26, 24, 16) + r(86, 44, 24, 14) + r(70, 10, 12, 6, "b"),
  chain: ground + r(26, 40, 40, 22, "k", 11) + r(36, 47, 20, 8, "n", 4) + r(94, 40, 40, 22, "k", 11) + r(104, 47, 20, 8, "n", 4) + p("M70 42 L78 50 L70 58", "o") + p("M90 42 L82 50 L90 58", "o") + l(80, 28, 80, 36) + l(80, 64, 80, 72),
  windmill: r(14, 74, 50, 14, "b") + p("M14 74 q6 -4 12 0 t12 0 t12 0 t12 0", "l") + l(64, 88, 148, 88) + p("M88 88 L94 44 H112 L118 88 Z") + p("M92 46 L103 34 L114 46 Z", "r") + r(98, 70, 10, 18, "o") + blades(103, 40) + c(103, 40, 3, "n"),
  halfmast: ground + l(56, 88, 56, 12) + c(56, 10, 3, "n") + r(58, 40, 52, 8, "r") + r(58, 48, 52, 8, "w") + r(58, 56, 52, 8, "b"),
  flag: ground + l(56, 88, 56, 12) + c(56, 10, 3, "n") + r(58, 16, 56, 10, "r") + r(58, 26, 56, 10, "w") + r(58, 36, 56, 10, "b") + r(52, 80, 8, 8, "o"),
  eu: r(36, 18, 88, 66, "b") + Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return star(80 + 24 * Math.cos(a), 51 + 24 * Math.sin(a), 5, "o");
  }).join(""),
  speech: ground + p("M26 20 H90 A8 8 0 0 1 98 28 V50 A8 8 0 0 1 90 58 H46 L34 70 V58 H26 A8 8 0 0 1 18 50 V28 A8 8 0 0 1 26 20 Z") + l(30, 32, 84, 32) + l(30, 44, 72, 44) + p("M74 46 H134 A8 8 0 0 1 142 54 V72 A8 8 0 0 1 134 80 H128 V88 L118 80 H74 A8 8 0 0 1 66 72 V54 A8 8 0 0 1 74 46 Z", "o") + l(80, 58, 126, 58) + l(80, 68, 112, 68),
  map: p("M28 28 L62 20 L96 28 L130 20 V78 L96 86 L62 78 L28 86 Z") + l(62, 20, 62, 78) + l(96, 28, 96, 86) + p("M34 44 Q50 36 58 50 T88 54", "l") + p("M110 70 C102 58 98 52 98 46 A12 12 0 0 1 122 46 C122 52 118 58 110 70 Z", "r") + c(110, 46, 4),
  train: l(28, 90, 132, 90) + l(48, 86, 48, 92) + l(80, 86, 80, 92) + l(112, 86, 112, 92) + r(50, 14, 60, 70, "k", 12) + r(58, 22, 44, 24, "b", 4) + r(50, 56, 60, 8, "o") + c(62, 72, 4, "o") + c(98, 72, 4, "o") + l(72, 8, 88, 8) + l(80, 8, 80, 14),
  townhall: ground + p("M30 42 L80 16 L130 42 Z", "o") + r(36, 42, 88, 46) + c(80, 31, 6) + r(46, 50, 10, 38) + r(104, 50, 10, 38) + r(70, 60, 20, 28, "b") + r(60, 50, 40, 6, "r"),
  idcard: r(28, 24, 104, 62, "k", 6) + r(38, 34, 28, 34, "b") + c(52, 46, 6) + p("M42 68 Q52 54 62 68", "k") + l(76, 40, 120, 40) + l(76, 52, 112, 52) + l(76, 64, 118, 64) + r(110, 70, 14, 10, "o", 2),
  letter: ground + r(26, 30, 76, 50) + p("M26 30 L64 58 L102 30", "l") + c(116, 64, 20, "o") + `<text x="116" y="72" text-anchor="middle" class="t">€</text>`,
  coins: ground + r(38, 78, 44, 10, "o", 5) + r(38, 68, 44, 10, "o", 5) + r(38, 58, 44, 10, "o", 5) + r(38, 48, 44, 10, "o", 5) + c(112, 56, 22, "o") + `<text x="112" y="65" text-anchor="middle" class="t">€</text>`,
  lifebuoy: ground + c(80, 46, 30) + `<circle cx="80" cy="46" r="22" class="ring"/>` + c(80, 46, 14) + l(80, 16, 80, 8) + p("M80 8 Q100 2 118 14", "l"),
  police: ground + p("M80 14 L112 24 V50 C112 68 98 80 80 86 C62 80 48 68 48 50 V24 Z", "b") + star(80, 50, 16, "k"),
  scales: l(80, 22, 80, 80) + r(60, 80, 40, 8) + l(40, 30, 120, 30) + c(80, 22, 4, "n") + p("M40 30 L28 58 M40 30 L52 58 M120 30 L108 58 M120 30 L132 58", "l") + p("M24 58 H56 A16 10 0 0 1 24 58 Z", "o") + p("M104 58 H136 A16 10 0 0 1 104 58 Z", "b"),
  ballot: ground + r(70, 14, 26, 34) + p("M76 30 L82 36 L92 22", "l") + r(42, 44, 76, 44) + r(58, 42, 44, 4, "n") + r(56, 60, 48, 14, "r"),
  crown: ground + p("M42 70 L36 30 L60 48 L80 20 L100 48 L124 30 L118 70 Z", "o") + r(42, 70, 76, 12, "r") + c(36, 30, 4, "b") + c(80, 20, 4, "b") + c(124, 30, 4, "b") + c(80, 58, 6, "b"),
  lock: ground + p("M62 46 V34 A18 18 0 0 1 98 34 V46", "l") + r(52, 46, 56, 40, "o", 4) + c(80, 62, 5, "n") + r(78, 64, 4, 10, "n"),
  homeheart: ground + p("M40 88 V46 H120 V88 Z") + p("M32 48 L80 14 L128 48 Z", "b") + p("M80 80 C60 66 56 56 62 50 C68 44 76 46 80 52 C84 46 92 44 98 50 C104 56 100 66 80 80 Z", "r"),
  shop: ground + r(36, 40, 88, 48) + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => r(32 + i * 12, 28, 12, 14, i % 2 ? "k" : "r")).join("") + r(46, 54, 36, 22, "b") + r(92, 54, 22, 34, "o") + c(108, 72, 2, "n"),
  briefcase: ground + p("M64 38 V30 H96 V38", "l") + r(36, 38, 88, 48, "o", 4) + l(36, 58, 124, 58) + r(74, 52, 12, 12),
  calendar: r(36, 20, 88, 66) + r(36, 20, 88, 16, "r") + l(56, 14, 56, 26) + l(104, 14, 104, 26) + [0, 1, 2, 3].map((i) => [0, 1, 2].map((j) => r(44 + i * 20, 42 + j * 14, 14, 10, i === 2 && j === 1 ? "o" : "k")).join("")).join(""),
  people: ground + c(58, 30, 11) + r(42, 46, 32, 42, "b", 12) + c(102, 30, 11) + r(86, 46, 32, 42, "o", 12),
  rings: ground + `<circle cx="66" cy="50" r="22" class="band-o"/><circle cx="94" cy="50" r="22" class="band-b"/>` + c(66, 26, 4) + p("M62 24 L66 18 L70 24 Z", "k"),
  cake: ground + r(36, 60, 88, 28, "o") + r(48, 40, 64, 20, "r") + p("M36 66 q11 8 22 0 t22 0 t22 0 t22 0", "l") + l(64, 40, 64, 28) + l(80, 40, 80, 26) + l(96, 40, 96, 28) + p("M64 28 q-3 -5 0 -9 q3 4 0 9 Z", "o") + p("M80 26 q-3 -5 0 -9 q3 4 0 9 Z", "o") + p("M96 28 q-3 -5 0 -9 q3 4 0 9 Z", "o"),
  school: ground + r(36, 40, 88, 48) + p("M32 40 L80 20 L128 40 Z", "r") + r(70, 62, 20, 26, "o") + r(44, 50, 16, 14, "b") + r(100, 50, 16, 14, "b") + l(80, 20, 80, 6) + r(80, 6, 14, 8, "b"),
  book: ground + p("M80 30 Q60 20 34 24 V76 Q60 72 80 82 Z") + p("M80 30 Q100 20 126 24 V76 Q100 72 80 82 Z") + l(42, 36, 70, 38) + l(42, 48, 70, 50) + l(90, 38, 118, 36) + l(90, 50, 118, 48) + p("M104 22 V40 L109 35 L114 40 V22", "r"),
  blocks: ground + r(34, 60, 28, 28, "b") + r(66, 60, 28, 28, "o") + r(50, 32, 28, 28, "r") + r(104, 52, 36, 36) + c(122, 70, 8, "o"),
};

export const pictureIds = Object.keys(PICTURES);

/** The inner markup of a drawing; throws on an unknown id so a typo in the content fails the build. */
export function picture(id: string): string {
  const svg = PICTURES[id];
  if (!svg) throw new Error(`Unknown picture "${id}" (lib/pictures.ts)`);
  return svg;
}

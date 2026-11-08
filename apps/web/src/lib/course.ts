import { getThemes, tx, type Theme } from "@knm/content";

/**
 * The study path of the KNM course, on the engine of The Mantiqi (lib/progress.js). Every theme with lessons is a
 * "track": its lessons open one by one, each when the one before it has at least two stars (7/10). The themes
 * themselves are all open from the start (`a: []`), so a learner can begin with the theme they need most.
 * Addresses: /<locale>/study/<theme>/ and /<locale>/study/<theme>/<n>/; a lesson's score key is "<theme>-<n>".
 */
export interface Step {
  /** Score key, e.g. "werk-en-inkomen-2". */
  s: string;
  /** 1: the lesson has a test. */
  q: 0 | 1;
  /** Name used in lock messages, e.g. "2. Your chances, your diploma and training". */
  n: string;
}

export const themes = (): Theme[] => getThemes();
export const themePath = (locale: string, id: string) => `/${locale}/study/${id}/`;
export const lessonPath = (locale: string, id: string, n: number) => `/${locale}/study/${id}/${n}/`;
export const lessonKey = (id: string, n: number) => `${id}-${n}`;

/** The tracks for the head script: { id, t, v, d, a, nm, l } as lib/progress.js expects them. */
export function trackSteps(locale: string): { id: string; t: string; v: number; d: number; a: string[]; nm: string; l: Step[] }[] {
  return themes().map((th) => ({
    id: th.id,
    t: "1",
    v: 1,
    d: th.n,
    a: [],
    nm: tx(th.title, locale),
    l: th.lessons.map((l) => ({ s: lessonKey(th.id, l.n), q: 1 as const, n: `${l.n}. ${tx(l.title, locale)}` })),
  }));
}

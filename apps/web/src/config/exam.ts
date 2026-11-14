/**
 * The practice exam (pages/[locale]/exam.astro): questions drawn from every theme, with a clock. The real KNM exam takes
 * 45 minutes (DUO, see the knowledge-base page knm-examen); the number of questions and the 70% mark are ours, the same
 * mark that opens a lesson (two stars, lib/progress.js). It is practice, not a prediction of the result at DUO.
 */
export const EXAM = { questions: 40, minutes: 45, pass: 0.7 } as const;

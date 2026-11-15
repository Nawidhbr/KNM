# Writing and checking content

Everything a reader learns from comes from `packages/content`, validated by `npm run validate` and summed up by
`npm run coverage`. This guide is how a lesson gets written, so that every theme has the same quality.

## The eindtermen come first

`packages/content/eindtermen.json` is the official list (Staatscourant 2024, 15802, in force since 1 July 2025):
8 themes, 27 crucial actions, 78 knowledge items, each with its indicators. Every lesson teaches one or more
crucial actions (`handeling`), every question tests one knowledge item (`eindterm`), and the validation refuses a
code that is not in that list. `npm run coverage` shows per item how many questions test it and how many of those
were checked against a source; a theme is done when every item of it is tested and checked.

## A lesson

- `situation`: one or two sentences about a person in a real situation ("Samira wil werken in een supermarkt…").
- `body`: three to five short paragraphs. Language at A2, the level of the exam: sentences under about 15 words,
  common words, one idea per sentence, no passive where an active sentence works. Technical words stay (the exam
  uses them) and get a word pop-up in `glossary/nl.json`.
- `remember`: one rule to keep, with its why.
- `sources`: official pages only (rijksoverheid.nl, government.nl, the bodies themselves: UWV, Belastingdienst, DUO,
  the municipality's own information, wetten.overheid.nl). Never DUO's practice exams or real exam questions.
- `checked`: the day the lesson and its questions were checked against those sources.
- Facts that change (names of the king or prime minister, amounts, dates of elections) are not written into a
  lesson; a knowledge-base page names where to look.

## A question

- Three options, one right (`answer` is its index). The wrong options are plausible mistakes a newcomer could make,
  never jokes or trick wording. Options of similar length, no "all of the above".
- Asks about knowledge in a situation ("Ahmed verliest zijn baan. Waar meldt hij zich?"), as the exam does.
- `eindterm`: the knowledge item it tests. `source`: the index of the lesson source that backs the right answer.
- `explanation`: why the right answer is right, in one or two sentences.
- Five questions per lesson; with four right the next lesson opens.

## Translations

Dutch is the source. English follows in the same file (`en`), complete per lesson (title, situation, body,
remember, every question).

Help translations are a different thing: a translation folded under the Dutch on the Dutch pages, for learners who
read Dutch with difficulty (the exam is in Dutch, so the Dutch stays the text). They live apart from the lessons, one
file per theme in `packages/content/i18n/<code>/themes/<theme>.json` (schema `HelpTheme`): per lesson (by `n`) the
title, situation, body (as many paragraphs as the Dutch), remember and every question (by `id`, as many options as
the Dutch, in the same order). Validation merges them into the text fields under the language code. Keep key Dutch
words in brackets after the translation, the first time in a lesson (`شاروالی (gemeente)`), so the learner meets the
word the exam uses. The terminology is fixed in `i18n/<code>/GLOSSARY.md`. A file gets `checked` (by, date) only when
a speaker has checked it; until then the page says it is a draft. Dari (`fa-af`) is the first help language; to add
another, add it to `HELP_LANGS` (schema) and `HELP` (apps/web/src/config/help.ts) with a CSS rule in knm.css.

## Drafts and review

Everything is a draft until a qualified teacher has reviewed it. A review is entered in `reviews.json` only when it
was actually given (`<theme>-<n>` or `topic:<slug>`, by, date); the badge on the page follows from it.

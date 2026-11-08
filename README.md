# Inburgeren

Oefenen voor het KNM-examen (Kennis van de Nederlandse Maatschappij) van de inburgering: korte lessen per thema met toetsen, een kennisbank over Nederland, herhalen en woorduitleg. Gebouwd op de infrastructuur van The Mantiqi. Live op www.nederlands.app.

```
npm install
npm run dev        # http://localhost:4321/nl/
npm run check      # tests, inhoudsvalidatie, build, site-check en browsertests
```

- Inhoud: `packages/content` (thema's, lessen, toetsen, kennisbank, woorden), gevalideerd tegen `src/schema.ts`.
- Site: `apps/web` (Astro, statisch).
- Werkafspraken: zie `CLAUDE.md`.

Alle lessen zijn concepten tot een bevoegde docent ze heeft nagekeken. De site is niet verbonden aan DUO of de overheid.

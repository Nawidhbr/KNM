# KNM

Oefenen voor het KNM-examen (Kennis van de Nederlandse Maatschappij) van de inburgering: korte lessen per thema met toetsen, een kennisbank over Nederland, herhalen en woorduitleg. Gebouwd op de techniek van The Mantiqi. Live op www.nederlands.app.

```
npm install
npm run dev        # http://localhost:4321/nl/
npm run check      # tests, inhoudscontrole, build, sitecheck, browsertests (ook toegankelijkheid)
npm run coverage   # welke eindtermen getoetst en gecontroleerd zijn
```

- Inhoud: `packages/content` (eindtermen, thema's, lessen, toetsen, kennisbank, woorden), gecontroleerd tegen `src/schema.ts`.
- Site: `apps/web` (Astro, statisch); serverfuncties in `api/` (contact, foutmeldingen, Mollie).
- Uitleg: `docs/ARCHITECTURE.md` (hoe het in elkaar zit), `docs/CONTENT.md` (een les schrijven en controleren), `docs/DEPLOY.md` (Vercel, omgevingsvariabelen, lanceerchecklist), `.env.example`.
- Werkafspraken: `CLAUDE.md`.

Alle lessen zijn concepten tot een bevoegde docent ze heeft nagekeken. De site is niet verbonden aan DUO of de overheid.

Alle rechten voorbehouden (© 2026 AQLI); zie `LICENSE`.

# How KNM fits together

A static site with a few server functions, built from content that is validated before every build.

```
packages/content            JSON content + schema (zod) → validate → generated/*.json
  eindtermen.json           the official eindtermen (codes, texts, indicators)
  themes/                   index.json (8 themes) + one course file per theme
  topics/ glossary/ news.json reviews.json
apps/web (Astro, static)    imports only generated/*.json
  src/pages/[locale]/       every page per language (nl, en)
  src/lib/progress.js       the study rules (locks, stars, access), tested, sent to the browser in study-data.js
  src/scripts/              page scripts (no inline scripts: strict CSP)
  src/config/               site.ts (address, name, languages), offer.js, company.js
api/ (Vercel functions)     contact.js, error.js, checkout.js, redeem.js, mollie-webhook.js
vercel.json                 security headers (CSP), redirects, cache rules
e2e/                        Playwright: learning, unlocking, layout, accessibility
```

## In the reader's browser

There are no accounts and no database. Everything personal stays in `localStorage`: the scores (`scores`), bought
access (`access`), settings. `/<locale>/study-data.js` carries the study path and the rules; `head-study.js` runs
it before the page paints and sets `data-locked`, `data-passed`, `data-access` and `data-paywall` on `<html>`, so CSS
shows the right state without a flash.

## Selling without a database

A purchase is a Mollie payment. Its access code is the payment id with an HMAC signature (`api/_access.js`); the
code proves it was issued here, and Mollie says whether the payment is paid and not refunded. So the site keeps no
customer data; Mollie keeps the payment, which is also the bookkeeping record.

## Checks

`npm run check` = unit tests (`apps/web/test`), content validation, build, `scripts/check-site.mjs` (links, titles,
one h1, canonical, og:image, JSON-LD) and the Playwright tests, on desktop and phone. GitHub Actions runs it on every
push; `uptime.yml` checks the live site every hour.

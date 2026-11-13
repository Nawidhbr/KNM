# Deploying KNM (nederlands.app)

The site runs on Vercel, built from the GitHub repository `Nawidhbr/KNM` on every push to `main`. Previews are built
for every other branch and are never indexed.

## The Vercel project

These settings are required. Without them Vercel builds only `apps/web`, and silently drops `vercel.json` (the
security headers, redirects and cache rules) and the functions in `api/` (contact, error reports, Mollie).

| Setting | Value |
| --- | --- |
| Root Directory | empty (the repository root) |
| Framework Preset | Other |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` (default) |
| Node.js Version | 22.x |
| Domains | `www.nederlands.app` (primary); `nederlands.app` redirects to it |

`.github/workflows/uptime.yml` checks every hour, and after every production deploy, that the security headers are
sent and that the functions answer. If not, it opens an issue labelled `uptime` that names this cause.

## Environment variables

All are optional; `.env.example` lists them. Set them for Production unless noted, then redeploy (a change takes
effect only in a new build).

| Variable | What it does | When |
| --- | --- | --- |
| `INDEXING` | `on` lets search engines index the site. | Decided: on. |
| `SITE_URL` | The canonical address. | Only to move the site. |
| `ANALYTICS` | `off` turns Vercel Web Analytics off. | Normally unset. |
| `RESEND_API_KEY` | Sends mail: the contact form and the access link. Resend must have `nederlands.app` verified. | Before launch. |
| `CONTACT_FROM`, `CONTACT_TO`, `MAIL_FROM` | Sender and receiver of those mails (defaults: contact@ and info@nederlands.app). | Normally unset. |
| `MOLLIE_API_KEY` | `test_…` to try buying, `live_…` to sell. | Phase 3. |
| `ACCESS_SECRET` | Signs the access codes. Never change it after the first sale. | Phase 3. |
| `PAYMENTS` | `on` shows the offer and locks themes 2–8 for readers without access. Needs the business details in `apps/web/src/config/company.js`. | Last, after a test purchase. |

## Launch checklist

1. Vercel settings as above; the `uptime` workflow passes.
2. `INDEXING=on`; the domain verified in Google Search Console (a TXT record at the registrar) and the sitemap
   `https://www.nederlands.app/sitemap-index.xml` submitted; Bing Webmaster Tools imported from Search Console.
   IndexNow (`.github/workflows/indexnow.yml`) then sends the sitemap to Bing after every deploy.
3. The mailbox info@nederlands.app exists; `RESEND_API_KEY` is set; the contact form delivers.
4. Selling (phase 3): the business details in `config/company.js` (name, address, KvK number, VAT number); the
   Mollie website profile for nederlands.app with iDEAL on; `MOLLIE_API_KEY` (test), `ACCESS_SECRET`, `PAYMENTS=on`
   on a preview first; one whole purchase tried (pay, return, mail, the link on a second device, a refund
   revoking access); then the live key in Production.

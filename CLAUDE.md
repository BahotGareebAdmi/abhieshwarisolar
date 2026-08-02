# CLAUDE.md, Abhieshwari Solar

Project guide for Claude. Read this before making changes.

## What this is

Marketing / lead-gen website for **M/s Abhieshwari Enterprises and Developers**
("Abhieshwari Solar"), a rooftop solar installation business in Gorakhpur,
Uttar Pradesh.

**Static HTML/CSS/JS. No framework, no build step, no package.json.** Every
page is a hand-written `.html` file at the repo root. Do not introduce a build
tool, bundler, or framework.

- Live site: <https://abhieshwarisolar.in>
- Contact: +91 90265 73953 · info@abhieshwarisolar.in
- GSTIN `09FBJPR0315E1ZQ` is intentionally hidden site-wide, it is commented
  out in the HTML near each occurrence. Leave it commented unless asked.

## ⚠️ This repo deploys straight to production

Every push to `main` triggers a Cloudflare Workers Build that redeploys the
live site within a couple of minutes. **There is no staging environment.**
A broken commit is a broken business website.

Therefore:

- Make the **smallest change** that satisfies the request.
- Never delete or restructure files you weren't asked to touch.
- Never edit `wrangler.jsonc`, `_headers`, `js/config.js`, `sitemap.xml`,
  `robots.txt`, or `llms.txt` unless explicitly asked.
- If a request is ambiguous or needs a large rewrite, **ask instead of
  guessing**. Making no change is better than making a wrong one.

## Layout

```
index.html              Homepage
services.html           Services
calculator.html         Solar sizing + subsidy calculator
testimonials.html       Testimonials (Supabase-backed)
faq.html                FAQs
contact.html            Contact form (Supabase-backed)
guides.html             Hub page linking all 9 guide articles
guide-*.html            9 long-form guide articles
admin.html              Admin panel (Supabase Auth), noindex
privacy-policy.html     Privacy policy
thanks.html             Post-submit thank-you page
css/                    Stylesheets
js/                     config.js, i18n.js, contact.js, admin.js, etc.
_headers                Security headers (Cloudflare static-assets)
wrangler.jsonc          Cloudflare Worker config (static assets, dir "./")
llms.txt                Plain-markdown site summary for AI crawlers
```

## Conventions

- **Every page must keep**: the shared nav, the EN/हिं language toggle, the
  footer, the floating WhatsApp button, and the 🎁 Offer badge. If you add a
  new page, copy this scaffolding from an existing page.
- **Bilingual**: UI strings are translated via `js/i18n.js` using `data-i18n`
  attributes, persisted to localStorage. If you add user-facing text, add both
  the English and Hindi entries to the dictionary in `js/i18n.js`.
- **Structured data matters**, the site is tuned for SEO and AI answer
  engines. Keep the existing JSON-LD (`LocalBusiness`, `FAQPage`, `Article`,
  `BreadcrumbList`, `HowTo`, `VideoObject`). New guide articles need `Article`
  + `BreadcrumbList` schema.
- **When adding a guide article**, wire it into all four: `guides.html`,
  `sitemap.xml`, `llms.txt`, and cross-links from related guides.
- Currency is ₹ (INR). Subsidy figures: PM Surya Ghar up to ₹78,000 central +
  UPNEDA up to ₹30,000 state = up to ~₹1,08,000 combined.

## Backend

Supabase (browser-side, anon key in `js/config.js`, RLS-protected). Two
features use it:

- **Testimonials**, public submit, approved via `admin.html`
- **Contact form leads**, `contact_submissions` table, shown under "Leads"
  in `admin.html` (`js/admin.js`: `loadLeads`, `handleLeadAction`)

There is no server. Do not add one.

## Hosting

Cloudflare Workers (migrated off Netlify 2026-08-02, Netlify fully
decommissioned).

- Zone `abhieshwarisolar.in` on Cloudflare Free; nameservers at Hostinger
  point to `jaxson`/`paige.ns.cloudflare.com`
- Worker `abhieshwarisolar`, static-assets project, deploys `npx wrangler deploy`
- **Two Workers Routes** serve the site: `abhieshwarisolar.in/*` and
  `www.abhieshwarisolar.in/*`. If the live site ever breaks, check
  **Cloudflare → Workers Routes first**, not DNS records.
- Email DNS (MX/SPF/DMARC/Hostinger mail CNAMEs) and the
  `google-site-verification` TXT record must be preserved, never remove them.

## Mobile workflow (@claude from a phone)

`.github/workflows/claude.yml` lets the owner mention `@claude` in a GitHub
issue or comment from the GitHub mobile app. Claude commits directly to `main`,
which auto-deploys.

Setup, done once:

1. Install the Claude GitHub App: <https://github.com/apps/claude>
2. Run `claude setup-token` locally, then add the result as repo secret
   `CLAUDE_CODE_OAUTH_TOKEN` (Settings → Secrets and variables → Actions)

## Open items

- Confirm the `contact_submissions` table + RLS policies exist in Supabase
  (SQL is in `README.md`, Step 2.3). Until that runs, the contact form fails
  with an error toast, check this first if the form is reported broken.
- AdSense was showing a "Low value content" rejection as of 2026-08-02 despite
  9 substantial guide articles; needs "I confirm I have fixed the issues" +
  "Request review" clicked in the AdSense dashboard.
- Verify `admin.html` login and approve/delete flow end to end.

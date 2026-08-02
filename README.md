# Abhieshwari Solar — Website Setup Guide

Your site is ready in this folder. Two things need to be connected before
everything works: **Supabase** (for testimonials and the contact form) and
**Cloudflare Pages** (for hosting).

---

## Step 1: Deploy to Cloudflare Pages

1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git** → select `abhieshwarisolar`.
2. Framework preset: **None**. Build command: leave empty. Build output
   directory: `/` (this site has no build step — it deploys as-is).
3. Deploy. Cloudflare gives you a temporary URL like
   `abhieshwarisolar.pages.dev` — the site is now live there.
4. In the Pages project, go to **Custom domains → Add** → type
   `abhieshwarisolar.in` (and `www.abhieshwarisolar.in` if you want both).
5. At Hostinger, update the domain's **nameservers** to the two Cloudflare
   gives you (Cloudflare shows these once you add the domain as a zone).
   Every future push to the `main` branch on GitHub auto-deploys.
6. Wait for DNS to propagate (can take up to a few hours). Cloudflare
   auto-issues a free SSL certificate once it detects the domain.

The contact form and testimonials both talk directly to Supabase from the
browser — see Step 2. There's no Netlify Forms equivalent needed.

---

## Step 2: Set up Supabase (for testimonials) — 15 minutes

Testimonials (photo uploads, approval queue, admin login) need a small
free database. Supabase's free tier covers this easily at your scale.

### 2.1 Create the project
1. Go to **supabase.com** → sign up free → **New project**.
2. Name it anything (e.g. `abhieshwari-solar`), set a database password
   (save it somewhere safe), choose the region closest to India
   (Singapore is usually the nearest available).
3. Wait ~2 minutes for the project to provision.

### 2.2 Create the testimonials table
Go to **SQL Editor** in the Supabase dashboard, paste this, and click Run:

```sql
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  email text,
  message text not null,
  photo_url text,
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;

-- Anyone can submit a new testimonial (goes in as "pending")
create policy "public can insert" on testimonials
  for insert to anon
  with check (status = 'pending');

-- Anyone can view only approved testimonials
create policy "public can view approved" on testimonials
  for select to anon
  using (status = 'approved');

-- Only logged-in admin can view everything, update, or delete
create policy "admin full access select" on testimonials
  for select to authenticated
  using (true);

create policy "admin full access update" on testimonials
  for update to authenticated
  using (true);

create policy "admin full access delete" on testimonials
  for delete to authenticated
  using (true);
```

### 2.3 Create the contact_submissions table
Also in **SQL Editor**, paste this and click Run — this is what the
contact page's form submits into:

```sql
create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  city text not null,
  message text,
  status text not null default 'new' check (status in ('new','contacted','done')),
  created_at timestamptz not null default now()
);

alter table contact_submissions enable row level security;

-- Anyone can submit a new lead
create policy "public can insert" on contact_submissions
  for insert to anon
  with check (status = 'new');

-- Only logged-in admin can view, update, or delete leads
create policy "admin full access select" on contact_submissions
  for select to authenticated
  using (true);

create policy "admin full access update" on contact_submissions
  for update to authenticated
  using (true);

create policy "admin full access delete" on contact_submissions
  for delete to authenticated
  using (true);
```

Submitted leads show up under **Leads** on the `/admin.html` page (same
login as testimonials) — mark them contacted/done or delete them there.

### 2.4 Create the photo storage bucket
Go to **Storage** → **New bucket** → name it exactly `testimonial-photos` →
toggle **Public bucket** ON → Create.

Then go to **SQL Editor** again and run:

```sql
create policy "public can upload photos"
  on storage.objects for insert to anon
  with check (bucket_id = 'testimonial-photos');

create policy "public can view photos"
  on storage.objects for select to anon
  using (bucket_id = 'testimonial-photos');
```

### 2.5 Create your admin login
1. Go to **Authentication → Users → Add user**.
2. Enter your email and a strong password. This is what you'll use to
   log into `/admin.html` on your site.
3. Leave "Auto confirm user" checked.

### 2.6 Connect your site to Supabase
1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `js/config.js` in this folder and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi....";
   ```
4. Commit and push — Cloudflare Pages redeploys automatically.

That's it. Testimonials submitted on the public page will now appear in
your `/admin.html` login as "Pending" — approve them there and they go
live on the public Testimonials page. Contact form leads appear under
**Leads** on the same admin page.

**Never put your Supabase "service_role" key anywhere in this folder.**
Only the "anon public" key belongs in `config.js` — it's safe to expose
publicly because the RLS policies above control exactly what it can do.

---

## Step 3: Update contact details later
All contact info (phone, email, address) is written directly into each
HTML file's footer and header. To change it, search for the phone
number or email across the files and update it everywhere it appears.

---

## Google Ads / AdSense setup (header banner)
The site already has a header banner ad slot reserved on every page (right
below the navigation bar) and commented-out AdSense code in each page's
`<head>`. To turn it on:

1. Go to **adsense.google.com** → sign up with the same domain
   (`abhieshwarisolar.in`). You need an approved, live site with real
   content — which you now have.
2. Google will ask you to verify site ownership. It gives you a snippet
   like:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456" crossorigin="anonymous"></script>
   ```
3. In **every** HTML file, find the commented-out line:
   ```html
   <!-- <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script> -->
   ```
   Uncomment it and replace `ca-pub-XXXXXXXXXXXXXXXX` with your real
   publisher ID.
4. Create a file named `ads.txt` in this folder (same level as
   `index.html`) with this line (again, your real publisher ID):
   ```
   google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
   ```
   Google requires this for approval — without it, ads won't serve.
5. In each page, find the placeholder div:
   ```html
   <div class="ad-slot ad-slot-header">
     <div class="ad-slot-inner">Ad space — header banner (728×90 / responsive)</div>
   </div>
   ```
   Replace the inner `<div class="ad-slot-inner">...</div>` with the
   actual AdSense ad unit code Google gives you (an `<ins class="adsbygoogle">`
   tag), then add `<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`
   right after it.
6. Commit and push — Cloudflare Pages redeploys automatically.

**Keeping it minimal for now:** leave only the header banner active to
start. Add more ad slots later (e.g. between sections) by copying the
same `ad-slot` block structure — the CSS classes are already reusable.

**Note:** AdSense approval can take a few days to a few weeks and
requires original content and enough traffic/policy compliance —
Google reviews the actual live site, not a draft.

## Visitor analytics (how many people visit your site)
Two good free options:

**Option A: Google Analytics (GA4)** — most common, free, detailed reports.
1. Go to **analytics.google.com** → create an account and a property
   for `abhieshwarisolar.in`.
2. It gives you a Measurement ID like `G-ABC123XYZ4`.
3. In every HTML file, find the commented GA4 snippet near the top of
   `<head>` and uncomment it, replacing `G-XXXXXXXXXX` with your real ID
   in **both** places it appears.
4. Redeploy. Visits now show up in the Analytics dashboard within a
   few hours (Realtime report shows them within minutes).

**Option B: Cloudflare Web Analytics** — free, privacy-friendly,
server-side (no cookie banner needed), built into your Cloudflare
dashboard under **your Pages project → Analytics**. Good if you'd
rather not touch code at all.

For a small local business site, GA4 (free) is the practical starting
choice.

## Notes on the solar calculator
The estimates use standard planning assumptions (roof area per kW,
average generation per kW, average domestic tariff) — not a formal
survey. Real sizing should always be confirmed on-site.

The subsidy shown now has two parts, both residential-only:
- **Central subsidy (PM Surya Ghar)**: ₹30,000/kW for the first 2kW,
  ₹18,000 for the 3rd kW, capped at ₹78,000 total — set in
  `calcCentralSubsidy()` in `js/calculator.js`.
- **Uttar Pradesh state top-up (UPNEDA)**: ₹15,000/kW, capped at
  ₹30,000 per household — set in `calcUPTopUp()` in the same file.
  This is subject to current UPNEDA budget allocation and can change;
  the page already carries a disclaimer about this next to the result.

Combined, a UP resident installing 3kW+ can see up to ₹1,08,000 in
total subsidy (₹78,000 + ₹30,000), which is what the calculator now
shows. If either scheme's numbers change, update the two functions
above — nothing else needs to change.

## Security measures already built in
- Contact form: Netlify's built-in spam filtering + a honeypot field
- Testimonial form: honeypot field, 60-second client-side rate limit,
  file type/size validation on photo uploads
- Testimonials never go live automatically — always sit in "pending"
  until you approve them in `/admin.html`
- Admin login uses real password authentication (Supabase Auth), not a
  hidden URL
- Security headers set in `netlify.toml` (clickjacking/MIME-sniffing
  protection)
- `/admin.html` is excluded from search engine indexing

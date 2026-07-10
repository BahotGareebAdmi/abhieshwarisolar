# Abhieshwari Solar — Website Setup Guide

Your site is ready in this folder. Two things need to be connected before
everything works: **Supabase** (for testimonials) and **Netlify** (for hosting).
The contact form works immediately with no setup — it uses Netlify Forms.

---

## Step 1: Deploy to Netlify (5 minutes)

1. Go to **netlify.com** → sign up (free, no credit card).
2. On the "Add a project" screen, use **Upload your project files** →
   drag this whole folder in (or zip it first).
3. Netlify gives you a temporary URL like `random-name.netlify.app` —
   the site is now live.
4. Go to **Site settings → Domain management → Add a custom domain** →
   type `abhieshwarisolar.in`.
5. Netlify will show you DNS records to add. Go back to Hostinger's
   **Domains → abhieshwarisolar.in → DNS/Nameservers → Edit**, and add:
   - An **A record** pointing `@` to Netlify's load balancer IP (shown in Netlify)
   - A **CNAME record** pointing `www` to your `xxxx.netlify.app` address
6. Wait 10–60 minutes for DNS to update. Netlify auto-issues a free SSL
   certificate once it detects the domain is pointed correctly.

The contact form will start working the moment the site is live — no
extra setup needed. Submissions appear in **Netlify dashboard → Forms**,
and you can add your email under **Forms → Notifications → Email
notification** so every submission also lands in your inbox.

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

### 2.3 Create the photo storage bucket
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

### 2.4 Create your admin login
1. Go to **Authentication → Users → Add user**.
2. Enter your email and a strong password. This is what you'll use to
   log into `/admin.html` on your site.
3. Leave "Auto confirm user" checked.

### 2.5 Connect your site to Supabase
1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `js/config.js` in this folder and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi....";
   ```
4. Re-upload the site to Netlify (drag the folder in again, or use
   Netlify's "Deploys" tab → drag and drop to redeploy).

That's it. Testimonials submitted on the public page will now appear in
your `/admin.html` login as "Pending" — approve them there and they go
live on the public Testimonials page.

**Never put your Supabase "service_role" key anywhere in this folder.**
Only the "anon public" key belongs in `config.js` — it's safe to expose
publicly because the RLS policies above control exactly what it can do.

---

## Step 3: Update contact details later
All contact info (phone, email, address) is written directly into each
HTML file's footer and header. To change it, search for the phone
number or email across the files and update it everywhere it appears.

---

## Notes on the solar calculator
The estimates use standard planning assumptions (roof area per kW,
average generation per kW, average domestic tariff) — not a formal
survey. Real sizing should always be confirmed on-site. The subsidy
figures match the current PM Surya Ghar Yojana slabs (₹30,000/kW up to
2kW, ₹18,000 for the 3rd kW, capped at ₹78,000), and apply to
residential connections only. If the scheme's slabs ever change,
update the numbers in `js/calculator.js` (`calcSubsidy` function).

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

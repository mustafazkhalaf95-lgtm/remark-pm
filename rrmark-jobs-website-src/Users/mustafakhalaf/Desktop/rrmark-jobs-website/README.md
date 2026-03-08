# Careers App — Glass Morphism

A stunning **Next.js 14 + TypeScript + Tailwind CSS** careers page with full glassmorphism UI, backed by **Supabase** for application storage and CV uploads.

---

## ✨ Features

- 🪟 **Full Glassmorphism UI** — translucent cards, backdrop blur, soft borders, glow blobs
- 💼 **9 Job Roles** — responsive 3-column card grid with badges and Apply buttons
- 📝 **Application Form** — 10 fields + PDF CV upload with Supabase integration
- 🌈 **Animations** — card hover lift, button glow, blob float, fade-in-up on load
- 📱 **Fully Responsive** — mobile-first, collapses to 1 column

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd careers-app
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Get these from your Supabase project → **Settings → API**.

### 3. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🗄️ Supabase Setup

### SQL Schema — `applications` Table

Run this in your Supabase project's **SQL Editor**:

```sql
create table if not exists public.applications (
  id              uuid default gen_random_uuid() primary key,
  created_at      timestamp with time zone default now() not null,
  role            text not null,
  full_name       text not null,
  phone           text not null,
  email           text not null,
  city            text not null,
  years_experience integer not null default 0,
  portfolio_url   text,
  why_join        text not null,
  strongest_skill text not null,
  expected_salary text not null,
  cv_url          text
);

-- Enable Row Level Security
alter table public.applications enable row level security;

-- Allow insert from anon (public form submissions)
create policy "Allow public insert"
  on public.applications
  for insert
  to anon
  with check (true);
```

### Storage Bucket — `cvs`

1. Go to **Supabase → Storage**
2. Click **New bucket**, name it `cvs`
3. Toggle **Public bucket** ON (so public URLs work)
4. Go to **Storage → Policies** and add an INSERT policy for the `anon` role:

```sql
create policy "Allow public uploads"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'cvs');
```

---

## ☁️ Deploy to Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com), click **Add New Project**
3. Import your repository
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy** — done! ✅

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── globals.css         # Tailwind + glass utilities
│   ├── page.tsx            # / → Careers listing
│   └── apply/
│       ├── page.tsx        # /apply → page shell + Suspense
│       └── ApplyForm.tsx   # Form logic + Supabase submit
├── components/
│   ├── GlassCard.tsx       # Reusable glass card container
│   ├── GlassButton.tsx     # Primary/ghost button variants
│   ├── BadgePill.tsx       # Colored tag/badge pills
│   └── GlowBackground.tsx  # Animated blob background
└── lib/
    ├── supabase.ts         # Supabase client singleton
    └── roles.ts            # Role data + types
```

---

## 🎨 Customising

- **Brand name**: Search for `YourBrand` in `page.tsx` and `apply/page.tsx`
- **Roles**: Edit `src/lib/roles.ts` — add/remove/edit roles and their badge colors
- **Colors**: Edit `tailwind.config.ts` keyframes and blob colors in `GlowBackground.tsx`

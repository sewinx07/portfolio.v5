# TAHA GMIR — Cinematic Portfolio

A production-ready creative portfolio with a private, database-driven CMS and an
AI portfolio assistant. Built to feel directed like a film: an animated spatial
work gallery, choreographed page transitions, custom cursor, editorial type and
motion that means something.

- **Public site** — cinematic home, spatial work gallery, case studies, about, contact
- **Private CMS** at `/admin` — projects, media library, pages, navigation, technologies, messages, AI settings, site settings, analytics
- **AI assistant** — offline context-aware answers, optionally upgraded to an OpenAI-compatible API
- **First-party analytics** — page & project views, no third-party trackers (off by default)

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) · React 19 · TypeScript |
| Styling | Hand-written CSS in `src/app/globals.css` |
| Animation | `motion` (Framer Motion) |
| Database | Prisma 6 + PostgreSQL (Neon — serverless + VPS friendly) |
| Auth | Signed JWT session cookie (`jose`, HS256) with DB-verified guards |
| Images | `sharp` (resize → WebP ≤2400px, SVGs sanitized) + self-hosted `next/font` |
| QA | Playwright harness (`qa/qa.spec.js`) |

## Feature highlights

- **Arc gallery** — projects arranged on a vertical sine arc. Navigate with wheel,
  arrows, drag, click, or touch swipe. Center card expands into a full case study.
  Falls back to a flat list for reduced-motion users or a single project.
- **CMS without compromise** — every public page is editable from `/admin` and
  updates go live instantly (routes are `force-dynamic`, so no rebuilds).
- **Media pipeline** — drag-and-drop upload, automatic processing, runtime
  serving of new files through a guarded `/uploads/*` route (so uploads work
  even on production servers without a rebuild).
- **Security** — JWT sessions, rate limiting on login/contact/AI/upload/analytics,
  DB re-check of every admin mutation, SVG sanitization, security headers + CSP,
  locked-down SVG serving, path-traversal guards.
- **SEO** — sitemap, robots, canonical URLs, Open Graph image, JSON-LD.

---

## Quick start

Prerequisites: Node 20.12+ (Node 24 recommended).

```bash
npm install        # postinstall runs prisma generate
cp .env.example .env
# shorten ADMIN_PASSWORD to taste
npm run db:setup   # create schema + seed demo content + admin user
npm run dev        # http://localhost:3000
```

Then open **`/admin`** and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

> **First-run warning** — `npm run db:setup` only seeds empty/false env values.
> The seed reads your real `.env`, so if you leave `ADMIN_PASSWORD` blank you'll
> never hit this project's demo credentials and get a random password instead.

### Scripts

```bash
npm run dev        # development server
npm run build      # production build (runs typecheck)
npm run start      # production server
npm run db:setup   # prisma db push + seed
npm run db:push    # apply schema without reseeding
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

## Deploying

The app reads Postgres via the **pooled** `DATABASE_URL` (serverless-safe) and runs
Prisma migrations over the **direct** `DIRECT_URL`. Both come from a Neon project.

### Vercel (recommended)

```text
Environment Variables (Settings → Environment Variables → Production):
  DATABASE_URL        = <Neon "Pooled connection" string>
  DIRECT_URL          = <Neon "Direct connection" string>
  AUTH_SECRET         = <long random string>
  NEXT_PUBLIC_SITE_URL= https://your-domain.com
  ADMIN_EMAIL         = admin@tahagmir.com        (seed only)
  ADMIN_PASSWORD      = <your admin password>     (seed only)
  AI_BASE_URL / AI_API_KEY / AI_MODEL = optional OpenAI-compatible provider
```

Apply the schema + seed once from your machine (the migration runs over
`DIRECT_URL`, so it works from anywhere):

```bash
npm ci
cp .env.example .env      # fill in the two connections from Neon
npm install
npm run db:setup          # prisma db push + seed (Neon)
npm run build
```

Then push your repo and Deploy on Vercel. That's it — each deploy is a fresh
serverless instance that already has its data in Neon.

> **Media note** — uploaded files are written to the server disk
> (`public/uploads`), which is **ephemeral on Vercel**: uploads survive on a
> dedicated VM/VPS but may be lost on a serverless redeploy. For permanent media
> on Vercel, keep media on the local-only path (direct-upload to object storage
> is a planned upgrade).

### Single VPS

`next start` behind a reverse proxy (Caddy or nginx) keeps everything on one box,
including persistent uploads:

```bash
npm ci
cp .env.example .env          # set AUTH_SECRET, ADMIN_*, NEXT_PUBLIC_SITE_URL
npm run build
npm run start                 # listens on :3000
```

```text
site.com            -> 127.0.0.1:3000   (HTTPS)
```

The proxy must pass `Host` and `X-Forwarded-For` so rate limiting keys on the
real client IP. Production runs automatically set `secure` cookies, `HSTS`, and
the full security header set. Point `NEXT_PUBLIC_SITE_URL` at your public
origin — it drives the sitemap, canonical URLs, and Open Graph metadata.

> Run as a dedicated non-root user. Keep `AUTH_SECRET` at ≥32 random bytes.
> Back up the Neon database (point-in-time restore) and `public/uploads/`
> regularly.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection (runtime — serverless-safe) |
| `DIRECT_URL` | Direct Postgres connection (Prisma `db push` / migrations) |
| `AUTH_SECRET` | Session signing secret — ≥24 chars, keep secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin bootstrap (used only by the seed) |
| `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` | Optional OpenAI-compatible provider; leave blank for the offline assistant |
| `NEXT_PUBLIC_SITE_URL` | Public origin for SEO (sitemap, canonical, OG) |

---

## Roles & content model

- **ADMIN** — full access (only role that can publish by default is admin/editor). EDITOR and VIEWER are reserved for future multi-user use.
- Content lives in `Project`, `PageContent` (homepage/about/contact), `MediaItem`,
  `Technology`, `NavItem`, `SocialLink`, `SiteSettings`, `AISettings`,
  `AIKnowledge`, `ContactSubmission`, `AnalyticsEvent`, plus `Revision` snapshots.
- **Revisions** — every saved project can be snapshotted and restored from the editor.

## QA

The suite is self-contained: it snapshots the DB, provisions published projects,
runs 66 browser checks, and restores the baseline in a `finally` block.

```bash
npm run build
node qa/qa.spec.js        # expects the server on :3100 (see BASE in the spec)
```

## Project structure

```text
src/app/(site)/        # public pages (home, work, case study, about, contact)
src/app/admin/         # authenticated CMS
src/app/api/           # media upload, AI, first-party analytics
src/app/uploads/[...]  # runtime serving of uploaded media
src/components/        # public, work, admin, contact component groups
src/lib/               # db, session, upload, ai-context, validation, rate-limit
src/actions/           # server actions (all admin-guarded)
prisma/                # schema + seed.mjs
qa/                    # Playwright harness (gitignored — skip for the client build)
```

## License

Proprietary. © Taha Gmir. Not for resale or redistribution without permission.
See `LICENSE`.
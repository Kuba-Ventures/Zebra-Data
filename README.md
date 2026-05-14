# Zebra Data

The connective tissue for healthcare data.

This repo contains both the marketing site and the full post-login product:
auth, intake, dashboard, connections, background sync, and the entity-resolution
layer that turns fragmented records from many sources into a single Patient 360.

---

## Tech stack & why

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 15** (App Router) + TypeScript + React 19 | Server actions for intake submission, RSC for fast dashboard reads, edge-ready on Vercel. |
| Auth | **Supabase Auth** | Email/password + Google + Apple OAuth out of the box, JWTs that plug straight into Postgres Row-Level Security, httpOnly cookies via `@supabase/ssr`. |
| Database | **Supabase Postgres** + **Row-Level Security** | RLS enforces patient-data isolation *in the database*, not just in app code — the right primitive for HIPAA-shaped work. |
| ORM | **Drizzle** | TypeScript-native schema, light bundle, fast cold starts on Vercel serverless, RLS-friendly. |
| Encryption at rest | **`pgcrypto`** column-level (`pgp_sym_encrypt`) for SSN last-4, insurance member/group IDs, and OAuth tokens, on top of Supabase's disk-level encryption. | Defense in depth. PHI fields never exist as plaintext on disk. |
| Background sync | **Vercel Cron** → `/api/cron/sync` | Same platform as the app, no extra worker infra for an MVP. |
| Validation | **Zod** | One schema shared between client form + server action. |
| UI | Tailwind + Lucide icons | Matches the landing page's visual language (Inter Tight / Inter / Fraunces, navy / electric-blue / coral). |
| Logging | Custom redacting logger in `lib/logger.ts` | Strips SSN, insurance IDs, and OAuth tokens before anything reaches Vercel logs. |

> **HIPAA note.** Supabase requires a Business plan + signed BAA for real production PHI; this repo is wired so that switching to that tier later is a config change, not a rewrite. Today's demo uses synthetic data only.

---

## Local setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

1. https://supabase.com/dashboard → **New project** (free tier is fine for the demo)
2. Project Settings → **API**: copy the project URL, the `anon` key, and the `service_role` key
3. Project Settings → **Database**: copy the **Session pooler** connection string

### 3. Apply the schema

Open Supabase → SQL Editor and paste the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Run it.

This creates every table, enum, RLS policy, encryption helper, and trigger.

### 4. Configure env vars

```bash
cp .env.example .env.local
# fill in the values from steps 2 and 3
```

Required:

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, used by cron paths |
| `DATABASE_URL` | Postgres session-pooler URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally |
| `PHI_ENCRYPTION_KEY` | Long random string, ≥ 32 chars |
| `CRON_SECRET` | Random string for the Vercel Cron handler |

Optional (without these, Whoop/Oura fall back to mock mode):

- `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`
- `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET`

### 5. Enable Google/Apple OAuth

In Supabase → Authentication → **Providers**: turn on Google and/or Apple and set
each provider's callback to `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.

For local-only demos, **email/password** alone works fine — disable email confirmation
under Authentication → Settings if you want instant signup.

### 6. Run

```bash
npm run dev
```

Visit http://localhost:3000.

---

## End-to-end demo flow

1. `/` → click **Sign Up** (top-right)
2. Sign up with any email / password (≥ 8 chars) — or use Google
3. You land in the **5-step intake wizard**. Each step is saved as you go.
4. Submit the final step → you're routed to the **Dashboard** with empty cards.
5. Click **Connect a source** on any card → **Connections** page.
6. Click **Connect** on Whoop, Oura, or MyChart (VCU Health). With no real
   OAuth creds, the connector returns synthetic data immediately and your
   dashboard fills up.
7. Connect a second EMR (e.g. another MyChart variant) to see the
   **Conflicts to Review** card light up — the resolver intentionally raises
   a conflict when two sources disagree on an allergy or medication.

---

## Background sync

`vercel.json` schedules `GET /api/cron/sync` for **06:00 UTC daily**. On Vercel it's
invoked automatically with an `x-vercel-cron` header; locally you can hit it with:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync
```

The cron handler picks every connection where `last_sync_at` is older than the
configured interval (default daily) and runs `runSyncForConnection(id)` against
each. That function:

1. Decrypts the access token, refreshes if expired
2. Calls `connector.fetchRecords({ since: last_sync_at, ... })`
3. Inserts the raw rows
4. Pipes them through the entity resolver → `unified_records` (+ optional `conflicts`)
5. Updates `connection.last_sync_*` and the `sync_jobs` history row

---

## Entity resolution

Two distinct concerns, in two files:

### Patient-level matching — `lib/resolver/patient.ts`

Used when data arrives without a known user (webhook ingestion, claim-your-record flows).
Pipeline:

- **Deterministic:** `(last_name + dob + ssn_last4)` → auto-link
- **Deterministic:** `(last_name + dob + insurance_member_id)` → auto-link
- **Probabilistic:** Jaro-Winkler on names, exact DOB / phone / email / ZIP
  - ≥ 0.85 → auto-link
  - 0.60–0.85 → `needs_review`
  - < 0.60 → unmatched

### Record-level resolution — `lib/resolver/index.ts`

After raw records land, each one is reduced to a `groupingKey` (e.g.
`vital:blood_pressure`, `allergy:penicillin`, `lab:LDL:2026-04-12`) and matched
against existing `unified_records` on the same patient. Then the survivorship
policy from `lib/resolver/survivorship.ts` decides what to do:

- `most_recent` — vitals, wearable metrics: replace if newer
- `preserve_history` — labs, visits, imaging: keep every row
- `flag_conflict` — allergies, medications, conditions: never silently merge.
  Raise a `conflicts` row when sources disagree.

Survivorship lives in one file so the policy can evolve without touching the
resolver.

---

## Adding a new data source

See [CONNECTORS.md](CONNECTORS.md).

---

## Deploying to Vercel

The repo is already wired to a Vercel project — push to `main` and it deploys.
First-time setup on a new project:

```bash
vercel link --project zebra-data
vercel env add NEXT_PUBLIC_SUPABASE_URL     production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY    production
vercel env add DATABASE_URL                 production
vercel env add NEXT_PUBLIC_APP_URL          production   # https://your-domain
vercel env add PHI_ENCRYPTION_KEY           production
vercel env add CRON_SECRET                  production
vercel deploy --prod
```

Vercel Cron picks up `vercel.json` automatically on the next deploy.

---

## Repo map

```
app/
  page.tsx              landing (ported from the original index.html)
  login/                signin + signup
  auth/                 OAuth callback, forgot, reset
  intake/               5-step wizard + server actions
  (app)/                authenticated shell
    dashboard/          10 cards (incl. Conflicts to Review)
    connections/        Plaid-style picker grouped by category
  api/
    cron/sync/          daily background sync endpoint
    connections/[source]/callback/  OAuth return path

components/
  landing/              Hero + architecture diagram + waitlist
  dashboard/            DashboardCard shell + 10 specific cards
  connections/          SourceCard
  ZebraLogo.tsx         the custom Z-with-stripes mark + favicon

lib/
  connectors/           types, catalog, registry, real impls (Whoop/Oura/MyChart),
                        generic mock, synthetic data generators
  resolver/             survivorship policies, patient-level + record-level matching
  sync/                 runner that orchestrates fetch → ingest → resolve
  db/                   Drizzle schema + connection
  supabase/             SSR client, browser client, middleware helper
  validation/           Zod schemas for intake
  crypto.ts             PHI encryption helpers (pgp_sym_encrypt/decrypt)
  logger.ts             redacting JSON logger

supabase/
  migrations/0001_init.sql   single-file schema you paste into Supabase

middleware.ts           Route gating + session refresh
vercel.json             Cron config + function timeouts
```

---

## What's not here (intentionally)

- Real Epic FHIR is **mocked** — switching requires app registration with Epic;
  see CONNECTORS.md for the upgrade path.
- No PHI in the demo dataset — every value is synthesized in `lib/connectors/synth.ts`.
- No audit table yet (planned: `audit_log` of who-saw-what). Schema-ready, not surfaced.

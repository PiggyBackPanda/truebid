# TrueBid

Free, transparent property sales platform for Australia. Sellers list for free, buyers place offers publicly via the Open Offers system. No agent commissions.

## Quick start

```bash
cp .env.example .env.local   # fill in values — see sections below
npm install
npm run db:push              # apply schema to local Postgres
npm run db:seed              # optional fixture data
npm run dev                  # Next.js + Socket.io on http://localhost:3000
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Next.js + Socket.io, port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run test` | Vitest unit + integration tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with fixture data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate` | Create and apply migration |
| `npm run db:reset` | Reset database and re-seed |

## Environment variables

Copy `.env.example` to `.env.local` and fill in all values. The table below lists variables that **must** be set before go-live — the app will either refuse to start or return errors if they are missing.

| Variable | Required for production | Notes |
|----------|------------------------|-------|
| `DATABASE_URL` | Yes | PostgreSQL 16 connection string |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_SECRET` | Yes | Same value as `NEXTAUTH_SECRET` |
| `NEXTAUTH_URL` | Yes | Production domain, e.g. `https://truebid.com.au` |
| `NEXT_PUBLIC_BASE_URL` | Yes | Same as `NEXTAUTH_URL` |
| `CRON_SECRET` | **Yes — cron endpoint returns 500 if unset** | Shared secret between the cron scheduler and `/api/cron/*`. Set in Vercel Cron / Upstash scheduler config as `Authorization: Bearer <value>`. Generate: `openssl rand -hex 32` |
| `INTERNAL_API_SECRET` | Yes | Shared secret for `/api/internal/*` (QStash → delayed email). Generate: `openssl rand -hex 32` |
| `RESEND_API_KEY` | Yes | Transactional email |
| `AWS_ACCESS_KEY_ID` | Yes | S3 image uploads |
| `AWS_SECRET_ACCESS_KEY` | Yes | S3 image uploads |
| `AWS_S3_BUCKET` | Yes | S3 bucket name |
| `CLOUDFRONT_URL` | Yes | CDN domain for served images |
| `UPSTASH_REDIS_REST_URL` | Yes | Rate limiting + session cache |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Rate limiting + session cache |
| `STRIPE_SECRET_KEY` | Yes | Identity verification + payments |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook validation |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Client-side Stripe |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Property maps |
| `ENCRYPTION_KEY` | Yes | AES-256-GCM key for verified identity PII. Generate: `openssl rand -hex 32` |
| `QSTASH_URL` | Yes | Delayed email jobs |
| `QSTASH_TOKEN` | Yes | Delayed email jobs |
| `REDIS_URL` | Yes (multi-instance) | Socket.io Redis adapter |
| `ANTHROPIC_API_KEY` | Optional | AI listing description generation |

### Cron scheduler setup

Configure your scheduler (Vercel Cron, Upstash Scheduler, etc.) to call:

```
GET /api/cron/inspection-reminders
Authorization: Bearer <CRON_SECRET>
```

Recommended schedule: **every hour** (`0 * * * *`).

## Pre-deploy checklist

Before going live, confirm:

- [ ] All required environment variables above are set in production
- [ ] `CRON_SECRET` is set and configured in the cron scheduler
- [ ] `NEXTAUTH_URL` matches the production domain exactly
- [ ] `ENABLE_DEV_BYPASS` is **not** set (bypasses identity verification)
- [ ] `npm run typecheck && npm run lint && npm run test` all pass on the deploy branch
- [ ] Database migrations are up to date (`npm run db:migrate`)
- [ ] Stripe webhooks are configured for the production endpoint

## Tech stack

- **Framework**: Next.js 14+ (App Router, Server Components)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 16 via Prisma ORM
- **Real-time**: Socket.io (co-located custom server)
- **Auth**: NextAuth.js v5 (credentials provider, JWT)
- **Storage**: AWS S3 + CloudFront CDN
- **Cache / rate-limit**: Redis (Upstash)
- **Email**: Resend
- **Payments / identity**: Stripe
- **Maps**: Mapbox GL JS

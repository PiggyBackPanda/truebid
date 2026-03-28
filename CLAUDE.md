# TrueBid

Free, transparent property sales platform for Australia.

## Writing Style

- NEVER use em dashes (—) or double hyphens (--) in any copy, UI text, comments, or documentation. Use commas, colons, or reword the sentence instead. Sellers list for free, buyers place offers publicly via the Open Offers system (real-time, transparent bidding with anti-snipe protection). No agent commissions. No middleman.

## Security

- The dev verification bypass (`DevBypassBlock`) and dev upload route (`/api/dev/upload`) must NEVER be reachable in production. Both are gated by `process.env.NODE_ENV === 'development'` checks. Never remove or weaken these guards.

## Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode, no `any`)
- **Styling**: Tailwind CSS with custom design tokens in `tailwind.config.ts`
- **Database**: PostgreSQL 16 via Prisma ORM
- **Real-time**: Socket.io (WebSocket server co-located with Next.js custom server)
- **Auth**: NextAuth.js v5 (credentials provider, JWT strategy)
- **Storage**: AWS S3 (property images) + CloudFront CDN
- **Cache**: Redis (Upstash) for sessions, rate limiting, pub/sub
- **Email**: Resend (transactional emails)
- **Payments**: Stripe (premium features only — core listing is free)
- **Identity Verification**: Stripe Identity
- **Maps**: Mapbox GL JS

## Commands

```bash
npm run dev          # Start dev server (Next.js + Socket.io on port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run typecheck    # TypeScript compiler check (no emit)
npm run test         # Run Vitest unit + integration tests
npm run test:e2e     # Run Playwright end-to-end tests
npm run db:push      # Push Prisma schema to database
npm run db:seed      # Seed database with fixture data
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Create and apply migration
npm run db:reset     # Reset database and re-seed
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Landing, how-it-works, about (public)
│   ├── (auth)/             # Login, register, verify-identity
│   ├── (dashboard)/        # Seller dashboard, buyer dashboard (protected)
│   ├── listings/           # Search page, [id] detail page, create flow
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Primitives: Button, Input, Badge, Card, Modal
│   ├── layout/             # Nav, Footer, PageWrapper, Sidebar
│   ├── listings/           # ListingCard, OfferBoard, OfferRow, CountdownTimer, PhotoGallery
│   └── dashboard/          # StatsCard, OfferTable, MessageThread, ChecklistItem
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── auth.ts             # NextAuth config
│   ├── socket.ts           # Socket.io server setup
│   ├── s3.ts               # S3 upload utilities
│   ├── email.ts            # Email sending utilities
│   ├── validation.ts       # Zod schemas (shared between client and server)
│   └── utils.ts            # Shared helpers (formatCurrency, formatDate, etc.)
├── hooks/                  # Custom React hooks (useOfferBoard, useCountdown, etc.)
├── types/                  # TypeScript type definitions
└── styles/                 # Global CSS, Tailwind config
```

## Code Style

- Functional components only. No class components.
- Named exports for components. Default export only for page.tsx files.
- Use Server Components by default. Add `"use client"` only when hooks/interactivity needed.
- Colocate types with their module. Shared types go in `src/types/`.
- Use Zod schemas in `src/lib/validation.ts` for ALL validation — shared between client forms and API routes.
- Error handling: API routes return `{ error: string, code: string }` on failure. Never expose internal errors to clients.
- Use `try/catch` in all API routes and Server Actions. Log errors with context.
- Prisma queries: always use `select` or `include` explicitly — never return full models to the client.
- All currency values stored as integers (cents) in the database, formatted to dollars in the UI.
- All dates stored as UTC in database, displayed in `Australia/Perth` timezone in UI.

## Testing

- Vitest for unit and integration tests. Test files colocated as `*.test.ts` next to source.
- Playwright for E2E. Test files in `tests/e2e/`.
- IMPORTANT: Every new API route MUST have tests for success case, validation failure, auth failure, and at least one edge case.
- IMPORTANT: Every new UI component with interactivity MUST have tests.
- Run `npm run test` before committing. All tests must pass.

## Design System

- See `/docs/design/design-tokens.md` for colours, typography, spacing.
- Primary palette: Navy (#0f1a2e), Amber (#e8a838), Slate (#334766).
- Font: DM Serif Display (headings), Outfit (body).
- All UI must be responsive: mobile-first (375px), tablet (768px), desktop (1024px+).
- IMPORTANT: Never use Inter, Roboto, Arial, or system fonts. These are banned.

## Key Domain Rules

- Offers can only be INCREASED or WITHDRAWN, never decreased.
- Anti-snipe: if an offer is placed within 10 minutes of closing, closing extends by 10 minutes.
- Sellers see full buyer details (name, phone, email). Public board shows only pseudonymous IDs.
- Currency amounts are in AUD. Store as cents (integer). Display as dollars with commas.
- Identity verification is REQUIRED before publishing a listing or placing an offer.
- Listings can use three sale methods: open_offers, private_offers, fixed_price.
- The Open Offers board updates in real-time via WebSocket. No polling.

## Specifications

Detailed specs for each feature are in `/docs/specs/`. Read the relevant spec BEFORE implementing a feature:
- Database schema: `/docs/specs/database-schema.md`
- API contracts: `/docs/specs/api-contracts.md`
- Offer system: `/docs/specs/offer-system.md`
- Other feature specs in the same directory.

## Git

- Branch naming: `feature/short-description`, `fix/short-description`
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)
- Never commit `.env.local` or any secrets.
- Run `npm run typecheck && npm run lint && npm run test` before pushing.

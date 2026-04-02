# TrueBid

Free, transparent property marketplace for Australia. Private sellers list their own properties. Buyers browse and submit non-binding offers. No real estate agents involved.

---

## What TrueBid Is

TrueBid is a For Sale By Owner (FSBO) residential property marketplace operating in Western Australia, with plans to expand nationally.

**TrueBid is NOT:**
- A real estate agency
- An auction platform
- A conveyancing service
- A financial advice service
- A deposit-holding service

**TrueBid IS:**
- A marketplace connecting private sellers and buyers
- A transparency tool that shows buyers what offers others have made
- A listing platform charged per listing to sellers (free during launch period)
- Free for buyers

TrueBid's fee is always a flat per-listing fee — never a percentage of sale price, never contingent on a sale completing.

---

## The Core Feature: Live Offers

Live Offers is TrueBid's primary differentiator. It is a transparent real-time offer process where:

- Buyers submit offers during a defined offer period
- Previous offer amounts may be visible to other buyers (seller's choice) to help inform their decisions
- An anti-snipe timer extends the offer period by 10 minutes if an offer is placed in the last 10 minutes
- The seller sees all offers and buyer identities in a private dashboard
- The seller is never obligated to accept any offer
- No offer creates a legally binding contract
- All final negotiations and contract execution happen off-platform

Sellers may also choose Private Offers or Fixed Price instead of Live Offers.

---

## Critical Legal Constraints

### 1. No Auction Language — Ever

The most important legal risk is that Live Offers could be classified as an auction under WA law. If classified as an auction, operating it without a licensed auctioneer may be unlawful.

**NEVER use these words in any user-facing context:**
- bid, bids, bidding, bidder, bidders
- auction, auctioneer, auctioning
- hammer, "going once", "going twice"
- "winning bid", "highest bidder"
- "sold to [name]"

**ALWAYS use instead:**
- offer, offers, submitting an offer
- offer process, offer period
- buyer, buyers
- "offer accepted", "highest offer received"
- "offer period closing"

This applies to: UI text, button labels, email templates, notifications, tooltips, error messages, success messages, help text, page titles, meta descriptions, and any other user-facing string.

Internal code variable names, comments, and the brand name "TrueBid" are exempt. Legal contrast contexts (e.g. "unlike a traditional auction") are also exempt.

### 2. No Binding Contracts On Platform

TrueBid does not form legally binding contracts. Every part of the platform where offers are submitted must make this clear. The offer submission flow requires a mandatory acknowledgement checkbox (unchecked by default) before a buyer can submit an offer. Do not remove or bypass this checkbox.

### 3. No Deposits, No Money Handling

TrueBid never handles, holds, processes, or routes deposit money or any transaction funds. If any feature is proposed that involves TrueBid touching money related to a property transaction, flag it before implementing.

### 4. No Agency Services

TrueBid must not perform any function that constitutes acting as a real estate agent. This includes:
- Negotiating between buyer and seller on behalf of either party
- Advising either party on pricing or terms
- Receiving commission tied to a completed sale
- Preparing or transmitting contracts of sale
- Acting as an intermediary in the legal transaction

### 5. Biometric Data — Stripe Identity

Buyer identity verification uses Stripe Identity, which collects government-issued photo ID and biometric data (facial recognition). Under Australian Privacy law, biometric data is "sensitive information" with strict requirements:

- Explicit standalone consent must be obtained before Stripe Identity is initiated — not buried in general T&Cs
- This consent step is already built — do not remove or bypass it
- TrueBid receives only a pass/fail verification result — it does not store ID documents or biometric data
- Any change to the identity verification flow must preserve the consent step

### 6. Seller Ownership Verification

Sellers self-certify they own the property they are listing. The listing flow requires four individual checkboxes confirming ownership authority, accuracy of listing information, and understanding that TrueBid is a marketplace only. These checkboxes are already built — do not remove or combine them.

### 7. Privacy — Collection Notices (APP 5)

Every form that collects personal information must display a short collection notice explaining why the data is being collected. These notices must link to the Privacy Policy, must not be smaller than body text, and must not require scrolling to see. Collection notices are already present on the buyer registration form, seller listing form, and offer submission form — do not remove them.

### 8. Free Period Disclaimer

TrueBid listing is currently free for sellers during the launch period. Wherever "free" is referenced for sellers, a disclaimer must appear: "Listing is free during TrueBid's launch period. Fees will be introduced in the future with advance notice. Any listings active at the time of the fee change will complete their current listing period at no charge."

### 9. Future Referral/Affiliate Model

TrueBid may in future introduce referral fees for referring buyers and sellers to mortgage brokers, settlement agents, and other service providers. When this is built:
- Explicit opt-in consent is required before sharing any user data
- The commercial relationship must be clearly disclosed to users
- This cannot be pre-ticked or hidden in settings

### 10. AUSTRAC — Not Currently Applicable

TrueBid charges flat listing fees and does not directly advance individual transactions. As currently structured, TrueBid is not a reporting entity under AML/CTF law. This position must be preserved — do not build features that make TrueBid's fee contingent on transaction completion or that cause TrueBid to act as an intermediary in property transfers.

---

## What Requires a Lawyer — Do Not Treat as Final

The following require professional legal advice and must not be drafted by Claude Code as final legal documents:

- Terms of Service / Terms of Use
- Privacy Policy
- Any legal opinion on whether Live Offers constitutes an auction
- Seller disclosure documents
- Any contract-related documents

These can be drafted as frameworks or first drafts for lawyer review — but must never be treated as final without legal sign-off.

---

## Pending Legal Actions (Outside Codebase)

These are being handled separately and do not require code changes:

1. Legal opinion on whether Live Offers constitutes an auction under WA law — must be obtained before public launch
2. Final Terms of Service — to be drafted by a lawyer
3. Final Privacy Policy — to be drafted by a lawyer, must address Stripe Identity biometric data and overseas data handling
4. Confirmation of Stripe's data retention practices for identity verification

---

## If You Are Unsure

If asked to build a feature and unsure whether it conflicts with the constraints above — particularly around auction classification, agency services, deposit handling, or biometric data — flag it before implementing. Do not assume compliance. Ask first.

---

## Writing Style

- NEVER use em dashes (—) or double hyphens (--) in any copy, UI text, comments, or documentation. Use commas, colons, or reword the sentence instead.
- Follow the auction language rules above in all user-facing strings.

---

## Copy and Language Standards

These rules apply to every piece of user-facing text in the codebase — pages, components, error messages, button labels, email templates, guide content, and FAQs. They are not optional. Apply them whenever writing new copy or editing existing copy, without needing to be asked.

### Tone and Voice
- Direct, honest, and plainspoken. Write like a knowledgeable person explaining something clearly, not like a marketing department.
- Confident without being aggressive. TrueBid is not attacking the real estate industry. It is offering an alternative that has not previously existed.
- Agents are referred to respectfully as professionals who add genuine value in the right situations.
- Empowering toward sellers. The goal is to give people information and confidence, not to push them toward any particular decision.

### Hard Rules — Never Violate These

**Formatting**
- No em dashes anywhere in any copy. Use a comma, a full stop, or rewrite the sentence.
- No absolute or extreme statements. Nothing is "completely transparent", "total control", "always", "guaranteed", "never fails", or "the only platform".

**Feature and Action Terminology**
- The platform feature is called Open Offers or Live Offers. Never "auction", "bidding", or "bid".
- Buyers submit offers. Sellers receive offers. Never "bids", "tenders", or "submissions".
- The timeframe is the "Open Offer period" or the "offer window". Never "auction period" or "bidding window".
- Sellers accept or review offers. Never "accept a bid" or "win the auction".
- Never use the words "bid", "bidding", "bidder", or "auction" in any user-facing string.

**Agent and Cost Language**
- Never say "pay an agent". Always say "appoint an agent".
- Never say "agent fees". Say "agent commission".
- Never say "avoid paying commission" or "skip the agent". Say "keep more of your sale proceeds" or "sell directly".
- Never say "cut out the middleman".

**Free and Pricing Language**
- Do not overuse the word "free" or imply the platform will always be free.
- The platform is free during the launch period only. Use: "no fees during our launch period", "currently free to list", or "free during launch".
- Never imply permanent free access. A fee model will be introduced in the future.

**User Roles**
- Use "seller" consistently. Not "vendor", "owner", or "lister".
- Use "buyer" consistently. Not "bidder" or "applicant".
- Use "offer" consistently. Not "bid", "tender", or "submission".

### Banned Words and Phrases
Remove or replace any of the following on sight:
- seamlessly
- robust
- rest assured
- it is worth noting
- dive into
- leverage (as a buzzword)
- game-changer
- revolutionary
- disrupt / disrupting / disruption
- we understand that
- empower (as a buzzword — the concept is fine, the word is overused)
- cutting-edge
- innovative (unless describing something genuinely novel with specifics)
- streamlined
- ecosystem (in a marketing context)

### Structural Language Guidance
- Do not frame any content as TrueBid versus agents. Frame it as "your options" or "understanding each method".
- Do not editorially push readers toward any particular sale method. Give them information and let them decide.
- When writing about situations where an agent makes sense, write that content with the same care and respect as content about TrueBid. It reflects better on the platform than a one-sided comparison ever could.
- Do not use "disrupt" or any variation. TrueBid is not disrupting anything. It is providing an alternative.
- The phrase that should guide all copy decisions: "Whatever you choose, choose it knowing your options."

### Quick Reference — Common Replacements

| Do not use | Use instead |
|---|---|
| Pay an agent | Appoint an agent |
| Agent fees | Agent commission |
| Avoid paying commission | Keep more of your sale proceeds |
| Cut out the middleman | Sell directly |
| Hidden offers | Offers not visible to buyers |
| Bid / bidding / bidder | Offer / submitting an offer / buyer |
| Auction (in feature context) | Open Offers / Live Offers |
| Free platform (permanent) | Currently free during launch |
| List your home for free | List your home free during launch |
| Disruptive / disrupt | (Remove or reframe entirely) |
| We understand that | (Remove — just say the thing) |

---

## Security

- The dev verification bypass (`DevBypassBlock`) and dev upload route (`/api/dev/upload`) must NEVER be reachable in production. Both are gated by `process.env.NODE_ENV === 'development'` checks. Never remove or weaken these guards.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode, no `any`)
- **Styling**: Tailwind CSS with custom design tokens in `tailwind.config.ts`
- **Database**: PostgreSQL 16 via Prisma ORM
- **Real-time**: Socket.io (WebSocket server co-located with Next.js custom server)
- **Auth**: NextAuth.js v5 (credentials provider, JWT strategy)
- **Storage**: AWS S3 (property images) + CloudFront CDN
- **Cache**: Redis (Upstash) for sessions, rate limiting, pub/sub
- **Email**: Resend (transactional emails)
- **Payments**: Stripe (seller listing fees)
- **Identity Verification**: Stripe Identity (buyer verification — biometric consent screen required)
- **Maps**: Mapbox GL JS

### Key External Services

**Stripe Identity:** Buyer ID verification. Collects government ID and biometrics. Consent screen must precede every verification initiation. TrueBid receives pass/fail only.

**Stripe Payments:** Seller listing fees. Flat fee per listing — never a percentage of sale price.

**Landgate (WA):** Government land title registry. May be used for future automated title verification.

---

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

---

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

---

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

---

## Testing

- Vitest for unit and integration tests. Test files colocated as `*.test.ts` next to source.
- Playwright for E2E. Test files in `tests/e2e/`.
- IMPORTANT: Every new API route MUST have tests for success case, validation failure, auth failure, and at least one edge case.
- IMPORTANT: Every new UI component with interactivity MUST have tests.
- Run `npm run test` before committing. All tests must pass.

---

## Design System

- See `/docs/design/design-tokens.md` for colours, typography, spacing.
- Primary palette: Navy (#0f1a2e), Amber (#e8a838), Slate (#334766).
- Font: DM Serif Display (headings), Outfit (body).
- All UI must be responsive: mobile-first (375px), tablet (768px), desktop (1024px+).
- IMPORTANT: Never use Inter, Roboto, Arial, or system fonts. These are banned.

---

## Key Domain Rules

- Offers can only be INCREASED or WITHDRAWN, never decreased.
- Anti-snipe: if an offer is placed within 10 minutes of closing, closing extends by 10 minutes.
- Sellers see full buyer details (name, phone, email). Public board shows only pseudonymous IDs.
- Currency amounts are in AUD. Store as cents (integer). Display as dollars with commas.
- Identity verification is REQUIRED before publishing a listing or placing an offer.
- Listings use three sale methods: OPEN_OFFERS (Live Offers board), PRIVATE_OFFERS, FIXED_PRICE.
- The Live Offers board updates in real-time via WebSocket. No polling.

---

## Geography and Scope

- Launching in Western Australia first
- Residential property and land (existing properties)
- Private sales — no off-the-plan or development sales initially
- Expanding nationally after WA launch

---

## Specifications

Detailed specs for each feature are in `/docs/specs/`. Read the relevant spec BEFORE implementing a feature:
- Database schema: `/docs/specs/database-schema.md`
- API contracts: `/docs/specs/api-contracts.md`
- Offer system: `/docs/specs/offer-system.md`
- Other feature specs in the same directory.

---

## Git

- Branch naming: `feature/short-description`, `fix/short-description`
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)
- Never commit `.env.local` or any secrets.
- Run `npm run typecheck && npm run lint && npm run test` before pushing.

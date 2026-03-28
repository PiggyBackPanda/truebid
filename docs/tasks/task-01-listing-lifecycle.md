# Task 01 — Listing Status Lifecycle

## Goal

Extend the listing status model to support a natural seller-driven pipeline: from draft through to pre-launch visibility, inspection readiness, and finally open for offers. This gives sellers control over pacing and stops buyers from attempting to offer on properties they haven't seen.

## Background

Currently `ListingStatus` has: `DRAFT`, `ACTIVE`, `UNDER_OFFER`, `SOLD`, `WITHDRAWN`, `EXPIRED`.

`ACTIVE` does too much work — it conflates "visible to the public" with "open for offers". A seller may want to list their property publicly before home opens have been scheduled, or make it visible but not yet accepting offers. These are meaningfully different states.

---

## New Status Enum

Replace `ACTIVE` with three distinct states. The final enum becomes:

```prisma
enum ListingStatus {
  DRAFT           // Seller is still setting up the listing. Not visible publicly.
  COMING_SOON     // Listing is publicly visible (title, suburb, photos, description).
                  // No offers accepted. No inspection slots yet required.
                  // Buyer can save/watch. Address is suburb-level only (see Task 05).
  INSPECTIONS_OPEN // Listing is fully visible. Inspection slots are published.
                   // Buyers can book inspections. Offers NOT yet accepted.
  ACTIVE          // Fully open. Offers accepted. Inspections may still be ongoing.
  UNDER_OFFER     // Seller has accepted an offer (conditionally). Still visible.
  SOLD            // Sale completed. Listing archived.
  WITHDRAWN       // Seller has removed the listing. Not visible publicly.
  EXPIRED         // Closing period passed with no accepted offer. See offer-system spec.
}
```

---

## Status Transition Rules

Valid transitions (all others return 400):

```
DRAFT           → COMING_SOON       (seller publishes — min required fields must be complete)
DRAFT           → ACTIVE            (seller skips pre-launch — allowed if listing is complete)
COMING_SOON     → INSPECTIONS_OPEN  (seller adds first inspection slot — auto-transition, or manual)
COMING_SOON     → ACTIVE            (seller opens for offers immediately — skips inspection phase)
COMING_SOON     → WITHDRAWN
INSPECTIONS_OPEN → ACTIVE           (seller decides to open offers)
INSPECTIONS_OPEN → COMING_SOON      (seller removes all inspection slots — reverts)
INSPECTIONS_OPEN → WITHDRAWN
ACTIVE          → UNDER_OFFER       (offer accepted)
ACTIVE          → WITHDRAWN
ACTIVE          → EXPIRED           (cron job, 7 days after closing with no acceptance)
UNDER_OFFER     → ACTIVE            (accepted offer fell through — seller re-opens)
UNDER_OFFER     → SOLD
UNDER_OFFER     → WITHDRAWN
```

---

## Changes Required

### 1. Database

- Add `COMING_SOON` and `INSPECTIONS_OPEN` to the `ListingStatus` enum in `prisma/schema.prisma`.
- Create a migration: `npm run db:migrate -- --name add-listing-lifecycle-statuses`.

### 2. API — Status Transitions

File: `src/app/api/listings/[id]/status/route.ts`

- `PATCH` endpoint. Body: `{ status: ListingStatus }`.
- Authenticate as the listing's seller (401/403 if not).
- Validate the transition is allowed per the table above. Return 400 with `{ error, code: "INVALID_TRANSITION" }` if not.
- When transitioning to `COMING_SOON`: validate required fields are present (title, description, propertyType, bedrooms, bathrooms, at least 1 image). Return 400 with `{ error, code: "LISTING_INCOMPLETE", missingFields: string[] }` if not.
- When transitioning to `ACTIVE`: same validation as above, plus if `saleMethod` is `OPEN_OFFERS`, `closingDate` must be set and in the future.
- Record `publishedAt` timestamp when first leaving `DRAFT`.

### 3. Offer System — Guard

In `src/app/api/offers/route.ts`, update the pre-condition check from:

```typescript
// OLD: only checks ACTIVE
if (listing.status !== "ACTIVE") return error("LISTING_NOT_ACTIVE")
```

To also check `COMING_SOON` and `INSPECTIONS_OPEN`:

```typescript
if (listing.status === "COMING_SOON") return error("LISTING_NOT_YET_OPEN", 400)
if (listing.status === "INSPECTIONS_OPEN") return error("OFFERS_NOT_YET_OPEN", 400)
if (listing.status !== "ACTIVE") return error("LISTING_NOT_ACTIVE", 400)
```

### 4. UI — Listing Detail Page

File: `src/app/listings/[id]/page.tsx`

Display a status banner below the hero image for non-ACTIVE states:

| Status | Banner content |
|---|---|
| `COMING_SOON` | Navy banner: "Coming Soon — This property is not yet accepting offers. Save it to get notified when it opens." |
| `INSPECTIONS_OPEN` | Amber banner: "Inspections Open — Book an inspection below. Offers will open once the seller is ready." |
| `UNDER_OFFER` | Slate banner: "Under Offer — This property has a conditional offer accepted." |
| `WITHDRAWN` | Red banner: "This listing has been withdrawn by the seller." |
| `EXPIRED` | Grey banner: "This listing's offer period has ended." |

When status is `COMING_SOON` or `INSPECTIONS_OPEN`:
- Hide the `OfferBoard` / `OfferForm` entirely.
- Show a "Save this listing" CTA in place of the offer board.

### 5. UI — Seller Dashboard

File: `src/components/dashboard/OfferTable.tsx` and the dashboard overview page.

- Status badge component: update to include `COMING_SOON` (grey), `INSPECTIONS_OPEN` (amber), and existing statuses.
- Add a "Go Live" button on COMING_SOON and INSPECTIONS_OPEN listings that transitions to ACTIVE (with a confirmation modal: "This will open the property for offers. Are you sure?").
- Add a status progress indicator on the listing card in the seller dashboard:
  `[Draft] → [Coming Soon] → [Inspections Open] → [Active] → [Under Offer] → [Sold]`
  Current step highlighted.

### 6. UI — Create Listing Flow

File: `src/app/listings/create/` pages.

On the final step ("Review & Publish"), change the CTA options:

- **Publish as Coming Soon** (primary) — transitions to `COMING_SOON`. Property becomes visible but no offers accepted.
- **Go Straight to Active** (secondary, requires all fields including `closingDate`) — transitions directly to `ACTIVE`.
- **Save as Draft** (text link) — stays in `DRAFT`.

---

## Tests Required

### Unit
- Status transition validator function — test all valid and invalid transitions.
- `LISTING_INCOMPLETE` validation — test each required field missing case.

### API Integration
- `PATCH /api/listings/[id]/status` with valid seller — succeeds for each valid transition.
- Invalid transition — returns 400 with `INVALID_TRANSITION`.
- Non-owner attempting transition — returns 403.
- Placing offer on `COMING_SOON` listing — returns 400 with `LISTING_NOT_YET_OPEN`.
- Placing offer on `INSPECTIONS_OPEN` listing — returns 400 with `OFFERS_NOT_YET_OPEN`.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add `COMING_SOON`, `INSPECTIONS_OPEN` to `ListingStatus` |
| `src/app/api/listings/[id]/status/route.ts` | Create |
| `src/app/api/offers/route.ts` | Modify pre-condition checks |
| `src/app/listings/[id]/page.tsx` | Add status banners, conditionally hide offer board |
| `src/app/listings/create/review/page.tsx` | Update publish CTAs |
| `src/components/dashboard/OfferTable.tsx` | Update status badges |
| `src/components/dashboard/ListingStatusProgress.tsx` | Create new component |
| `src/lib/validation.ts` | Add listing completeness validator |
| `src/app/api/listings/[id]/status/route.test.ts` | Create tests |

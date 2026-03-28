# Task 05 — Address Privacy Controls

## Goal

Give sellers control over how much of their property address is publicly visible. Protect sellers from strangers identifying their home before they're ready, and prevent address harvesting or unwanted attention. Full address is revealed progressively based on buyer action or seller preference.

## Background

A seller listing their home publicly without an agent may be uncomfortable with their full street address being immediately visible to anyone on the internet (including people they know, or unwanted foot traffic). This feature lets them control that.

---

## New Field on Listing

Add to `prisma/schema.prisma` in the `Listing` model:

```prisma
enum AddressVisibility {
  PUBLIC          // Full address visible to everyone, no login required
  LOGGED_IN       // Full address visible to any logged-in (but not necessarily verified) user
  BOOKED_ONLY     // Full address revealed only after booking an inspection (or if no inspections,
                  // after expressing interest / saving the listing — see rules below)
}

// Add to Listing model
addressVisibility  AddressVisibility  @default(LOGGED_IN)
```

Default is `LOGGED_IN` — sensible middle ground. Sellers can tighten to `BOOKED_ONLY` or relax to `PUBLIC`.

---

## Address Visibility Rules

| Viewer | PUBLIC | LOGGED_IN | BOOKED_ONLY |
|---|---|---|---|
| Anonymous (not logged in) | Full address | Suburb + state only | Suburb + state only |
| Logged in (unverified) | Full address | Full address | Suburb + state only |
| Logged in (verified, no booking) | Full address | Full address | Suburb + state only |
| Logged in (verified, booking confirmed) | Full address | Full address | Full address |
| Logged in (verified, attended) | Full address | Full address | Full address |
| Listing's own seller | Always full address | Always full | Always full |

For `BOOKED_ONLY`: if the listing has no inspection slots configured (e.g. `ACTIVE` with no slots), fall back to `LOGGED_IN` behaviour to avoid blocking buyers from knowing where the property is when they can't get the address any other way. Show a note: "Full address visible after saving this listing."

---

## Display Rules for Suburb-Only Mode

When the full address is not shown:

- Show: `[Suburb], [State] [Postcode]` — e.g., `Floreat, WA 6014`
- Show approximate map pin (randomised within a ~300m radius of the true location — see Map Pin Fuzzing below).
- Do NOT show street name or number anywhere on the page, including in the `<title>`, meta tags, or structured data.
- Show a lock icon + contextual message (see UI section below).

---

## Map Pin Fuzzing

When displaying the map and the full address is not visible to the viewer:

1. Add a random offset to lat/lng: ±0.002 degrees (approximately ±200m).
2. Use the same offset deterministically per listing (seed with listing ID so it doesn't change on each page load — use a simple hash of the listing ID to pick the offset).
3. Show a circle overlay on the map (radius ~300m, semi-transparent navy) to communicate "approximate location".
4. When full address is revealed, remove the offset and circle overlay — show exact pin.

Utility function: `src/lib/geo.ts`

```typescript
export function fuzzCoordinates(
  lat: number,
  lng: number,
  seed: string
): { lat: number; lng: number } {
  // Use seed to deterministically generate offset in range [-0.002, +0.002]
  // Use a simple numeric hash of seed string to derive two floats
}
```

---

## API Changes

### Address Serialisation Helper

Create `src/lib/listing-serializer.ts`:

```typescript
export function serializeListingAddress(
  listing: ListingWithAddress,
  viewer: { userId?: string; isVerified?: boolean; hasBooking?: boolean; isSeller?: boolean }
): SerializedAddress {
  // Returns full address or suburb-only based on addressVisibility + viewer context
  // Returns fuzzed or exact coordinates accordingly
}
```

All API routes that return listing data must use this helper to determine what address to expose. Never conditionally include address fields ad hoc in individual routes.

### `GET /api/listings/[id]`

Update to use `serializeListingAddress`. Include `addressVisibility` in the response so the client knows whether the lock UI should be shown and what action unlocks it.

### `GET /api/listings` (search)

Search results show suburb-only for listings with `LOGGED_IN` or `BOOKED_ONLY` visibility when the viewer is anonymous. Full address shown for logged-in viewers (per rules table above).

Do NOT expose precise coordinates in search results when the viewer is anonymous — return fuzzed coordinates only.

### Structured Data / SEO

When rendering `<script type="application/ld+json">` for the listing page, omit `streetAddress` from the `schema.org/Residence` structured data if the viewer doesn't have visibility. Only include suburb, state, postcode in the structured data for anonymous requests.

---

## UI — Lock Indicator on Listing Page

File: `src/app/listings/[id]/page.tsx`

When the full address is not visible, show a contextual message below where the address would normally appear:

**For `LOGGED_IN` listings (viewer is anonymous):**

```
📍  Floreat, WA 6014
    [Log in to see the full address]
```

**For `BOOKED_ONLY` listings (viewer is logged in but hasn't booked):**

```
📍  Floreat, WA 6014
    Address revealed after booking an inspection
    [Book an Inspection]
```

**For `BOOKED_ONLY` listings (viewer has a confirmed booking):**

```
📍  14 Eucalyptus Way, Floreat WA 6014  ✓ (address revealed — you have an inspection booking)
```

The lock indicator should be subtle but informative. It should never feel punitive — frame it as a feature that protects the seller and ensures serious interest.

---

## UI — Seller Listing Setup

### Create Listing Flow

File: `src/app/listings/create/method/page.tsx` (or an additional step)

Add address visibility selector:

```
┌──────────────────────────────────────────────┐
│  Address Privacy                             │
│                                              │
│  Who can see your full street address?       │
│                                              │
│  ○ Anyone (public)                           │
│    Visible to all internet visitors.         │
│                                              │
│  ● Logged-in users only  (recommended)       │
│    Hidden from search engines and            │
│    anonymous browsing.                       │
│                                              │
│  ○ Inspection bookings only                  │
│    Only revealed after a buyer books         │
│    (or attends) an inspection.               │
│    Best for: maximum privacy.                │
└──────────────────────────────────────────────┘
```

### Seller Dashboard — Listing Settings

File: `src/app/(dashboard)/dashboard/listings/[id]/settings/page.tsx` (created in Task 04)

Add `addressVisibility` control to the settings page. Changing it takes effect immediately.

---

## Listing Card in Search Results

File: `src/components/listings/ListingCard.tsx`

When a listing has `addressVisibility = BOOKED_ONLY` or `LOGGED_IN` and the current viewer is anonymous:
- Show suburb + state only (no street address).
- Show the fuzzed map pin on any map view.
- Do NOT show a lock icon on the search results card — keep it clean. The lock is only shown on the listing detail page.

---

## Tests Required

### Unit
- `serializeListingAddress` — all combinations of visibility × viewer type from the rules table.
- `fuzzCoordinates` — same seed always produces same offset; offset is within ±0.002 degrees; different seeds produce different offsets.
- Structured data omits street address for anonymous viewers.

### API Integration
- `GET /api/listings/[id]` as anonymous — `LOGGED_IN` listing returns suburb only, no street.
- `GET /api/listings/[id]` as logged-in user — `LOGGED_IN` listing returns full address.
- `GET /api/listings/[id]` as verified buyer with booking — `BOOKED_ONLY` listing returns full address.
- `GET /api/listings/[id]` as verified buyer without booking — `BOOKED_ONLY` listing returns suburb only.
- `GET /api/listings/[id]` as the listing's seller — always returns full address regardless of visibility setting.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add `AddressVisibility` enum; add `addressVisibility` field to `Listing` |
| `src/lib/listing-serializer.ts` | Create — address serialisation helper |
| `src/lib/geo.ts` | Create — `fuzzCoordinates` utility |
| `src/app/api/listings/[id]/route.ts` | Use `serializeListingAddress` |
| `src/app/api/listings/route.ts` | Use `serializeListingAddress` in search results |
| `src/app/listings/[id]/page.tsx` | Add lock indicator and fuzzed map |
| `src/components/listings/ListingCard.tsx` | Suburb-only display for anonymous viewers |
| `src/app/listings/create/method/page.tsx` | Add `addressVisibility` selector |
| `src/app/(dashboard)/dashboard/listings/[id]/settings/page.tsx` | Add visibility control (Task 04 creates this file) |
| `src/lib/listing-serializer.test.ts` | Create tests |
| `src/lib/geo.test.ts` | Create tests |

# Task 04 — Offer Gating by Inspection Attendance

## Goal

Allow sellers to require that a buyer has physically attended an inspection before they can place an offer. This filters out speculative, uninformed offers and ensures the offer board represents genuine, qualified interest.

## Background

This task depends on:
- Task 01 (Listing Lifecycle) — uses listing status model.
- Task 02 (Inspection Slots) — `requireInspection` field added to `Listing`.
- Task 03 (Inspection Bookings) — `InspectionBooking.status = ATTENDED` is the gate.

---

## How It Works

When `listing.requireInspection = true`:

1. Buyers cannot submit an offer unless they have at least one `InspectionBooking` with `status = ATTENDED` for a slot on that listing.
2. The offer form on the listing page is locked with a clear explanation and a link to book an inspection.
3. Once the seller marks the buyer as `ATTENDED`, the offer form unlocks for that buyer.
4. Open House attendees are not automatically marked as attended — the seller must mark them manually via a separate flow (see below).
5. If `requireInspection = false` (the default), the offer form behaves exactly as it did before this task.

---

## Database Changes

No new models. The `requireInspection Boolean @default(false)` field was added to `Listing` in Task 02.

---

## API Changes

### `POST /api/offers` — Updated Pre-conditions

Add one additional check after the existing verification check:

```
8a. Inspection gate check:
    If listing.requireInspection = true:
      Query for any InspectionBooking where:
        - buyerId = current user
        - slot.listingId = listing.id
        - status = ATTENDED
      If none found:
        Return 403 with:
        {
          error: "You must attend an inspection before placing an offer on this property.",
          code: "INSPECTION_REQUIRED",
          slots: [{ id, startTime, endTime, spotsRemaining }]  // next 3 upcoming slots
        }
```

The `slots` array in the error response allows the frontend to immediately show booking options without a separate API call.

---

### `GET /api/listings/[id]` — Updated Response

When the authenticated user is viewing a listing with `requireInspection = true`, include their inspection status:

```typescript
{
  listing: { ... },
  viewer: {
    hasInspected: boolean  // true if they have an ATTENDED booking for any slot on this listing
    hasUpcomingBooking: boolean  // true if they have a CONFIRMED booking in the future
    upcomingBookingSlot: {       // present if hasUpcomingBooking = true
      id: string
      startTime: string
      endTime: string
    } | null
  }
}
```

This allows the listing page to show contextual messaging without additional API calls.

---

## UI — Offer Form Gating

File: `src/components/listings/OfferForm.tsx`

Add a `gatedByInspection` prop. When true and the buyer hasn't inspected:

Replace the offer form entirely with a gated state panel:

```
┌──────────────────────────────────────────────┐
│  🔒  Inspection Required                     │
│                                              │
│  The seller requires you to attend an        │
│  inspection before placing an offer.         │
│                                              │
│  [You have a booking for Sat 5 Apr 10:00 AM] │
│  — OR —                                      │
│  NEXT AVAILABLE INSPECTIONS                  │
│  · Sat 5 Apr · 10:00–10:30 AM · 2 spots     │
│  · Sat 5 Apr · 11:00–11:30 AM · 4 spots     │
│                                              │
│  [Book an Inspection]                        │
└──────────────────────────────────────────────┘
```

States:
- **No bookings, slots available**: Show upcoming slots with "Book an Inspection" CTA.
- **No bookings, no slots available**: "No upcoming inspections are scheduled. Save this listing to be notified when new inspections are added."
- **Has a confirmed (not yet attended) booking**: "You have an inspection booked for [Date] at [Time]. Once you've attended, your offer form will unlock."
- **Has attended (inspection gate satisfied)**: Show the normal offer form (no gate message).
- **requireInspection = false**: Show normal offer form (no gate at all).

---

## UI — Seller Listing Setup

### Create Listing Flow

File: `src/app/listings/create/method/page.tsx`

On the sale method selection step, add a toggle after the method selector:

```
┌──────────────────────────────────────────────┐
│  Offer Settings                              │
│                                              │
│  ☐ Require buyers to attend an inspection   │
│    before placing an offer                   │
│                                              │
│    Recommended for sellers who want to       │
│    ensure all offers come from buyers who    │
│    have seen the property in person.         │
└──────────────────────────────────────────────┘
```

This maps to `requireInspection` on the listing.

### Seller Dashboard — Listing Settings

Create: `src/app/(dashboard)/dashboard/listings/[id]/settings/page.tsx`

A simple settings page where the seller can toggle `requireInspection` after listing creation. Changing this setting on a `ACTIVE` listing with existing offers shows a warning: "This listing already has offers. Changing this setting will not affect existing offers."

---

## UI — Seller Dashboard — Open House Attendance

For Open House slots (no booking required), the seller still needs a way to mark which buyers attended so they can place offers.

Extend: `src/app/(dashboard)/dashboard/listings/[id]/inspections/page.tsx`

Add a section for COMPLETED Open House slots:

```
┌────────────────────────────────────────────────┐
│  Open House — Sat 29 Mar · 2:00–3:00 PM       │
│  Status: Completed                             │
│                                                │
│  Mark attendees:                               │
│  Enter email addresses of buyers who attended  │
│  to unlock offer placement for them.           │
│                                                │
│  [Email address input]  [Add Attendee]         │
│                                                │
│  Attendees marked (2):                         │
│  · alice@email.com — Alice Johnson (Verified)  │
│  · bob@email.com — Not found / Unregistered    │
│    (Will unlock when they register)            │
└────────────────────────────────────────────────┘
```

### API Route for Open House Attendance

`POST /api/listings/[id]/inspections/[slotId]/open-house-attendance`

Seller only. Body: `{ email: string }`.

Logic:
1. Verify seller auth.
2. Verify slot is an `OPEN_HOUSE` type and `COMPLETED` status (or IN_PROGRESS).
3. Look up user by email.
4. If user found: create an `InspectionBooking` record with `status = ATTENDED` and `attendedAt = now()`. This is a synthetic booking (not from the normal booking flow).
5. If user not found: store the email in a pending attendance list (new model below) — when that email registers, auto-create the booking.

```prisma
model PendingInspectionAttendance {
  id        String   @id @default(cuid())
  slotId    String
  slot      InspectionSlot @relation(fields: [slotId], references: [id], onDelete: Cascade)
  email     String
  createdAt DateTime @default(now())

  @@unique([slotId, email])
  @@index([email])  // For lookup when a new user registers
}
```

When a new user registers (in `POST /api/auth/register`), check `PendingInspectionAttendance` for their email and auto-create the attended booking records.

---

## Offer Board — Visual Indicator

File: `src/components/listings/OfferBoard.tsx`

When `listing.requireInspection = true`, add a small notice below the board header:

```
ℹ  Inspection required to offer on this property
```

This is public-facing information — buyers browsing the board understand why the "Place an Offer" button may be gated for them.

---

## Tests Required

### Unit
- `hasInspectedListing(userId, listingId)` helper — returns true only when ATTENDED booking exists.
- Open house attendance flow — email lookup, pending record creation.

### API Integration
- `POST /api/offers` when `requireInspection = true` and no ATTENDED booking — 403 `INSPECTION_REQUIRED`.
- `POST /api/offers` when `requireInspection = true` and ATTENDED booking exists — 201 (offer placed).
- `POST /api/offers` when `requireInspection = false` — 201 (no inspection check).
- `GET /api/listings/[id]` as authenticated buyer with attended booking — `viewer.hasInspected = true`.
- Open house attendance: mark existing user as attended — creates synthetic booking.
- Open house attendance: mark unknown email — creates `PendingInspectionAttendance`.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add `PendingInspectionAttendance` model; add relation to `InspectionSlot` |
| `src/app/api/offers/route.ts` | Add inspection gate pre-condition |
| `src/app/api/listings/[id]/route.ts` | Include `viewer.hasInspected` in response |
| `src/app/api/listings/[id]/inspections/[slotId]/open-house-attendance/route.ts` | Create |
| `src/app/api/auth/register/route.ts` | Check `PendingInspectionAttendance` on new registration |
| `src/components/listings/OfferForm.tsx` | Add gated state panel |
| `src/components/listings/OfferBoard.tsx` | Add "inspection required" notice |
| `src/app/listings/create/method/page.tsx` | Add `requireInspection` toggle |
| `src/app/(dashboard)/dashboard/listings/[id]/settings/page.tsx` | Create |
| `src/app/(dashboard)/dashboard/listings/[id]/inspections/page.tsx` | Extend with open house attendance UI |
| `src/app/api/listings/[id]/inspections/[slotId]/open-house-attendance/route.test.ts` | Create tests |

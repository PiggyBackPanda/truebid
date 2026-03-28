# Task 02 — Inspection Slot Management (Seller)

## Goal

Allow sellers to create, publish, and manage inspection time slots directly on their listing. Two modes: open house (anyone can attend, no booking) and scheduled inspection (fixed capacity, booking required). Buyers see upcoming inspections on the listing page.

## Background

Without an agent, sellers risk being overwhelmed by large crowds at home opens. This feature gives sellers professional-grade scheduling tools: define time slots, cap group sizes, and manage who's coming — all without needing a third party.

---

## New Database Models

Add to `prisma/schema.prisma`:

```prisma
enum InspectionType {
  OPEN_HOUSE        // Public, no booking required, anyone can attend
  SCHEDULED         // Booking required, capped capacity per slot
}

enum InspectionSlotStatus {
  SCHEDULED         // Upcoming — accepting bookings (if SCHEDULED type)
  IN_PROGRESS       // Currently happening (within the time window)
  COMPLETED         // Past — no longer accepting bookings
  CANCELLED         // Seller cancelled this slot
}

model InspectionSlot {
  id              String               @id @default(cuid())

  listingId       String
  listing         Listing              @relation(fields: [listingId], references: [id], onDelete: Cascade)

  type            InspectionType       @default(SCHEDULED)
  status          InspectionSlotStatus @default(SCHEDULED)

  // Time window
  startTime       DateTime             // UTC
  endTime         DateTime             // UTC

  // Capacity (only applies to SCHEDULED type — ignored for OPEN_HOUSE)
  maxGroups       Int                  @default(4)  // Max simultaneous groups

  // Optional seller note shown to bookers (e.g., "Park on the street, not the driveway")
  notes           String?

  // Timestamps
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  // Relations
  bookings        InspectionBooking[]

  @@index([listingId])
  @@index([listingId, startTime])
  @@index([startTime])
  @@index([status])
}
```

Also add to the `Listing` model in `prisma/schema.prisma`:

```prisma
// Add to Listing model relations
inspectionSlots   InspectionSlot[]

// Add to Listing model fields
requireInspection Boolean         @default(false)  // Task 04 — gate offers behind inspection attendance
```

---

## API Routes

### `GET /api/listings/[id]/inspections`

Returns all upcoming (SCHEDULED status, future startTime) inspection slots for a listing.

**Public endpoint** — no auth required.

Response shape:

```typescript
{
  slots: Array<{
    id: string
    type: InspectionType
    startTime: string   // ISO 8601 UTC
    endTime: string     // ISO 8601 UTC
    availableSpots: number | null  // null for OPEN_HOUSE; (maxGroups - confirmedBookings) for SCHEDULED
    isFull: boolean
    notes: string | null
  }>
}
```

Do NOT expose: `maxGroups` raw value, booking details, seller info, or `listingId` (already in URL).

---

### `POST /api/listings/[id]/inspections`

Creates a new inspection slot. Seller only.

**Auth required.** Must be the listing's seller. Returns 403 if not.

Listing must be in `DRAFT`, `COMING_SOON`, `INSPECTIONS_OPEN`, or `ACTIVE` status. Returns 400 with `LISTING_NOT_EDITABLE` if not.

Request body:

```typescript
{
  type: "OPEN_HOUSE" | "SCHEDULED"
  startTime: string   // ISO 8601 — must be in the future
  endTime: string     // ISO 8601 — must be after startTime
  maxGroups?: number  // Required if type = SCHEDULED. Range: 1–20.
  notes?: string      // Max 300 chars
}
```

Validation rules:
- `startTime` must be at least 2 hours in the future.
- `endTime` must be after `startTime` and within 4 hours of it (slots can't be 5+ hours long).
- No overlapping slots allowed for the same listing (check existing SCHEDULED/IN_PROGRESS slots).
- Maximum 20 slots per listing across all time.
- `maxGroups` required for SCHEDULED type; ignored for OPEN_HOUSE.

On success:
- Creates the slot with status `SCHEDULED`.
- If listing is currently `COMING_SOON`, **automatically transition the listing to `INSPECTIONS_OPEN`** (first slot added signals readiness).
- Return 201 with the created slot.

---

### `PATCH /api/listings/[id]/inspections/[slotId]`

Edit or cancel a slot. Seller only.

**Auth required.** Must be listing's seller.

Allowed actions:
- Update `notes` on any non-COMPLETED/CANCELLED slot.
- Update `maxGroups` if no confirmed bookings yet.
- Update `startTime` / `endTime` if no confirmed bookings yet. Same validation rules as create.
- Cancel: set `{ status: "CANCELLED" }`. Can cancel any slot that isn't COMPLETED or already CANCELLED.

When a slot is cancelled with confirmed bookings:
- Trigger cancellation emails to all confirmed bookers (see email spec below).
- Set all bookings for this slot to status `CANCELLED`.

---

### `DELETE /api/listings/[id]/inspections/[slotId]`

Hard delete only if slot has zero bookings. Otherwise use PATCH to cancel (keeps audit trail).

If the deleted/last-cancelled slot removal leaves the listing with zero SCHEDULED slots:
- If listing status is `INSPECTIONS_OPEN`, revert to `COMING_SOON`.

---

## UI — Seller Dashboard (Inspection Management)

Create: `src/app/(dashboard)/dashboard/listings/[id]/inspections/page.tsx`

This page is the seller's inspection management screen. Access via the listing detail in their dashboard.

### Layout

```
┌────────────────────────────────────────────────┐
│  Inspections — 14 Eucalyptus Way               │
│  [+ Add Open House]  [+ Add Scheduled Slot]    │
├────────────────────────────────────────────────┤
│  UPCOMING (3)                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Sat 5 Apr · 10:00 – 10:30 AM           │  │
│  │  SCHEDULED · 2 / 4 spots booked         │  │
│  │  [View Bookings]  [Edit]  [Cancel]       │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Sat 5 Apr · 11:00 – 11:30 AM           │  │
│  │  SCHEDULED · 0 / 4 spots booked         │  │
│  │  [View Bookings]  [Edit]  [Cancel]       │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Sun 6 Apr · 2:00 – 3:00 PM             │  │
│  │  OPEN HOUSE · No booking required        │  │
│  │  [Edit]  [Cancel]                        │  │
│  └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│  PAST (1)                                      │
│  ...                                           │
└────────────────────────────────────────────────┘
```

### Add Slot Modal / Drawer

Fields:
- Type selector: "Scheduled (book a time)" | "Open House (walk in)"
- Date picker (calendar, min = tomorrow)
- Start time selector (30-min increments, 8 AM – 7 PM)
- Duration selector (15 / 20 / 30 / 45 / 60 min)
- End time calculated and displayed automatically
- Max groups (SCHEDULED only): stepper 1–20, default 4
- Notes textarea (optional, 300 char max)

On submit: POST to the API route. On success, close modal and refresh slot list.

---

## UI — Public Listing Page

File: `src/app/listings/[id]/page.tsx`

Add an "Inspections" section below the property description and above the offer board (or in its place when status is `INSPECTIONS_OPEN`).

### Coming Soon / Inspections Open states

Display upcoming slots as cards:

```
┌──────────────────────────────────────────────┐
│  UPCOMING INSPECTIONS                        │
│                                              │
│  Sat 5 Apr — 10:00–10:30 AM                 │
│  Scheduled  ·  2 spots remaining             │
│  [Book This Inspection]                      │
│                                              │
│  Sat 5 Apr — 11:00–11:30 AM                 │
│  Scheduled  ·  4 spots remaining             │
│  [Book This Inspection]                      │
│                                              │
│  Sun 6 Apr — 2:00–3:00 PM                   │
│  Open House  ·  No booking required          │
│  [Add to Calendar]                           │
└──────────────────────────────────────────────┘
```

- Slot cards are visible to all users (logged in or not).
- "Book This Inspection" requires login → redirect to `/login?next=/listings/[id]` if not logged in.
- Full slots show "Fully Booked" badge and no Book button (but Add to Calendar still shown).
- Open House slots never show "Full" — just show "Add to Calendar".
- "Add to Calendar" generates a `.ics` file download (or Google Calendar link) with the property address.

### Active state

When status is `ACTIVE`, show the inspection section above the offer board with a condensed view ("Next inspection: Sat 5 Apr 10:00 AM · [View all]").

---

## Email Notifications

Use the existing email system in `src/lib/email.ts`.

| Trigger | Recipients | Template name |
|---|---|---|
| Slot created | No email — seller knows, no buyer has booked yet | — |
| Slot cancelled (with bookings) | All confirmed bookers for that slot | `inspection-slot-cancelled` |
| Listing status changes to `INSPECTIONS_OPEN` | All users who saved/watched the listing | `listing-inspections-open` |

Template content:

**`inspection-slot-cancelled`**: "Hi [Name], your inspection booking at [Address] on [Date] at [Time] has been cancelled by the seller. Please check the listing for alternative times."

**`listing-inspections-open`**: "Hi [Name], a listing you saved is now accepting inspection bookings. [Address] has [N] inspection slots available. [View Listing →]"

---

## Tests Required

### Unit
- Slot overlap detection logic.
- Slot capacity calculation (`maxGroups - confirmedBookings`).
- Auto-transition: listing to `INSPECTIONS_OPEN` when first slot added.
- Auto-revert: listing to `COMING_SOON` when last slot removed/cancelled.

### API Integration
- `POST` creates slot, returns 201.
- Overlapping slot rejected with 400.
- Non-seller POST returns 403.
- Last slot cancelled → listing reverts to `COMING_SOON`.
- First slot added to `COMING_SOON` listing → listing transitions to `INSPECTIONS_OPEN`.
- Cancel slot with bookings → booking cancellation emails sent.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add `InspectionSlot`, `InspectionType`, `InspectionSlotStatus` enums and model; add `requireInspection` and `inspectionSlots` to `Listing` |
| `src/app/api/listings/[id]/inspections/route.ts` | Create (GET, POST) |
| `src/app/api/listings/[id]/inspections/[slotId]/route.ts` | Create (PATCH, DELETE) |
| `src/app/(dashboard)/dashboard/listings/[id]/inspections/page.tsx` | Create |
| `src/components/dashboard/InspectionSlotCard.tsx` | Create |
| `src/components/dashboard/AddInspectionSlotModal.tsx` | Create |
| `src/components/listings/InspectionSlotList.tsx` | Create (public listing view) |
| `src/app/listings/[id]/page.tsx` | Add inspection section |
| `src/lib/email.ts` | Add new email templates |
| `src/lib/validation.ts` | Add inspection slot Zod schema |
| `src/app/api/listings/[id]/inspections/route.test.ts` | Create tests |

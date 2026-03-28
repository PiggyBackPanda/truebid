# Task 03 — Inspection Booking System (Buyer)

## Goal

Allow buyers to book a time slot for a scheduled inspection. The seller receives a structured schedule of who is attending and when, with names and contact details. Includes check-in marking (seller marks attendance), confirmation/reminder emails, and calendar export.

## Background

This task depends on Task 02 (Inspection Slots). The `InspectionSlot` model must exist before implementing bookings. The `InspectionBooking` model created here is also a prerequisite for Task 04 (Offer Gating).

---

## New Database Model

Add to `prisma/schema.prisma`:

```prisma
enum InspectionBookingStatus {
  CONFIRMED         // Booking is active — buyer is expected to attend
  CANCELLED         // Buyer cancelled, or seller cancelled the slot
  ATTENDED          // Seller has marked this buyer as having attended
  NO_SHOW           // Buyer didn't show up (seller marked them)
}

model InspectionBooking {
  id          String                   @id @default(cuid())

  slotId      String
  slot        InspectionSlot           @relation(fields: [slotId], references: [id], onDelete: Cascade)

  buyerId     String
  buyer       User                     @relation(fields: [buyerId], references: [id], onDelete: Cascade)

  status      InspectionBookingStatus  @default(CONFIRMED)

  // Buyer's note to the seller (optional — e.g., "Bringing my partner and building inspector")
  note        String?

  // When the seller marked attendance
  attendedAt  DateTime?
  markedNoShowAt DateTime?

  // Cancellation
  cancelledAt DateTime?
  cancelledBy String?   // "buyer" | "seller"

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([slotId, buyerId])  // One booking per buyer per slot
  @@index([slotId])
  @@index([buyerId])
  @@index([status])
}
```

Also add to the `User` model relations:

```prisma
inspectionBookings  InspectionBooking[]
```

---

## API Routes

### `POST /api/listings/[id]/inspections/[slotId]/bookings`

Book a slot. Buyer only.

**Auth required.** Buyer must be logged in (401 if not).

**Verification required.** Buyer's `verificationStatus` must be `VERIFIED`. Return 403 with `VERIFICATION_REQUIRED` if not. Rationale: sellers need verified identities for their own safety when inviting strangers to their home.

Pre-conditions (validate in order):
1. Slot exists and belongs to the listing — 404 if not.
2. Slot status is `SCHEDULED` — return 400 `SLOT_NOT_AVAILABLE` if COMPLETED, CANCELLED, IN_PROGRESS.
3. Slot's `startTime` is in the future — return 400 `SLOT_PASSED`.
4. Slot type is `SCHEDULED` (OPEN_HOUSE slots don't use this endpoint — return 400 `NO_BOOKING_REQUIRED`).
5. Buyer hasn't already booked this slot — return 409 `ALREADY_BOOKED`.
6. Buyer is not the listing's seller — return 403 `CANNOT_BOOK_OWN_LISTING`.
7. Slot is not full: `confirmedBookings < maxGroups` — return 409 `SLOT_FULL` with `{ spotsRemaining: 0 }`.

On success:
- Create `InspectionBooking` with status `CONFIRMED`.
- Send confirmation email to buyer (template: `inspection-booking-confirmed`).
- Send notification email to seller (template: `inspection-new-booking`).
- Return 201 with booking details.

Response shape:

```typescript
{
  booking: {
    id: string
    slotId: string
    startTime: string   // ISO 8601
    endTime: string     // ISO 8601
    address: string     // Full address (now revealed to the booked buyer)
    status: "CONFIRMED"
    note: string | null
  }
}
```

---

### `DELETE /api/listings/[id]/inspections/[slotId]/bookings/[bookingId]`

Cancel a booking. Buyer cancels their own booking.

**Auth required.** Must be the booking's buyer (403 if not).

Only allowed if slot's `startTime` is more than 2 hours away. Return 400 `TOO_LATE_TO_CANCEL` if less than 2 hours before.

On success:
- Set status to `CANCELLED`, set `cancelledAt`, set `cancelledBy` to `"buyer"`.
- Send cancellation notification to seller (template: `inspection-booking-cancelled`).
- Return 200 `{ success: true }`.

---

### `GET /api/listings/[id]/inspections/[slotId]/bookings`

Get all bookings for a slot. Seller only.

**Auth required.** Must be listing's seller (403 if not).

Response shape:

```typescript
{
  slot: {
    id: string
    startTime: string
    endTime: string
    maxGroups: number
    confirmedCount: number
    notes: string | null
  }
  bookings: Array<{
    id: string
    status: InspectionBookingStatus
    buyer: {
      firstName: string
      lastName: string
      email: string
      phone: string | null
      verificationStatus: VerificationStatus
    }
    note: string | null
    createdAt: string
  }>
}
```

---

### `PATCH /api/listings/[id]/inspections/[slotId]/bookings/[bookingId]/attendance`

Mark a buyer as attended or no-show. Seller only.

**Auth required.** Must be listing's seller.

Request body: `{ status: "ATTENDED" | "NO_SHOW" }`.

Rules:
- Slot's `startTime` must be in the past (can't mark attendance before the inspection time).
- Booking must currently be `CONFIRMED`.
- Setting `ATTENDED` sets `attendedAt = now()`.
- Setting `NO_SHOW` sets `markedNoShowAt = now()`.
- If `ATTENDED`: this is the trigger that unlocks offer placement for this buyer when Task 04's offer gating is enabled.

---

## UI — Buyer Booking Flow

### Listing Page — Booking Modal

File: `src/components/listings/InspectionSlotList.tsx` (created in Task 02)

When buyer clicks "Book This Inspection":
1. If not logged in → redirect to `/login?next=/listings/[id]`.
2. If not verified → show modal: "Identity verification required to book an inspection. [Verify My Identity →]" — links to `/dashboard/verify`.
3. If verified → show booking modal:
   - Slot details: date, time, address.
   - Optional note field (max 200 chars): "Anything the seller should know? (e.g. bringing a building inspector)"
   - [Confirm Booking] CTA.
   - On success: show confirmation message with iCal download link.

### Buyer's Inspection Bookings Page

Create: `src/app/(dashboard)/dashboard/inspections/page.tsx`

Shows all the buyer's upcoming and past inspection bookings.

```
┌──────────────────────────────────────────────┐
│  My Inspections                              │
├──────────────────────────────────────────────┤
│  UPCOMING                                    │
│  ┌──────────────────────────────────────────┐ │
│  │  14 Eucalyptus Way, Floreat              │ │
│  │  Sat 5 Apr · 10:00 – 10:30 AM           │ │
│  │  [Add to Calendar]  [Cancel Booking]     │ │
│  └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  PAST                                        │
│  ┌──────────────────────────────────────────┐ │
│  │  22 Kings Park Rd, West Perth            │ │
│  │  Sat 29 Mar · 11:00 – 11:30 AM          │ │
│  │  Status: Attended ✓                      │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

Add link to this page in the buyer navigation.

---

## UI — Seller Booking Schedule

File: `src/app/(dashboard)/dashboard/listings/[id]/inspections/page.tsx` (created in Task 02)

Extend the "View Bookings" action on each slot card to open a drawer:

```
┌────────────────────────────────────────────────┐
│  Bookings — Sat 5 Apr · 10:00–10:30 AM        │
│  2 of 4 spots confirmed                       │
├────────────────────────────────────────────────┤
│  Jane Smith                                   │
│  jane.smith@email.com · 0412 345 678          │
│  Identity Verified ✓                          │
│  Note: "Bringing my partner"                  │
│  [Mark Attended]  [Mark No-Show]              │
├────────────────────────────────────────────────┤
│  Tom Wilson                                   │
│  t.wilson@email.com · —                       │
│  Identity Verified ✓                          │
│  [Mark Attended]  [Mark No-Show]              │
└────────────────────────────────────────────────┘
```

After the inspection time has passed, show the attendance controls. Before the inspection, attendance controls are hidden.

---

## Calendar / iCal Export

Create: `src/app/api/inspections/[bookingId]/calendar/route.ts`

- GET endpoint (auth required — must be the booking's buyer).
- Returns a `.ics` file download with:
  - SUMMARY: "Property Inspection — [Address]"
  - DTSTART / DTEND: slot times
  - LOCATION: full property address
  - DESCRIPTION: "Your inspection booking for [address]. Booking reference: [id]"
- Also generate a Google Calendar deep-link URL for the "Add to Calendar" button.

---

## Reminder Emails

Create a background job or cron that runs every hour and sends reminder emails:

- **24 hours before** a CONFIRMED booking's `startTime`: send `inspection-reminder-24h` to the buyer.
- **2 hours before**: send `inspection-reminder-2h` to the buyer.

Track whether a reminder has been sent to avoid duplicates (add `reminder24hSentAt DateTime?` and `reminder2hSentAt DateTime?` to `InspectionBooking`).

---

## Email Templates

| Template | Recipient | Content |
|---|---|---|
| `inspection-booking-confirmed` | Buyer | "Your inspection is booked. [Address] on [Date] at [Time]. [Add to Calendar link]" |
| `inspection-new-booking` | Seller | "[Name] has booked your [Date] [Time] inspection at [Address]. They have been identity verified." |
| `inspection-booking-cancelled` | Seller | "[Name] has cancelled their booking for [Date] [Time] at [Address]. You now have [N] spots remaining." |
| `inspection-reminder-24h` | Buyer | "Reminder: You have an inspection tomorrow at [Address] at [Time]." |
| `inspection-reminder-2h` | Buyer | "Reminder: Your inspection at [Address] is in 2 hours ([Time])." |
| `inspection-slot-cancelled` | All confirmed buyers | (Defined in Task 02) |

---

## Tests Required

### Unit
- Booking capacity check (full slot vs available slot).
- "Too late to cancel" time check.
- Attendance marking only allowed after slot start time.

### API Integration
- `POST` booking by verified buyer — 201.
- `POST` booking by unverified buyer — 403 `VERIFICATION_REQUIRED`.
- `POST` on full slot — 409 `SLOT_FULL`.
- `POST` duplicate booking — 409 `ALREADY_BOOKED`.
- `DELETE` cancellation with > 2 hrs to go — 200.
- `DELETE` cancellation with < 2 hrs to go — 400 `TOO_LATE_TO_CANCEL`.
- `GET` bookings by non-seller — 403.
- Attendance marked before slot time — 400.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add `InspectionBooking`, `InspectionBookingStatus`; add `inspectionBookings` relation to `User`; add reminder fields to `InspectionBooking` |
| `src/app/api/listings/[id]/inspections/[slotId]/bookings/route.ts` | Create (POST) |
| `src/app/api/listings/[id]/inspections/[slotId]/bookings/[bookingId]/route.ts` | Create (DELETE) |
| `src/app/api/listings/[id]/inspections/[slotId]/bookings/[bookingId]/attendance/route.ts` | Create (PATCH) |
| `src/app/api/listings/[id]/inspections/[slotId]/bookings/route.ts` | Extend with GET (seller) |
| `src/app/api/inspections/[bookingId]/calendar/route.ts` | Create (iCal) |
| `src/app/(dashboard)/dashboard/inspections/page.tsx` | Create (buyer view) |
| `src/components/listings/BookInspectionModal.tsx` | Create |
| `src/components/dashboard/BookingScheduleDrawer.tsx` | Create |
| `src/lib/email.ts` | Add new templates |
| `src/lib/ical.ts` | Create iCal generator utility |
| `src/app/api/listings/[id]/inspections/[slotId]/bookings/route.test.ts` | Create tests |

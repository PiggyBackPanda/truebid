# Inspection & Privacy Feature — Task Index

Five tasks, designed to be executed in dependency order. Each task is self-contained with its own schema changes, API routes, UI components, and test requirements.

---

## Tasks

| # | Task | Description | Depends On |
|---|---|---|---|
| 01 | [Listing Status Lifecycle](task-01-listing-lifecycle.md) | Extend listing status to `COMING_SOON` → `INSPECTIONS_OPEN` → `ACTIVE`. Update offer guards and seller dashboard. | — |
| 02 | [Inspection Slot Management](task-02-inspection-slots.md) | Seller creates/manages time slots (open house or scheduled). Public display on listing page. Auto-transitions listing status. | Task 01 |
| 03 | [Inspection Booking System](task-03-inspection-bookings.md) | Buyer books a slot. Seller sees schedule with names. Attendance marking. Confirmation/reminder emails. Calendar export. | Task 02 |
| 04 | [Offer Gating by Inspection](task-04-offer-gating.md) | `requireInspection` flag. Locks offer form until seller marks buyer as attended. Open house manual attendance. | Task 02, 03 |
| 05 | [Address Privacy Controls](task-05-address-privacy.md) | `addressVisibility` field. Suburb-only display for anonymous/unqualified viewers. Map pin fuzzing. Revealed after booking. | Task 02, 03 |

---

## Key Design Decisions

- **Offer gating is opt-in.** `requireInspection` defaults to `false`. Sellers who want to run an open, unrestricted offer period still can.
- **Address privacy defaults to `LOGGED_IN`.** A reasonable middle ground — hides from search engines and anonymous browsing, but doesn't require a booking to see the street address.
- **BOOKED_ONLY listings with no slots fall back to LOGGED_IN.** Avoids deadlock where a buyer can't see the address but also can't book to get it.
- **Open House attendance is manual.** Sellers mark who attended after the fact, creating a synthetic booking record. This unlocks offers for those buyers.
- **Withdrawn offers remain visible.** No change from existing spec — this is a deliberate transparency feature.
- **Anti-snipe is unchanged.** All existing Open Offers logic applies normally once a listing is ACTIVE.

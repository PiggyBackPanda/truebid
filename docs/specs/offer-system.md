# TrueBid — Open Offers System Specification

## Overview

The Open Offers system is TrueBid's core differentiating feature. It is a transparent, real-time public bidding system where buyers place offers on a property, all offers are visible to the public (with pseudonymous buyer identities), and a countdown timer closes the bidding period — with anti-snipe protection that extends the closing time when late offers arrive.

This spec covers the complete system: offer lifecycle, state machine, anti-snipe logic, ranking algorithm, WebSocket protocol, and all edge cases.

---

## 1. Offer Lifecycle — State Machine

An offer goes through strictly defined states. Invalid transitions must be rejected.

### States

```
ACTIVE      — Live on the offer board, ranked by amount
WITHDRAWN   — Buyer chose to remove their offer (remains visible, strikethrough)
ACCEPTED    — Seller accepted this offer
REJECTED    — Seller rejected this offer, or another offer was accepted
EXPIRED     — Listing was withdrawn/expired before offer was resolved
```

### Valid Transitions

```
ACTIVE → ACTIVE       (amount increased — same state, new amount recorded in OfferHistory)
ACTIVE → WITHDRAWN    (buyer withdraws)
ACTIVE → ACCEPTED     (seller accepts this specific offer)
ACTIVE → REJECTED     (seller rejects, or seller accepts a different offer)
ACTIVE → EXPIRED      (listing withdrawn or closing date passed without acceptance)
```

### Invalid Transitions (reject with 400)

```
WITHDRAWN → ACTIVE    (cannot un-withdraw — must place a new offer)
WITHDRAWN → anything  (terminal state)
ACCEPTED → anything   (terminal state)
REJECTED → anything   (terminal state)
EXPIRED → anything    (terminal state)
```

### Transition Rules

**ACTIVE → ACTIVE (increase):**
- New amount must be strictly greater than current amount (not equal).
- Create an OfferHistory record with the previous amount before updating.
- Conditions CAN be changed during an increase (e.g., buyer upgrades from "subject to finance" to "unconditional").
- If conditions change, record the previous condition in OfferHistory.
- Settlement days CAN be changed during an increase.
- Emit `offer:updated` WebSocket event.
- Check anti-snipe trigger (see section 3).

**ACTIVE → WITHDRAWN:**
- Set status to `WITHDRAWN`, set `withdrawnAt` timestamp.
- The offer row REMAINS on the public board. Display with strikethrough styling and greyed-out text. This is deliberate — it shows the market that someone withdrew, which is information.
- Emit `offer:withdrawn` WebSocket event.
- Do NOT trigger anti-snipe (withdrawal is not a new offer).

**ACTIVE → ACCEPTED:**
- Set status to `ACCEPTED`, set `acceptedAt` timestamp.
- Change listing status to `UNDER_OFFER`.
- All OTHER active offers on this listing: set status to `REJECTED`, set `rejectedAt` timestamp.
- Emit `offer:accepted` WebSocket event (broadcast to all viewers).
- Send email to winning buyer: "Your offer of $X has been accepted by the seller."
- Send email to all rejected buyers: "The seller has accepted another offer on [address]. Your offer of $X was not selected."
- The seller is NOT obligated to accept the highest offer. They can accept any offer for any reason (e.g., prefer unconditional over subject-to-finance, prefer shorter settlement).

**ACTIVE → REJECTED:**
- Set status to `REJECTED`, set `rejectedAt` timestamp.
- Emit no public WebSocket event (rejection of individual offers is private — only acceptance is broadcast).
- Send email to rejected buyer.

**ACTIVE → EXPIRED:**
- Triggered automatically when a listing is withdrawn or expires.
- Batch update all active offers on that listing to EXPIRED.
- No individual notifications needed — the listing withdrawal/expiry notification covers it.

---

## 2. Offer Placement — Validation Rules

When a buyer submits a new offer via `POST /api/offers`, apply these validations in order:

### Pre-conditions (reject before processing)

1. **User authenticated** — Return 401 if not.
2. **User verified** — verificationStatus must be `VERIFIED`. Return 403 with code `VERIFICATION_REQUIRED` if not.
3. **Listing exists** — Return 404 if not.
4. **Listing is ACTIVE** — Return 400 with code `LISTING_NOT_ACTIVE` if status is not ACTIVE.
5. **Listing uses OPEN_OFFERS or PRIVATE_OFFERS** — This endpoint handles both. For FIXED_PRICE listings, offers work differently (see section 8).
6. **Listing not past closing date** — If closingDate is in the past, return 400 with code `LISTING_CLOSED`.
7. **Not own listing** — buyerId must not equal listing.sellerId. Return 403 with code `CANNOT_BID_OWN_LISTING`.
8. **No existing offer** — Check for existing offer with same listingId and buyerId. If exists and is ACTIVE, return 409 with code `OFFER_EXISTS` and message "You already have an active offer on this listing. Use the increase endpoint to raise your offer."
9. **No existing offer** — If exists and is WITHDRAWN, allow a new offer (the buyer previously withdrew and is now re-entering).

### Amount validation

10. **Positive integer** — amountCents must be > 0. Return 400 if not.
11. **Minimum offer threshold** — If listing has minOfferCents set and the offer is for an OPEN_OFFERS listing, amountCents must be >= minOfferCents. Return 400 with code `BELOW_MINIMUM` and include the minimum amount in the error details.
12. **Reasonable range** — amountCents must be <= 100_000_000_00 (i.e., $100 million in cents). This prevents accidental or malicious absurd values.

### Condition validation

13. **Valid condition type** — Must be one of the ConditionType enum values.
14. **Condition text required for OTHER** — If conditionType is `OTHER`, conditionText must be provided and between 1–500 characters.

### Settlement validation

15. **Valid settlement period** — settlementDays must be one of: 14, 21, 30, 45, 60, 90, 120. Return 400 if not.

### Processing (after all validations pass)

16. **Create the offer** in a database transaction:
    - Create Offer record with all validated fields.
    - Set isPublic to `true` for OPEN_OFFERS listings, `false` for PRIVATE_OFFERS.
    - Set status to `ACTIVE`.

17. **Check anti-snipe** (see section 3).

18. **Emit WebSocket event** `offer:new` to the listing's room with the PublicOffer shape.

19. **Send email to seller** — "A new offer of $X has been placed on your listing at [address]."

20. **Return the created offer** with 201 status.

---

## 3. Anti-Snipe Logic

### Purpose

Prevent "sniping" — the strategy of waiting until the final seconds before closing to place an offer, giving other buyers no time to respond. This mirrors live auction dynamics where bidding continues as long as there's activity.

### Algorithm

```
ANTI_SNIPE_WINDOW = 15 minutes
ANTI_SNIPE_EXTENSION = 15 minutes

function checkAntiSnipe(listing, eventType):
    // Only trigger on new offers and offer increases
    if eventType not in ["offer:new", "offer:updated"]:
        return  // Withdrawals do NOT trigger anti-snipe
    
    if listing.saleMethod != OPEN_OFFERS:
        return  // Only applies to Open Offers
    
    if listing.closingDate is null:
        return  // No closing date set
    
    now = current UTC timestamp
    timeUntilClose = listing.closingDate - now
    
    if timeUntilClose <= ANTI_SNIPE_WINDOW:
        // We're within the snipe window — extend!
        newClosingDate = now + ANTI_SNIPE_EXTENSION
        
        // Update in database
        UPDATE listing SET closingDate = newClosingDate
        
        // Emit event to all viewers
        emit("timer:extended", {
            listingId: listing.id,
            newClosingDate: newClosingDate.toISOString(),
            reason: "Anti-snipe: new activity within 15 minutes of closing"
        })
```

### Important Rules

- There is NO limit on extensions. If buyers keep bidding in the final 15 minutes, the closing keeps extending. This mirrors a real auction — bidding ends when bidding stops.
- The `originalClosingDate` field on the Listing stores the original closing date before any extensions. This is for display purposes ("Originally closing Apr 18, now extended to Apr 18 8:47 PM").
- Only ACTIVE listing events trigger anti-snipe. If the listing is already UNDER_OFFER, SOLD, or WITHDRAWN, no extension occurs.
- The extension is calculated from `now`, not from the current closing date. This prevents cumulative extensions from pushing the closing date out by hours if multiple offers arrive in quick succession. Each extension gives exactly 15 minutes from the moment of the triggering event.

### Edge Case: Server Clock

All time comparisons use UTC server time. Client countdown timers sync via the `timer:extended` WebSocket event. If the client clock drifts, the server is authoritative — the client should trust the server's closing date, not its own calculation.

---

## 4. Ranking Algorithm

### Public Board Ranking

Offers on the public board are ranked by amount descending (highest first). When amounts are equal, the earlier offer ranks higher (first-in advantage).

```sql
SELECT * FROM offers
WHERE listing_id = ? AND status = 'ACTIVE' AND is_public = true
ORDER BY amount_cents DESC, created_at ASC
```

Withdrawn offers are displayed below active offers, in their original rank position relative to other withdrawn offers, with strikethrough styling.

### Seller Dashboard Ranking

The seller sees all offers (including private ones for PRIVATE_OFFERS listings). The seller can sort by:

- **Amount** (default) — highest first
- **Conditions** — unconditional first, then subject-to-finance, then others
- **Settlement** — shortest first
- **Time** — newest first

The seller can also filter by:
- Status (active only, or all including withdrawn)
- Condition type

### Condition Weighting (Display Only)

The UI displays a visual indicator of offer "strength" based on a simple scoring system. This is calculated client-side and is purely informational — it does NOT affect ranking.

```typescript
function offerStrengthScore(offer: Offer): number {
  let score = 0;
  
  // Condition strength (0-40 points)
  switch (offer.conditionType) {
    case "UNCONDITIONAL": score += 40; break;
    case "SUBJECT_TO_BUILDING_PEST": score += 30; break;
    case "SUBJECT_TO_FINANCE": score += 20; break;
    case "SUBJECT_TO_BOTH": score += 10; break;
    case "SUBJECT_TO_SALE": score += 5; break;
    case "OTHER": score += 0; break;
  }
  
  // Settlement speed (0-20 points)
  if (offer.settlementDays <= 30) score += 20;
  else if (offer.settlementDays <= 45) score += 15;
  else if (offer.settlementDays <= 60) score += 10;
  else score += 5;
  
  return score;  // Max 60
}
```

Display this as a simple visual indicator (e.g., 1-3 filled dots or a colour-coded bar) next to each offer on the seller dashboard, with a tooltip explaining what it means.

---

## 5. WebSocket Protocol — Detailed

### Server Setup

The Socket.io server is created as a custom Next.js server in `server.ts` (or `src/lib/socket.ts` imported by a custom server). It shares the same HTTP port as Next.js.

```typescript
// server.ts (simplified)
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import next from "next";

const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new SocketServer(httpServer, {
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL },
    path: "/socket.io",
  });

  // Store io instance globally for API routes to use
  (global as any).__socketIO = io;

  io.on("connection", (socket) => {
    socket.on("join_listing", ({ listingId }) => {
      socket.join(`listing:${listingId}`);
      updatePresenceCount(io, listingId);
    });

    socket.on("leave_listing", ({ listingId }) => {
      socket.leave(`listing:${listingId}`);
      updatePresenceCount(io, listingId);
    });

    socket.on("disconnect", () => {
      // Socket.io handles room cleanup automatically
    });
  });

  // Presence count broadcast every 30 seconds
  setInterval(() => {
    io.sockets.adapter.rooms.forEach((sockets, room) => {
      if (room.startsWith("listing:")) {
        const listingId = room.replace("listing:", "");
        io.to(room).emit("presence:count", {
          listingId,
          count: sockets.size,
        });
      }
    });
  }, 30000);

  httpServer.listen(3000);
});
```

### Client Hook

Create a `useOfferBoard` hook that manages the WebSocket connection for a listing:

```typescript
// src/hooks/useOfferBoard.ts
function useOfferBoard(listingId: string, initialOffers: PublicOffer[]) {
  const [offers, setOffers] = useState(initialOffers);
  const [closingDate, setClosingDate] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.emit("join_listing", { listingId });

    socket.on("offer:new", ({ offer }) => {
      setOffers(prev => [...prev, offer].sort((a, b) => b.amountCents - a.amountCents));
    });

    socket.on("offer:updated", ({ offer }) => {
      setOffers(prev =>
        prev.map(o => o.id === offer.id ? offer : o)
          .sort((a, b) => b.amountCents - a.amountCents)
      );
    });

    socket.on("offer:withdrawn", ({ offerId }) => {
      setOffers(prev =>
        prev.map(o => o.id === offerId ? { ...o, status: "WITHDRAWN" } : o)
      );
    });

    socket.on("offer:accepted", ({ offerId }) => {
      setOffers(prev =>
        prev.map(o => ({
          ...o,
          status: o.id === offerId ? "ACCEPTED" : "REJECTED"
        }))
      );
    });

    socket.on("timer:extended", ({ newClosingDate }) => {
      setClosingDate(newClosingDate);
    });

    socket.on("presence:count", ({ count }) => {
      setViewerCount(count);
    });

    // Reconnection: fetch fresh state
    socket.on("reconnect", () => {
      fetch(`/api/listings/${listingId}`)
        .then(r => r.json())
        .then(data => {
          setOffers(data.listing.offers);
          setClosingDate(data.listing.closingDate);
        });
      socket.emit("join_listing", { listingId });
    });

    return () => {
      socket.emit("leave_listing", { listingId });
      socket.disconnect();
    };
  }, [listingId]);

  return { offers, closingDate, viewerCount };
}
```

### Emitting Events from API Routes

API routes access the Socket.io instance via the global variable:

```typescript
// In an API route (e.g., POST /api/offers)
function emitOfferEvent(listingId: string, event: string, data: any) {
  const io = (global as any).__socketIO;
  if (io) {
    io.to(`listing:${listingId}`).emit(event, data);
  }
}
```

---

## 6. Countdown Timer Component

### Behaviour

The `CountdownTimer` component displays days, hours, minutes, and seconds remaining until the closing date. It updates every second using `requestAnimationFrame` or `setInterval(1000)`.

```typescript
// src/components/listings/CountdownTimer.tsx
interface CountdownTimerProps {
  closingDate: string;  // ISO 8601 UTC
  onExpired?: () => void;
}
```

### Display Rules

- **More than 7 days:** Show "Closes [date]" in text, no ticking timer.
- **7 days or less:** Show the full countdown: `DD : HH : MM : SS`.
- **Less than 1 hour:** Timer text turns amber/warning colour.
- **Less than 15 minutes:** Timer text turns red, subtle pulse animation. Label changes to "CLOSING SOON".
- **Timer reaches 0:** Display "CLOSED" in red. Disable the "Place an Offer" button. If an anti-snipe extension comes via WebSocket, the timer resets with the new closing date and the colour returns to normal.
- **After closing + no acceptance:** Display "Closing period ended — awaiting seller decision."

### Sync with Server

The client timer is initialised from the server-rendered closing date. If a `timer:extended` event arrives, the component updates its target date and the countdown resets. The client does NOT make its own decision about whether the listing is closed — it relies on the API (which will reject offers on closed listings) and the WebSocket event (which announces extensions).

---

## 7. Offer Board UI Component

### Structure

```
┌─────────────────────────────────────────────┐
│  OPEN OFFERS — LIVE           Guide: $820k  │
│  [green dot] 23 people viewing              │
├─────────────────────────────────────────────┤
│  CLOSING IN                                 │
│  24 : 06 : 42 : 18                         │
│  DAYS  HRS   MIN   SEC                     │
├─────────────────────────────────────────────┤
│  RANK    OFFER           CONDITIONS         │
│                                             │
│  [1]     $845,000        [Unconditional]    │
│          Buyer_7a3k · 2 hours ago           │
│                                             │
│  [2]     $830,000        [Finance]          │
│          Buyer_9f2m · 5 hours ago           │
│                                             │
│  [3]     $820,000        [Building & pest]  │
│          Buyer_2c8p · 1 day ago             │
│                                             │
│  [4]     ~~$805,000~~    ~~[Finance]~~      │
│          Buyer_5d1r · WITHDRAWN             │
│                                             │
├─────────────────────────────────────────────┤
│  [ Place an Offer — amber button, full w ]  │
└─────────────────────────────────────────────┘
```

### Visual Design

- **Container**: White card, rounded corners, subtle shadow. On desktop, sticky positioned in the right column (top: 80px for nav clearance). On mobile, collapses to a sticky bottom bar showing "4 offers · Highest: $845k · [View Board]" that expands to full-screen modal on tap.
- **Header**: Navy background. Live dot (pulsing green CSS animation). Viewer count from WebSocket presence.
- **Timer section**: Navy-mid background. Large tabular-nums font for the numbers. Labels beneath.
- **Offer rows**: Alternating subtle backgrounds. Rank 1 has an amber rank badge and a very subtle amber tint on the row. Other ranks have grey badges. Condition badges are colour-coded: green for unconditional, amber for finance, blue for building & pest, grey for other.
- **New offer animation**: When a new offer arrives via WebSocket, it slides into the correct rank position with a 300ms ease-out animation. The row has a brief amber highlight that fades over 1.5 seconds (use `@keyframes` with background-color transition).
- **Withdrawn offers**: Displayed at the bottom of the list with strikethrough text on amount and conditions, greyed out (opacity 0.5). The "WITHDRAWN" label replaces the timestamp.

### Accessibility

- Each offer row is semantically a list item (`<li>` inside `<ol>`).
- Currency amounts have `aria-label="Eight hundred forty-five thousand dollars"`.
- The countdown timer has `aria-live="polite"` so screen readers announce changes without interrupting.
- Condition badges have descriptive titles.
- The "Place an Offer" button has clear focus states.

---

## 8. Fixed Price and Private Offers — Variations

### Private Offers (saleMethod: PRIVATE_OFFERS)

Identical to Open Offers in terms of the API and database, with these differences:
- `isPublic` is set to `false` on all offers.
- The public listing page shows NO offer board. Instead, it shows a section: "This property is accepting private offers. [Place a Private Offer]".
- The buyer places an offer through the same form, but they do NOT see other offers.
- The seller sees all offers in their dashboard, identical to the Open Offers seller view.
- No anti-snipe logic (no closing date countdown is shown to buyers, though the seller can still set a deadline for themselves).
- No WebSocket offer events are broadcast publicly. The seller receives real-time notifications of new offers in their dashboard.

### Fixed Price (saleMethod: FIXED_PRICE)

- The listing shows the fixed price prominently: "$820,000 — Fixed Price".
- Instead of "Place an Offer", the button says "Express Interest".
- Clicking it sends a message to the seller expressing interest at the listed price, rather than creating an Offer record.
- No offer board, no countdown, no WebSocket offer events.
- The seller manages interest through the messaging system.
- If the seller wants to accept, they mark the listing as UNDER_OFFER manually and communicate directly with the buyer.

---

## 9. Closing Period — What Happens When the Timer Expires

When the closing date passes:

1. **No automatic acceptance.** The system does NOT automatically accept the highest offer. The seller retains full discretion.

2. **No new offers accepted.** The API rejects any new offer submissions with code `LISTING_CLOSED`.

3. **Existing offers remain visible.** The offer board displays in its final state with a "CLOSED" label replacing the countdown timer.

4. **Seller has 7 days to decide.** The seller can review offers in their dashboard and accept one within 7 days of the closing date. After 7 days, the listing automatically moves to `EXPIRED` status and all offers are expired.

5. **Email to seller at closing:** "Your listing at [address] has closed with [N] offers. The highest offer is $X from [name]. Log in to your dashboard to review and accept an offer. You have 7 days to make a decision."

6. **If seller doesn't accept within 7 days:** All offers expire. The listing status changes to `EXPIRED`. The seller can re-list (create a new listing) if they wish to try again.

### Implementation

Create a CRON job (or Vercel Cron function) that runs every hour:

```typescript
// Check for expired listings
const expiredListings = await prisma.listing.findMany({
  where: {
    status: "ACTIVE",
    saleMethod: "OPEN_OFFERS",
    closingDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }  // 7 days past closing
  }
});

for (const listing of expiredListings) {
  await prisma.$transaction([
    prisma.listing.update({ where: { id: listing.id }, data: { status: "EXPIRED" } }),
    prisma.offer.updateMany({ where: { listingId: listing.id, status: "ACTIVE" }, data: { status: "EXPIRED" } })
  ]);
}
```

Also check for listings that have closed (closingDate passed) but still have status ACTIVE — send the "time to decide" email to the seller if not already sent.

---

## 10. Anti-Gaming Measures

### Shill Bidding Prevention

- Identity verification (GreenID) ensures each person can only have one account.
- Cross-reference: when a buyer places an offer, check that their verified identity is different from the listing seller's verified identity. The `verificationRef` from GreenID can be used for this.
- If the same person is detected as both seller and bidder, reject the offer with code `SHILL_BID_DETECTED`.

### Bid Withdrawal Abuse

- Withdrawn offers remain visible on the board (with strikethrough). This deters frivolous withdrawals because the pattern is visible to everyone.
- Track withdrawal rate per user. If a user has withdrawn more than 3 offers across different listings in the past 30 days, flag their account for review. Do not auto-ban — just flag for manual review.
- Display the withdrawal on the board with the original amount visible. Other buyers can see that this competition has left.

### Phantom Offer Detection

- Rate limit: maximum 5 new offers per user per day across all listings. This prevents someone from flooding multiple listings with low offers.
- If the seller has enabled `requireDeposit`, offers above the deposit threshold must be accompanied by a holding deposit (handled outside the platform — the buyer transfers to the seller's settlement agent's trust account and provides a receipt. This is a manual verification step for the seller).

### Bid Retraction Timing

- Offers can be withdrawn at any time, including during the anti-snipe window.
- However, withdrawals do NOT trigger anti-snipe extensions (only new offers and increases do).
- A withdrawal during the final 15 minutes does not prevent other buyers from bidding — the closing continues normally unless a new offer triggers an extension.

---

## 11. Testing Requirements

### Unit Tests (Vitest)

Test the following functions/modules:

- `checkAntiSnipe()` — Test with: offer placed 20 minutes before close (no extension), offer placed 14 minutes before close (extension), offer placed 1 minute before close (extension), offer placed after close (no extension), withdrawal within window (no extension), multiple extensions in sequence.
- `offerStrengthScore()` — Test with all condition types and settlement periods.
- `validateOffer()` — Test with all validation rules from section 2.
- `rankOffers()` — Test with various amounts, equal amounts (timestamp tiebreak), and withdrawn offers.
- Offer state transitions — Test all valid transitions succeed and all invalid transitions are rejected.

### Integration Tests (Vitest with test database)

- Create listing → publish → place offer → increase offer → accept offer (full lifecycle).
- Place offer within anti-snipe window → verify closing date extended.
- Two buyers bid on same listing → accept one → verify other is rejected.
- Buyer tries to bid on own listing → verify rejection.
- Unverified user tries to place offer → verify rejection.

### E2E Tests (Playwright)

- Open a listing page → verify offer board renders with existing offers.
- Place an offer → verify it appears on the board.
- Open two browser tabs on the same listing → place offer in one → verify it appears in the other (WebSocket test).
- Watch countdown timer tick → verify it updates every second.
- Verify the "Place an Offer" button is disabled when listing is closed.

# TrueBid — Messaging System Specification

## Overview

In-platform messaging between buyers and sellers, contextualised to a specific listing. Messages are tied to a listing so the seller knows which property the buyer is asking about.

---

## 1. How Messages Are Initiated

**From the listing page (buyer → seller):**
A "Ask the seller a question" section appears below the property details. Textarea + Send button. The buyer must be authenticated. The recipientId is automatically set to the listing's sellerId. The listingId is the current listing.

**From the offer form (buyer → seller):**
The "personal note" field in the offer form is stored as the offer's `personalNote`, NOT as a message. It's displayed in the seller's offer detail view. If the buyer wants to have a conversation, they use the messaging section on the listing page.

**From the seller dashboard (seller → buyer):**
The seller can reply to any buyer's message from the Messages tab. They can also initiate a message to any buyer who has placed an offer, via a "Message" button in the offer table.

## 2. Data Model

Already defined in database-schema.md. Key fields:
- `senderId`, `recipientId` — the two participants
- `listingId` — which property this conversation is about
- `content` — the message text
- `status` — SENT, DELIVERED, READ
- `readAt` — when the recipient opened it

## 3. Conversation Threading

Messages are grouped into conversation threads by the unique combination of `(listingId, participant1, participant2)`. A conversation is all messages between two users about a specific listing.

Query for the conversation list:
```sql
SELECT DISTINCT ON (listing_id, counterparty_id)
  -- Return the most recent message per (listing, counterparty) pair
```

In Prisma, this is done by fetching all messages for the user, grouping by listing + counterparty, and picking the most recent per group.

## 4. API Endpoints

All defined in api-contracts.md:
- `POST /api/messages` — send a message
- `GET /api/messages/conversations` — list all conversations
- `GET /api/messages/conversations/[listingId]/[userId]` — get a specific thread

## 5. Email Notifications

When a message is received, send an email via Resend:

Subject: "New message about [address]"
Body:
```
Hi [recipientFirstName],

[senderFirstName] sent you a message about [streetAddress], [suburb]:

"[first 200 chars of message content]..."

Reply on TrueBid: [link to conversation]

— TrueBid
```

Rate limit email notifications: maximum 1 email per conversation per 10 minutes. If multiple messages arrive quickly, batch them into one email.

## 6. UI Components

### Message Composer (on listing page)

```
┌────────────────────────────────────────────┐
│ Ask the seller a question                  │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ Hi, I'd love to know about...         │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                         [Send Message]     │
└────────────────────────────────────────────┘
```

### Conversation Thread (in dashboard)

Chat-like layout:
- Buyer messages: left-aligned, light grey bubble
- Seller messages: right-aligned, navy bubble, white text
- Timestamp below each message (relative: "2 hours ago")
- Input field at bottom, sticky

### Conversation List (in dashboard)

As specified in seller-dashboard.md — avatar, name, preview, time, unread dot.

## 7. Anti-Spam

- Rate limit: 20 messages per hour per user.
- Minimum message length: 1 character.
- Maximum message length: 2000 characters.
- Block messages containing URLs at MVP (common spam vector). Show error: "Links are not allowed in messages for security reasons."
- If a user is reported for spam 3+ times, flag their account for review.

## 8. Read Receipts

When a recipient opens a conversation thread:
1. All unread messages from the other party in that thread are marked as READ.
2. `readAt` is set to current timestamp.
3. The unread count in the nav/dashboard updates.

The sender does NOT see read receipts (no "seen" indicator). This is a deliberate privacy choice — sellers shouldn't feel pressured to respond instantly.

---

# TrueBid — Identity Verification Specification

## Overview

Identity verification prevents fake accounts, shill bidding, and phantom offers. It's required before a user can publish a listing or place an offer. Uses Stripe Identity for document verification.

---

## 1. When Verification Is Required

- **Before publishing a listing** — seller must be VERIFIED.
- **Before placing an offer** — buyer must be VERIFIED.
- **Not required for:** browsing, searching, saving listings, creating draft listings, sending messages, registering.

When a user attempts a gated action while UNVERIFIED, redirect to `/verify-identity?returnUrl=[original-url]` with a message: "You need to verify your identity before [publishing your listing / placing an offer]. This takes about 2 minutes."

## 2. Verification Flow

### Page: `/verify-identity`

**Step 1 — Explain**
```
Verify your identity

To keep TrueBid safe and trustworthy, we verify everyone's identity 
before they can list a property or place an offer. This prevents 
fake accounts and protects genuine buyers and sellers.

What you'll need:
• Your Australian driver's licence OR passport
• A device with a camera (for a selfie check)

Your ID details are verified by our secure partner and are NOT stored 
by TrueBid. We only record that you've been verified.

[Start Verification →]
```

**Step 2 — Document capture**
Handled by Stripe Identity's hosted verification flow. The user:
1. Selects document type (driver's licence or passport).
2. Captures or uploads a photo of the document.
3. Takes a selfie for liveness check.
4. Stripe Identity verifies the document.

**Step 3 — Result**
- If VERIFIED: show green checkmark, "You're verified! Redirecting you back to [where they came from]..." Auto-redirect after 3 seconds.
- If FAILED: show message "We couldn't verify your identity. This can happen if the document photo was unclear or the details didn't match. [Try again] or [Contact support]."

## 3. Technical Integration

### Starting Verification

`POST /api/verification/start`
1. User must be authenticated.
2. User's verificationStatus must be UNVERIFIED or FAILED (don't re-verify already-verified users).
3. Call Stripe Identity API to create a VerificationSession. Receive a client_secret.
4. Set user's verificationStatus to PENDING.
5. Return the verification URL/token to the client.

### Receiving Results

`POST /api/verification/webhook` (webhook from Stripe Identity)
1. Validate the webhook signature (Stripe provides a signing secret via STRIPE_WEBHOOK_SECRET).
2. Find the user by session reference.
3. If status is "verified":
   - Set verificationStatus to VERIFIED.
   - Set verificationDate to now.
   - Set verificationRef to the Stripe VerificationSession ID (for audit, not the document itself).
4. If status is "failed":
   - Set verificationStatus to FAILED.
5. Send email to user confirming the result.

### Checking Status

`GET /api/verification/status`
Returns current status. The verify-identity page polls this every 5 seconds while status is PENDING (in case the webhook is delayed).

## 4. What TrueBid Stores

IMPORTANT for privacy and compliance:

**We DO store:**
- verificationStatus (UNVERIFIED / PENDING / VERIFIED / FAILED)
- verificationDate (when they were verified)
- verificationRef (Stripe VerificationSession ID — for audit trail)

**We do NOT store:**
- The actual ID document image
- Driver's licence number
- Passport number
- Date of birth (unless we need it for other features later)
- Any biometric data

Stripe Identity handles and stores the sensitive data under their own privacy and compliance obligations. TrueBid only stores the fact that verification occurred.

## 5. Preventing Shill Bidding

When a buyer places an offer on a listing:
1. Check that buyer.id !== listing.sellerId (basic check — same user account).
2. Check that the buyer's verificationRef !== the seller's verificationRef (different Stripe VerificationSession check). This catches the case where someone creates two accounts with different emails but the same real identity.

If match detected: reject the offer with code `SHILL_BID_DETECTED` and message "You cannot place offers on your own listing."

## 6. UI Elements

### Verified Badge

Displayed on:
- Listing pages: "✅ Verified Seller" badge near the seller's name.
- Offer board: no badge per offer (all bidders are verified by requirement, so it's redundant).
- Seller dashboard: "✅ Verified" next to each buyer in the offer table.

### Verification Prompt

When an unverified user tries to place an offer, show an inline prompt instead of the offer form:
```
┌────────────────────────────────────────────┐
│ 🔒 Identity verification required          │
│                                            │
│ To place an offer, you need to verify your │
│ identity first. This takes about 2 minutes │
│ and keeps TrueBid safe for everyone.       │
│                                            │
│ [Verify My Identity →]                     │
└────────────────────────────────────────────┘
```

## 7. MVP Simplification

If Stripe Identity integration is not available for MVP, use a simplified manual verification:
1. User uploads a photo of their driver's licence.
2. User takes a selfie.
3. A TrueBid team member manually reviews (compare face, check document isn't expired).
4. Mark as VERIFIED or FAILED.
5. Target turnaround: 2 hours during business hours, next business day otherwise.

This is less scalable but sufficient for the first 100 users. Replace with automated KYC as you grow.

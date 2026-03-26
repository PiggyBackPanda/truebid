# TrueBid — API Contracts Specification

## Overview

All API routes live under `src/app/api/`. All request/response bodies are JSON. All endpoints require appropriate authentication unless marked PUBLIC. All error responses follow the standard shape. Currency amounts in request/response bodies are in CENTS (integers). Dates are ISO 8601 strings in UTC.

## Standard Error Response

Every endpoint returns this shape on failure:

```typescript
{
  error: string;       // Human-readable message
  code: string;        // Machine-readable code (e.g., "VALIDATION_ERROR", "NOT_FOUND")
  details?: unknown;   // Optional additional context (validation errors, etc.)
}
```

HTTP status codes: 400 (validation/bad request), 401 (not authenticated), 403 (not authorised), 404 (not found), 409 (conflict), 429 (rate limited), 500 (server error).

## Standard Pagination

Paginated endpoints accept:
```
?page=1&limit=20
```

And return:
```typescript
{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

## Authentication — `/api/auth/`

### POST `/api/auth/register` — PUBLIC

Create a new user account.

```typescript
// Request
{
  email: string;           // Valid email, unique
  password: string;        // Min 8 chars, 1 uppercase, 1 number
  firstName: string;       // Min 1 char
  lastName: string;        // Min 1 char
  phone?: string;          // Australian phone format
  role: "BUYER" | "SELLER" | "BOTH";
}

// Success Response (201)
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    verificationStatus: "UNVERIFIED";
    publicAlias: string;
  };
  token: string;           // JWT access token
}
```

Validation: reject duplicate emails with 409 and code `EMAIL_EXISTS`.

### POST `/api/auth/login` — PUBLIC

```typescript
// Request
{
  email: string;
  password: string;
}

// Success Response (200)
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    verificationStatus: string;
    publicAlias: string;
  };
  token: string;
}
```

Validation: return 401 with code `INVALID_CREDENTIALS` for wrong email or password. Do NOT reveal whether the email exists.

### POST `/api/auth/logout`

Invalidate the current session. Returns 200 with `{ success: true }`.

### GET `/api/auth/me`

Returns the current authenticated user's profile.

```typescript
// Response (200)
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: string;
    verificationStatus: string;
    verificationDate: string | null;
    publicAlias: string;
    avatarUrl: string | null;
    createdAt: string;
  }
}
```

---

## Listings — `/api/listings/`

### GET `/api/listings` — PUBLIC

Search and browse listings. Paginated.

```typescript
// Query Parameters
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, max: 50
  suburb?: string;         // Filter by suburb name (partial match)
  postcode?: string;       // Filter by postcode
  state?: AustralianState; // Filter by state
  propertyType?: PropertyType;
  saleMethod?: SaleMethod;
  minPrice?: number;       // Cents
  maxPrice?: number;       // Cents
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "closing_soon";
  q?: string;              // Free text search (searches address, suburb, description)
}

// Response (200)
{
  data: ListingSummary[];
  pagination: { page, limit, total, totalPages }
}

// ListingSummary shape
{
  id: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  landSizeM2: number | null;
  guidePriceCents: number | null;
  saleMethod: string;
  status: string;
  closingDate: string | null;
  publishedAt: string;
  viewCount: number;
  saveCount: number;
  offerCount: number;          // Count of active offers
  highestOfferCents: number | null;  // Only for OPEN_OFFERS with public visibility
  primaryImage: {
    url: string;
    thumbnailUrl: string;
  } | null;
}
```

Only return listings with status `ACTIVE`. Sort by `newest` (publishedAt desc) by default.

### GET `/api/listings/[id]` — PUBLIC

Full listing detail including images and offer board.

```typescript
// Response (200)
{
  listing: {
    id: string;
    seller: {
      id: string;
      firstName: string;
      // lastName only shown if viewer is an offer-holder on this listing
      publicAlias: string;
      verificationStatus: string;
    };
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
    latitude: number | null;
    longitude: number | null;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    carSpaces: number;
    landSizeM2: number | null;
    buildingSizeM2: number | null;
    yearBuilt: number | null;
    title: string | null;
    description: string;
    guidePriceCents: number | null;
    guideRangeMaxCents: number | null;
    saleMethod: string;
    closingDate: string | null;
    status: string;
    publishedAt: string;
    viewCount: number;
    saveCount: number;
    features: string[] | null;
    images: {
      id: string;
      url: string;
      thumbnailUrl: string;
      altText: string | null;
      displayOrder: number;
      isPrimary: boolean;
      mediaType: string;
    }[];
    offers: PublicOffer[];    // Only for OPEN_OFFERS listings
  }
}

// PublicOffer shape (what the PUBLIC sees — no personal details)
{
  id: string;
  publicAlias: string;       // e.g., "Buyer_7a3k"
  amountCents: number;
  conditionType: string;
  conditionText: string | null;
  settlementDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

IMPORTANT: For PRIVATE_OFFERS listings, the `offers` array is empty in the public response. Only the seller sees private offers (via the dashboard endpoint).

Increment `viewCount` on each request. Deduplicate by userId+date or ipHash+date using the ListingView model.

### POST `/api/listings` — AUTHENTICATED, VERIFIED

Create a new listing (initially as DRAFT).

```typescript
// Request
{
  streetAddress: string;
  suburb: string;
  state: AustralianState;
  postcode: string;
  latitude?: number;
  longitude?: number;
  propertyType: PropertyType;
  bedrooms: number;           // 0-20
  bathrooms: number;          // 0-10
  carSpaces: number;          // 0-10
  landSizeM2?: number;
  buildingSizeM2?: number;
  yearBuilt?: number;         // 1800-current year
  title?: string;             // Max 100 chars
  description: string;        // Min 50 chars, max 5000 chars
  guidePriceCents?: number;
  guideRangeMaxCents?: number;
  saleMethod: SaleMethod;
  closingDate?: string;       // Required if saleMethod is OPEN_OFFERS. Must be >= 14 days from now.
  minOfferCents?: number;
  requireDeposit?: boolean;
  depositAmountCents?: number;
  features?: string[];
}

// Response (201)
{
  listing: { id: string; status: "DRAFT"; /* ...full listing shape */ }
}
```

Validation:
- User must have `verificationStatus: VERIFIED`.
- User role must be `SELLER` or `BOTH`.
- If saleMethod is `OPEN_OFFERS`, closingDate is required and must be at least 14 days in the future.
- If guideRangeMaxCents is provided, it must be greater than guidePriceCents.
- postcode must be 4 digits.

### PATCH `/api/listings/[id]` — AUTHENTICATED, OWNER

Update a listing. Accepts partial updates (only send fields that changed).

```typescript
// Request: Partial<CreateListingRequest>
// Response (200): Full updated listing
```

Validation: user must be the listing's seller. Cannot update if status is `SOLD`.

### POST `/api/listings/[id]/publish` — AUTHENTICATED, OWNER, VERIFIED

Publish a draft listing, making it active.

```typescript
// Response (200)
{
  listing: { id: string; status: "ACTIVE"; publishedAt: string; /* ... */ }
}
```

Validation:
- Listing must be in `DRAFT` status.
- Listing must have at least 1 image.
- Description must be at least 50 characters.
- If OPEN_OFFERS, closingDate must still be in the future.

### POST `/api/listings/[id]/withdraw` — AUTHENTICATED, OWNER

Withdraw an active listing from the market.

```typescript
// Response (200)
{ listing: { id: string; status: "WITHDRAWN"; } }
```

All active offers on this listing should have their status changed to `EXPIRED`.

---

## Images — `/api/listings/[id]/images/`

### POST `/api/listings/[id]/images/upload` — AUTHENTICATED, OWNER

Upload a property image. Uses multipart form data.

```typescript
// Request: multipart/form-data
{
  file: File;              // JPG, PNG, WebP. Max 10MB.
  displayOrder?: number;
  isPrimary?: boolean;
  mediaType?: "photo" | "floorplan" | "video";
  altText?: string;
}

// Response (201)
{
  image: {
    id: string;
    url: string;
    thumbnailUrl: string;
    displayOrder: number;
    isPrimary: boolean;
  }
}
```

Server-side: upload original to S3, generate thumbnail (400px wide), generate medium (1200px wide). Store both URLs. If isPrimary is true, unset isPrimary on all other images for this listing. Max 30 images per listing (15 for free tier, 30 for premium — enforce based on user's plan).

### DELETE `/api/listings/[id]/images/[imageId]` — AUTHENTICATED, OWNER

Delete an image. Returns 200 with `{ success: true }`. Also deletes from S3.

### PATCH `/api/listings/[id]/images/reorder` — AUTHENTICATED, OWNER

Reorder images.

```typescript
// Request
{
  imageIds: string[];  // Ordered array of image IDs — position in array = displayOrder
}

// Response (200)
{ success: true }
```

---

## Offers — `/api/offers/`

### POST `/api/offers` — AUTHENTICATED, VERIFIED

Place a new offer on a listing.

```typescript
// Request
{
  listingId: string;
  amountCents: number;          // Must be positive integer
  conditionType: ConditionType;
  conditionText?: string;       // Required if conditionType is OTHER
  settlementDays: number;       // 14, 30, 45, 60, 90
  personalNote?: string;        // Max 1000 chars
}

// Response (201)
{
  offer: {
    id: string;
    publicAlias: string;
    amountCents: number;
    conditionType: string;
    settlementDays: number;
    status: "ACTIVE";
    createdAt: string;
  }
}
```

Validation:
- User must have `verificationStatus: VERIFIED`.
- Listing must be `ACTIVE` and not past its closingDate.
- User cannot bid on their own listing (buyerId !== listing.sellerId).
- One offer per buyer per listing (if an offer already exists, return 409 with code `OFFER_EXISTS` and message suggesting they use the increase endpoint).
- amountCents must be greater than 0.
- For OPEN_OFFERS: if listing has a minOfferCents, the amount must meet or exceed it.

Side effects:
- Emit WebSocket event `offer:new` on the listing's channel.
- If closingDate is within 15 minutes, extend it by 15 minutes and emit `timer:extended`.
- Send email notification to the seller.

### PATCH `/api/offers/[id]/increase` — AUTHENTICATED, OFFER OWNER

Increase an existing offer amount.

```typescript
// Request
{
  amountCents: number;          // Must be greater than current amount
  conditionType?: ConditionType; // Optionally change conditions
  conditionText?: string;
  settlementDays?: number;
}

// Response (200)
{
  offer: { /* updated offer */ }
}
```

Validation:
- New amountCents must be strictly greater than current amountCents.
- Offer must be in `ACTIVE` status.
- Listing must still be `ACTIVE` and not past closingDate.

Side effects:
- Create OfferHistory record with previous values.
- Emit WebSocket event `offer:updated`.
- If within anti-snipe window, extend closing and emit `timer:extended`.

### POST `/api/offers/[id]/withdraw` — AUTHENTICATED, OFFER OWNER

Withdraw an offer.

```typescript
// Response (200)
{
  offer: { id: string; status: "WITHDRAWN"; withdrawnAt: string; }
}
```

Side effects:
- Emit WebSocket event `offer:withdrawn`.
- IMPORTANT: The withdrawn offer remains visible on the public board with status `WITHDRAWN` and a strikethrough in the UI. It is NOT deleted.

### POST `/api/offers/[id]/accept` — AUTHENTICATED, LISTING OWNER

Seller accepts an offer.

```typescript
// Response (200)
{
  offer: { id: string; status: "ACCEPTED"; acceptedAt: string; }
  listing: { id: string; status: "UNDER_OFFER"; }
}
```

Side effects:
- Change listing status to `UNDER_OFFER`.
- All other active offers on this listing get status changed to `REJECTED`.
- Emit WebSocket event `offer:accepted` (broadcast to all viewers).
- Send email notification to winning buyer.
- Send email notification to all other buyers that their offer was not accepted.

### POST `/api/offers/[id]/reject` — AUTHENTICATED, LISTING OWNER

Seller explicitly rejects a specific offer.

```typescript
// Response (200)
{
  offer: { id: string; status: "REJECTED"; rejectedAt: string; }
}
```

Side effects: send email notification to the rejected buyer.

---

## Messages — `/api/messages/`

### POST `/api/messages` — AUTHENTICATED

Send a message to another user about a listing.

```typescript
// Request
{
  recipientId: string;
  listingId: string;
  content: string;            // Min 1 char, max 2000 chars
}

// Response (201)
{
  message: {
    id: string;
    senderId: string;
    recipientId: string;
    listingId: string;
    content: string;
    status: "SENT";
    createdAt: string;
  }
}
```

Validation:
- Cannot message yourself.
- Listing must exist and be ACTIVE (or UNDER_OFFER).
- Rate limit: max 20 messages per hour per user.

Side effects: send email notification to recipient.

### GET `/api/messages/conversations` — AUTHENTICATED

Get all conversations for the current user, grouped by listing and counterparty.

```typescript
// Response (200)
{
  conversations: {
    listingId: string;
    listingAddress: string;
    counterparty: {
      id: string;
      firstName: string;
      lastName: string;
      publicAlias: string;
    };
    lastMessage: {
      content: string;
      createdAt: string;
      isFromMe: boolean;
    };
    unreadCount: number;
  }[]
}
```

Sorted by lastMessage.createdAt descending.

### GET `/api/messages/conversations/[listingId]/[userId]` — AUTHENTICATED

Get all messages in a specific conversation thread.

```typescript
// Response (200)
{
  messages: {
    id: string;
    senderId: string;
    content: string;
    status: string;
    createdAt: string;
    isFromMe: boolean;
  }[]
}
```

Side effect: mark all unread messages from the other user as `READ`.

---

## Seller Dashboard — `/api/dashboard/`

### GET `/api/dashboard/seller/stats` — AUTHENTICATED, SELLER

Get aggregated stats for the seller's active listings.

```typescript
// Response (200)
{
  stats: {
    totalViews: number;
    totalViewsToday: number;
    totalSaves: number;
    totalSavesToday: number;
    activeOffers: number;
    highestOfferCents: number | null;
    unreadMessages: number;
    activeListings: number;
  }
}
```

### GET `/api/dashboard/seller/offers/[listingId]` — AUTHENTICATED, LISTING OWNER

Get all offers on a specific listing WITH full buyer details (seller-only view).

```typescript
// Response (200)
{
  offers: {
    id: string;
    buyer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      publicAlias: string;
      verificationStatus: string;
    };
    amountCents: number;
    conditionType: string;
    conditionText: string | null;
    settlementDays: number;
    personalNote: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    history: {
      previousAmountCents: number;
      newAmountCents: number;
      changeType: string;
      createdAt: string;
    }[];
  }[]
}
```

IMPORTANT: This is the endpoint where the seller sees real names, emails, and phone numbers. The public API never exposes this data.

---

## Identity Verification — `/api/verification/`

### POST `/api/verification/start` — AUTHENTICATED

Initiate the identity verification process.

```typescript
// Request
{
  documentType: "drivers_licence" | "passport";
}

// Response (200)
{
  verificationUrl: string;   // URL to redirect user to GreenID verification page
  sessionId: string;         // Track this verification attempt
}
```

Sets user's verificationStatus to `PENDING`.

### POST `/api/verification/callback` — WEBHOOK (from GreenID)

Receives the verification result from GreenID.

```typescript
// Request (from GreenID webhook)
{
  sessionId: string;
  status: "verified" | "failed";
  reference: string;
}
```

Updates user's verificationStatus to `VERIFIED` or `FAILED`. Sets verificationDate and verificationRef.

### GET `/api/verification/status` — AUTHENTICATED

Check current verification status.

```typescript
// Response (200)
{
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "FAILED";
  verifiedAt: string | null;
}
```

---

## Saves — `/api/saves/`

### POST `/api/saves/[listingId]` — AUTHENTICATED

Save/favourite a listing. Toggles — if already saved, removes the save.

```typescript
// Response (200)
{
  saved: boolean;  // true = now saved, false = now unsaved
}
```

Side effect: increment/decrement listing's saveCount.

### GET `/api/saves` — AUTHENTICATED

Get all saved listings for the current user.

```typescript
// Response (200)
{
  listings: ListingSummary[]  // Same shape as search results
}
```

---

## WebSocket Events

The Socket.io server runs alongside the Next.js server. Clients connect to the default namespace. Each listing has a room identified by `listing:{listingId}`.

### Client → Server

```
join_listing    { listingId: string }     // Subscribe to a listing's updates
leave_listing   { listingId: string }     // Unsubscribe
```

### Server → Client

```
offer:new       { offer: PublicOffer, listingId: string }
offer:updated   { offer: PublicOffer, listingId: string }
offer:withdrawn { offerId: string, listingId: string }
offer:accepted  { offerId: string, listingId: string }
timer:extended  { listingId: string, newClosingDate: string }
presence:count  { listingId: string, count: number }   // Every 30 seconds
```

The `PublicOffer` shape matches the public offer format (pseudonymous alias, no personal details). The seller's dashboard receives the same events but enriches them with buyer details client-side from cached data.

---

## Rate Limiting

Apply rate limits using Redis:

- Auth endpoints (register, login): 10 requests per minute per IP
- Offer submission: 5 per minute per user
- Message sending: 20 per hour per user
- Image upload: 30 per hour per user
- General API: 100 per minute per user

Return 429 with `{ error: "Rate limit exceeded", code: "RATE_LIMITED", retryAfter: number }`.

---

## Implementation Notes for Claude Code

1. Create all Zod validation schemas in `src/lib/validation.ts`. Import and use them in both API routes (server-side validation) and form components (client-side validation). Never duplicate validation logic.

2. Create a `src/lib/api-helpers.ts` file with utilities: `requireAuth(request)` that extracts and validates the JWT, returning the user or throwing 401; `requireVerified(user)` that checks verificationStatus or throws 403; `requireOwner(user, resourceUserId)` that checks ownership or throws 403; `paginationParams(searchParams)` that extracts and validates page/limit from query params.

3. Create a `src/lib/format.ts` file with `formatCurrency(cents: number): string` that converts cents to `$X,XXX` format, and `formatDate(date: string): string` that converts UTC to Perth timezone display.

4. Every API route should follow this pattern:
```typescript
export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const validated = createOfferSchema.parse(body);
    // ... business logic
    return Response.json({ offer }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Validation failed", code: "VALIDATION_ERROR", details: error.errors }, { status: 400 });
    }
    // ... handle other error types
    console.error("POST /api/offers error:", error);
    return Response.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
```

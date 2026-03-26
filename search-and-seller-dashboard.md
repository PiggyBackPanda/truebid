# TrueBid — Search & Discovery Specification

## Overview

The property search experience. Buyers browse, filter, sort, and discover listings. SEO is critical — every listing and search result page must be indexable.

---

## 1. Route: `/listings`

Server-rendered page. Filters are URL query parameters so search results are shareable and bookmarkable:
```
/listings?suburb=Scarborough&minBeds=3&maxPrice=90000000&sort=closing_soon
```

## 2. Search Bar

Top of the page. Single input field with placeholder: "Search suburb, postcode, or address..."

Behaviour:
- As the user types, show an autocomplete dropdown with matching suburbs (sourced from a static list of WA suburbs at MVP, expanding to all Australian suburbs later).
- Pressing Enter or clicking a suggestion triggers a search.
- The search matches against: `suburb` (contains), `postcode` (exact), `streetAddress` (contains).
- Free text query goes into `?q=` parameter.

## 3. Filters

Displayed as a row of dropdowns/selectors below the search bar on desktop. On mobile, collapsed into a "Filters" button that opens a slide-up drawer.

**Property Type:** Dropdown — All Types, House, Apartment, Townhouse, Villa, Land, Rural
**Price Range:** Dropdown — Any Price, Under $400k, $400k–$600k, $600k–$800k, $800k–$1M, $1M–$1.5M, $1.5M+. Maps to `minPrice` and `maxPrice` query params (in cents).
**Bedrooms:** Dropdown — Any, 1+, 2+, 3+, 4+, 5+. Maps to `minBeds`.
**Bathrooms:** Dropdown — Any, 1+, 2+, 3+. Maps to `minBaths`.
**Sale Method:** Dropdown — All Methods, Open Offers, Private Offers, Fixed Price. Maps to `saleMethod`.
**Sort:** Dropdown — Newest (default), Price: Low to High, Price: High to Low, Closing Soon.

"Closing Soon" sort is only meaningful for OPEN_OFFERS listings — it sorts by `closingDate` ascending (soonest first), with non-Open-Offers listings at the bottom.

Active filters display as dismissible chips below the filter row: "3+ beds ×", "Under $800k ×", "House ×"

**Clear All** link appears when any filter is active.

## 4. Results Grid

Two columns on desktop, one column on mobile. Each result is a `ListingCard` component.

### ListingCard

```
┌──────────────────────────────────┐
│  [Cover photo - 16:10 ratio]     │
│  ┌─────────────────────────────┐ │
│  │ 🟢 4 offers · Apr 15       │ │  ← Only for Open Offers (top-left badge)
│  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ │
│  │ Open Offers                 │ │  ← Sale method (top-right badge)
│  └─────────────────────────────┘ │
├──────────────────────────────────┤
│  $975,000                 serif  │  ← Guide price
│  3/12 Marine Parade, Cottesloe   │  ← Address, suburb muted
│                                  │
│  3 bed  ·  2 bath  ·  1 car  ·  180m²  │
└──────────────────────────────────┘
```

- Photo area: 16:10 aspect ratio. If no photo, show property type emoji on navy gradient.
- Hover: subtle lift (translateY -2px) and shadow increase.
- Click: navigate to `/listings/[id]`.
- For OPEN_OFFERS: green pulsing dot + "X offers · Closes [date]" badge overlaying the photo.
- Sale method badge in top-right corner of photo.

### Empty State

If no results match filters:
"No properties match your search. Try adjusting your filters or broadening your search area."
Button: "Clear all filters"

### Pagination

Show 20 results per page. Pagination controls at the bottom:
- "← Previous" and "Next →" buttons
- Page numbers: 1 2 3 ... 8 9 10
- "Showing 1–20 of 147 properties"

URL parameter: `?page=2`

## 5. SEO

### Listing Search Page

```typescript
export async function generateMetadata({ searchParams }) {
  const suburb = searchParams.suburb;
  return {
    title: suburb 
      ? `Properties for sale in ${suburb} | TrueBid`
      : "Properties for sale | TrueBid",
    description: suburb
      ? `Browse properties for sale in ${suburb}, Western Australia. Free listings, transparent offers, no agent commissions.`
      : "Browse properties for sale across Australia. Free listings, transparent offers, no agent commissions.",
  };
}
```

### Individual Listing Page (for reference — built separately)

```typescript
export async function generateMetadata({ params }) {
  const listing = await getListing(params.id);
  return {
    title: `${listing.bedrooms} bed ${listing.propertyType.toLowerCase()} in ${listing.suburb} | TrueBid`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: `$${formatPrice(listing.guidePriceCents)} — ${listing.streetAddress}, ${listing.suburb}`,
      description: `${listing.bedrooms} bed, ${listing.bathrooms} bath ${listing.propertyType.toLowerCase()}. ${listing.saleMethod === "OPEN_OFFERS" ? `Open Offers closing ${formatDate(listing.closingDate)}.` : ""}`,
      images: [listing.images[0]?.url],
    },
  };
}
```

### Structured Data (JSON-LD)

On each listing page, include:
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "[address]",
  "description": "[description]",
  "url": "https://truebid.com.au/listings/[id]",
  "datePosted": "[publishedAt]",
  "image": "[primaryImageUrl]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[streetAddress]",
    "addressLocality": "[suburb]",
    "addressRegion": "[state]",
    "postalCode": "[postcode]",
    "addressCountry": "AU"
  },
  "offers": {
    "@type": "Offer",
    "price": "[guidePriceCents / 100]",
    "priceCurrency": "AUD"
  },
  "numberOfBedrooms": "[bedrooms]",
  "numberOfBathroomsTotal": "[bathrooms]"
}
```

### Sitemap

Generate `/sitemap.xml` dynamically listing all ACTIVE listings. Regenerate daily via ISR. Include `/listings`, `/how-it-works`, `/about`, and each individual listing URL.

## 6. API: `GET /api/listings`

See api-contracts.md for full specification. Key implementation notes:

- Use Prisma's `where` clause builder to compose filters dynamically.
- For text search (`q` parameter): use Prisma's `contains` with `mode: "insensitive"` on streetAddress, suburb, and description.
- For "Closing Soon" sort: `ORDER BY closingDate ASC NULLS LAST` — listings without a closing date appear last.
- Always filter to `status: "ACTIVE"` only.
- Include a count of active offers per listing (use `_count` in Prisma).
- Include the highest active offer amount for OPEN_OFFERS listings.
- Include the primary image (isPrimary: true, or first by displayOrder).
- Use `select` to return only the fields needed for ListingCard (don't fetch full descriptions or all images for the search results — that's wasteful).

## 7. Saved Listings

Authenticated users see a heart icon on each ListingCard. Clicking toggles save/unsave (calls `POST /api/saves/[listingId]`). Filled heart = saved, outline = not saved.

A "Saved" link in the nav (or user dropdown) leads to `/dashboard/buyer/saved` which shows all saved listings as ListingCards.

---

# TrueBid — Seller Dashboard Specification

## Overview

The seller's command centre. Accessed at `/dashboard/seller`. Protected route requiring authentication and SELLER or BOTH role. Shows stats, offers, messages, and legal checklist for all of the seller's listings.

---

## 1. Route Structure

```
/dashboard/seller                → Main dashboard (redirects to /listings if only one listing, or shows listing selector if multiple)
/dashboard/seller/[listingId]    → Dashboard for a specific listing
```

## 2. Listing Selector

If the seller has multiple listings, show a selector at the top:
- Dropdown or horizontal card strip showing each listing with address, status badge, and offer count.
- Clicking a listing loads its dashboard data.
- If only one listing, skip the selector and go straight to the dashboard.

## 3. Stats Overview Row

Four stat cards in a horizontal grid (2×2 on mobile):

| Stat | Source | Display |
|------|--------|---------|
| Total Views | Sum of ListingView records for this listing | "342" with "+28 today" in green below |
| Saves | Listing.saveCount | "28" with "+3 today" in green |
| Active Offers | Count of ACTIVE offers on this listing | "4" with "Highest: $845k" below |
| Unread Messages | Count of Message where recipientId = seller AND status != READ AND listingId = this listing | "7" with "2 unread" in blue |

Stats refresh every 60 seconds via polling (not WebSocket — stats are not latency-sensitive).

## 4. Tab Navigation

Below stats, a horizontal tab bar:
- **Offers** (default, with count badge)
- **Messages** (with unread count badge)
- **Legal Checklist**
- **Listing Settings** (edit listing details, pause/withdraw)

On mobile, the tabs scroll horizontally.

## 5. Offers Tab

### Offer Table

Full-width table (horizontal scroll on mobile):

| Column | Content |
|--------|---------|
| # | Rank by amount (amber badge for #1) |
| Buyer | Full name, phone number below in muted text. Clickable to open message thread. |
| Offer | Amount in bold (e.g., "$845,000"). If the offer has been increased, show "↑ was $830,000" in small muted text. |
| Conditions | Colour-coded badge (same as public board) |
| Settlement | "30 days", "45 days", etc. |
| Time | Relative time ("2 hours ago", "1 day ago") |
| Actions | Buttons: "Accept ✓" (green, only on #1 row by default, but available on all rows via dropdown), "Reject" (outline red), "Message" (outline) |

### Offer Detail Expandable Row

Clicking a row (or a "Details" button) expands it to show:
- Buyer's personal note (if provided) in a quoted box
- Offer history (all previous amounts with timestamps)
- Verification status of the buyer
- "Accept This Offer" button (large, green)

### Accept Flow

When seller clicks "Accept":
1. Confirmation modal: "Are you sure you want to accept [Name]'s offer of $[amount] ([conditions])? All other offers will be rejected and the buyers will be notified."
2. Two buttons: "Cancel" and "Accept Offer" (green).
3. On confirm: call `POST /api/offers/[id]/accept`.
4. On success: listing status changes to UNDER_OFFER. Show success screen with next steps checklist.

### Post-Acceptance Screen

Replace the offer table with:
```
✅ Offer Accepted!

You've accepted Sarah Mitchell's offer of $845,000 (unconditional, 30-day settlement).

Next Steps:
1. ☐ Contact your settlement agent to prepare the Contract of Sale
2. ☐ Provide the buyer with the contract for review
3. ☐ Arrange for the buyer's deposit to be held in your settlement agent's trust account
4. ☐ The buyer may arrange building and pest inspections (if conditional)
5. ☐ Both parties sign the contract — congratulations!

[Contact your settlement agent →]
[Message the buyer →]
```

## 6. Messages Tab

### Conversation List

Show all conversations for this listing, grouped by buyer:
```
┌────────────────────────────────────────────┐
│ [Avatar] Sarah Mitchell          1 hour ago│
│ "Could I arrange a private viewing..."     │
│                                    🔵 unread│
├────────────────────────────────────────────┤
│ [Avatar] Wei Zhang               3 hrs ago │
│ "Is the studio council approved?"          │
│                                    🔵 unread│
├────────────────────────────────────────────┤
│ [Avatar] James Cooper            Yesterday │
│ "Thanks for the info on the renovation..." │
│                                            │
└────────────────────────────────────────────┘
```

Avatar: circle with initials, navy background. Unread indicator: blue dot. Sorted by most recent message.

### Conversation Thread

Clicking a conversation opens the full thread:
- Messages displayed in a chat-like layout (seller's messages right-aligned, buyer's left-aligned).
- Input field at the bottom with "Type a message..." placeholder and Send button.
- If the buyer has an active offer, show a small info bar: "This buyer has offered $845,000 (unconditional)."
- Mark messages as read when the thread is opened.

## 7. Legal Checklist Tab

Show the WA-specific checklist (content from `/docs/legal/wa-requirements.md`).

Each item is a card:
```
┌────────────────────────────────────────────┐
│ [✓ green] or [○ empty]                     │
│ Settlement agent engaged                   │
│ You need a licensed settlement agent to    │
│ prepare contracts and manage settlement.   │
│                                            │
│ [Find a settlement agent →]  (if not done) │
└────────────────────────────────────────────┘
```

Checking an item calls `PATCH /api/dashboard/seller/checklist` to update the ChecklistProgress record. Items can be unchecked.

The checklist is informational, not a gate — sellers can publish and accept offers without completing it. But show a warning if the seller tries to accept an offer with incomplete checklist items: "You haven't completed all legal checklist items. Make sure you've engaged a settlement agent before proceeding."

## 8. Listing Settings Tab

### Edit Listing

Link to the listing edit page (same form as creation, pre-populated). Opens in a new view, not inline.

### Listing Actions

- **Pause Listing**: Temporarily hides from search results. Existing offers remain. Can be unpaused.
- **Withdraw Listing**: Permanently removes from market. Confirmation required. All active offers are expired and buyers notified.
- **Extend Closing Date**: If OPEN_OFFERS, a date picker to extend the closing date. Cannot shorten if offers exist.

### Listing Stats Detail

Show a simple chart (bar or line) of daily views over the last 30 days. Use Recharts library. No complex analytics at MVP — just the view trend.

## 9. Real-Time Updates

The seller dashboard uses WebSocket for offer notifications:
- When a new offer arrives: show a toast notification ("New offer: $845,000 from Buyer_7a3k") and update the offers table without page reload.
- When an offer is increased: show a toast and update the row.
- When an offer is withdrawn: show a toast and update the row status.

Connect to the same Socket.io server, joining the listing's room. The dashboard enriches the public offer data with buyer details from a separate API call.

## 10. Empty States

- **No offers yet**: "Your listing hasn't received any offers yet. Here are some tips to attract buyers: ensure your photos are high quality, your description is detailed, and your price is competitive."
- **No messages**: "No messages yet. Buyers will be able to contact you directly through your listing."
- **No listings**: "You haven't created any listings yet. [Create your first listing →]"

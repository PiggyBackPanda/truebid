# TrueBid — Listing Creation Specification

## Overview

A multi-step wizard that guides sellers through creating a property listing. Four steps: Property Details → Photos → Sale Method → Review & Publish. Progress is saved between steps so sellers can leave and return.

---

## 1. Route Structure

```
/listings/create              → Redirects to step 1
/listings/create/details      → Step 1: Property details
/listings/create/photos       → Step 2: Photo upload
/listings/create/method       → Step 3: Sale method selection
/listings/create/review       → Step 4: Review and publish
```

All routes are protected (require authentication). If user role is BUYER, auto-upgrade to BOTH on first access and show a brief notification: "We've updated your account so you can sell properties too."

## 2. Draft Persistence

When the seller completes Step 1 and clicks Continue, create a Listing record with `status: DRAFT` in the database. Subsequent steps update this draft. Store the draft listing ID in the URL as a query parameter: `/listings/create/photos?id=clxyz123`.

If the seller navigates away and returns to `/listings/create`, check for existing DRAFT listings. If one exists, offer to resume it ("You have a draft listing for [address]. Continue editing?") or start fresh.

## 3. Step 1 — Property Details

### Fields

**Address section:**
- Street address (required, free text, max 200 chars)
- Suburb (required, free text with autocomplete if possible, max 100 chars)
- State (required, dropdown of AustralianState enum — default to WA)
- Postcode (required, exactly 4 digits)

When the seller enters an address, attempt to geocode it using Mapbox Geocoding API to get latitude/longitude. If geocoding fails, that's fine — lat/lng remain null. Don't block the flow.

**Property details section:**
- Property type (required, dropdown: House, Apartment, Townhouse, Villa, Land, Rural, Other)
- Bedrooms (required, number picker 0–20, default 3)
- Bathrooms (required, number picker 0–10, default 1)
- Car spaces (required, number picker 0–10, default 1)
- Land size m² (optional, number input)
- Building size m² (optional, number input)
- Year built (optional, number input 1800–current year)

**Description section:**
- Textarea (required, min 50 chars, max 5000 chars)
- Character counter shown below
- "Generate with AI" button that calls Claude API to generate a description from the property details entered above. The generated text populates the textarea and the seller can edit it freely.

**Features section:**
- Multi-select tag input for property features
- Pre-populated suggestions: "Renovated kitchen", "Pool", "Solar panels", "Air conditioning", "Garden", "Garage", "Near beach", "Near schools", "Near shops", "Near transport", "Views", "Quiet street", "Corner block", "Granny flat", "Home office"
- Seller can add custom tags by typing and pressing Enter
- Stored as JSON string array in the `features` field

### AI Description Generation

When the seller clicks "Generate with AI":

1. Collect all entered property details (address, type, beds, baths, size, features).
2. Call the Anthropic API (Claude Sonnet) with a prompt:
   ```
   Write a compelling property listing description for:
   - Address: [address], [suburb] [state]
   - Type: [type], [beds] bed, [baths] bath, [cars] car
   - Land: [landSize]m², Building: [buildingSize]m²
   - Year built: [year]
   - Features: [features list]
   
   Write 150-250 words in a warm, professional Australian real estate style.
   Highlight the key selling points. Mention the suburb's lifestyle appeal.
   Do not make claims you cannot verify (e.g., "best in the area").
   Do not use ALL CAPS or excessive exclamation marks.
   ```
3. Stream the response into the textarea so the seller sees it appear.
4. The seller can edit freely after generation.

### Validation (Step 1)

```typescript
const listingDetailsSchema = z.object({
  streetAddress: z.string().min(1).max(200).trim(),
  suburb: z.string().min(1).max(100).trim(),
  state: z.nativeEnum(AustralianState),
  postcode: z.string().regex(/^\d{4}$/),
  propertyType: z.nativeEnum(PropertyType),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(10),
  carSpaces: z.number().int().min(0).max(10),
  landSizeM2: z.number().int().positive().optional(),
  buildingSizeM2: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  description: z.string().min(50).max(5000).trim(),
  features: z.array(z.string().max(50)).max(20).optional(),
});
```

## 4. Step 2 — Photos

### Photo Upload

- Drag-and-drop zone (full-width, dashed border, 📸 icon)
- Click to open file picker
- Accepted formats: JPG, PNG, WebP
- Max file size: 10MB per image
- Free tier: up to 15 photos
- Show upload progress per image (progress bar)

### Upload Process

1. Client validates file type and size.
2. Client requests a presigned S3 upload URL from `POST /api/listings/[id]/images/upload-url`.
3. Client uploads directly to S3 using the presigned URL (bypasses server for speed).
4. On S3 upload complete, client calls `POST /api/listings/[id]/images/confirm` with the S3 key.
5. Server generates thumbnail (400px wide) and medium (1200px wide) versions using sharp.
6. Server creates ListingImage record with URLs.
7. Client receives the image data and adds it to the grid.

### Photo Grid

- Display uploaded photos in a responsive grid (4 columns desktop, 3 tablet, 2 mobile).
- First photo has a "Cover Photo" badge — this is the primary image shown in search results.
- Each photo has: a drag handle (for reordering), a "Set as cover" button, and a delete button (trash icon).
- Drag to reorder. On drop, call `PATCH /api/listings/[id]/images/reorder` with the new order.

### Media Type

- Below the photo grid, two additional upload zones (smaller):
  - "Upload floor plan" (mediaType: floorplan)
  - "Add video tour link" (not a file upload — a URL input for YouTube/Vimeo)

### Validation (Step 2)

- At least 1 image must be uploaded before continuing to Step 3.
- Show a warning if fewer than 5 images: "Listings with more photos get 3x more views."

## 5. Step 3 — Sale Method

### Method Selection

Three cards, each clickable:

**Open Offers (recommended):**
- Amber border, "Recommended" badge
- Description: "Transparent public bidding with a closing date. All buyers see every offer — price, conditions, and timing. Creates competitive tension and typically achieves the best price."
- When selected, shows additional fields below:
  - **Closing date** (required, date picker, minimum 14 days from today, default 28 days). Show a note: "We recommend 28 days to give buyers time to arrange finance and inspections."
  - **Guide price or range** (optional). Two inputs: "From $" and "To $". If only "From" is filled, it's a single guide price. If both, it's a range. Displayed on the listing as "$X – $Y" or "Guide: $X".
  - **Minimum offer threshold** (optional). "Don't display offers below $___". Note: "Offers below this amount are still received — you'll see them in your dashboard — but they won't appear on the public board."
  - **Require holding deposit** (checkbox). If checked, shows a deposit amount input. Note: "Buyers placing offers above this threshold will be asked to provide a deposit receipt."

**Private Offers:**
- Description: "Buyers submit offers privately. Only you see them. More traditional approach, suitable for sensitive sales or high-end properties."
- When selected, shows: Guide price (optional), closing date (optional — "Set a deadline for yourself, or leave open").

**Fixed Price:**
- Description: "Set a firm price. Interested buyers express interest at your asking price. Simple and fast."
- When selected, shows: Price (required). Note: "Buyers will be able to express interest at this price through the messaging system."

### Validation (Step 3)

```typescript
const saleMethodSchema = z.discriminatedUnion("saleMethod", [
  z.object({
    saleMethod: z.literal("OPEN_OFFERS"),
    closingDate: z.string().refine(d => new Date(d) >= addDays(new Date(), 14), "Must be at least 14 days from now"),
    guidePriceCents: z.number().int().positive().optional(),
    guideRangeMaxCents: z.number().int().positive().optional(),
    minOfferCents: z.number().int().positive().optional(),
    requireDeposit: z.boolean().default(false),
    depositAmountCents: z.number().int().positive().optional(),
  }),
  z.object({
    saleMethod: z.literal("PRIVATE_OFFERS"),
    guidePriceCents: z.number().int().positive().optional(),
    closingDate: z.string().optional(),
  }),
  z.object({
    saleMethod: z.literal("FIXED_PRICE"),
    guidePriceCents: z.number().int().positive(),
  }),
]);
```

## 6. Step 4 — Review & Publish

### Display

Show a complete preview of the listing as it will appear to buyers:
- Cover photo (or placeholder if no photos — but we gate at Step 2)
- Price / guide price / price range
- Address
- Bed / bath / car / land size
- Description (first 200 chars with "read more")
- Sale method badge (Open Offers / Private Offers / Fixed Price)
- Closing date (if applicable)
- Photo count
- Features tags

### Legal Warning

Yellow warning box:
```
⚠️ Before you publish

Make sure you've engaged a settlement agent and have your legal documents
prepared. In Western Australia, you need a Contract of Sale (Offer and 
Acceptance form) ready before exchanging with a buyer.

TrueBid is a listing platform — we recommend getting independent legal 
advice before selling your property.

[Find a settlement agent →]    (links to referral partner or checklist)
```

### Publish Button

Green button: "Publish Listing — Free ✓"

On click:
1. Validate that user is VERIFIED. If not, redirect to `/verify-identity?returnUrl=/listings/create/review?id=[id]` with message "You need to verify your identity before publishing."
2. Call `POST /api/listings/[id]/publish`.
3. On success, redirect to the live listing page `/listings/[id]` with a celebratory toast: "Your listing is live! Buyers can now find your property."
4. On the live listing page, show a dismissible banner: "Want more exposure? List on realestate.com.au and Domain for $149. [Learn more]"

### Edit After Publish

Sellers can edit their listing at any time from the dashboard. All fields are editable except:
- Street address (contact support to change)
- Sale method (cannot change once offers exist)
- Closing date can only be extended, not shortened (if offers exist)

## 7. Progress Bar

All four steps show a horizontal progress bar at the top:
- Four segments: Details | Photos | Sale Method | Review
- Completed steps: amber fill
- Current step: amber fill with bold label
- Future steps: grey fill with muted label
- Clicking a completed step navigates back to it (only if the draft has been saved)

## 8. Mobile Experience

- Full-width form on mobile, no side margins.
- Number pickers use native mobile number inputs (type="number" with inputmode="numeric").
- Photo upload supports camera capture on mobile (`accept="image/*" capture="environment"`).
- The three sale method cards stack vertically on mobile.
- The publish button is sticky at the bottom on mobile during Step 4.

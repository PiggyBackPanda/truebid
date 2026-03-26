# TrueBid — Database Schema Specification

## Overview

This document defines the complete Prisma schema for TrueBid. Claude Code should use this to create `prisma/schema.prisma`. All models, relationships, enums, indexes, and constraints are specified below.

## Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Enums

```prisma
enum UserRole {
  BUYER
  SELLER
  BOTH
}

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  FAILED
}

enum ListingStatus {
  DRAFT
  ACTIVE
  UNDER_OFFER
  SOLD
  WITHDRAWN
  EXPIRED
}

enum SaleMethod {
  OPEN_OFFERS
  PRIVATE_OFFERS
  FIXED_PRICE
}

enum PropertyType {
  HOUSE
  APARTMENT
  TOWNHOUSE
  VILLA
  LAND
  RURAL
  OTHER
}

enum AustralianState {
  WA
  NSW
  VIC
  QLD
  SA
  TAS
  ACT
  NT
}

enum OfferStatus {
  ACTIVE
  WITHDRAWN
  ACCEPTED
  REJECTED
  EXPIRED
}

enum ConditionType {
  UNCONDITIONAL
  SUBJECT_TO_FINANCE
  SUBJECT_TO_BUILDING_PEST
  SUBJECT_TO_BOTH
  SUBJECT_TO_SALE
  OTHER
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
}

enum ChecklistItemStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}
```

## Models

### User

The core user model. Users can be buyers, sellers, or both. Identity verification is tracked here.

```prisma
model User {
  id                  String              @id @default(cuid())
  email               String              @unique
  emailVerified       DateTime?
  passwordHash        String
  firstName           String
  lastName            String
  phone               String?
  role                UserRole            @default(BUYER)
  
  // Identity verification
  verificationStatus  VerificationStatus  @default(UNVERIFIED)
  verificationDate    DateTime?
  verificationRef     String?             // External reference from GreenID
  
  // Profile
  avatarUrl           String?
  bio                 String?
  
  // Pseudonymous ID shown on public offer boards (e.g., "Buyer_7a3k")
  publicAlias         String              @unique @default(cuid())
  
  // Timestamps
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  lastLoginAt         DateTime?
  
  // Relations
  listings            Listing[]           // Properties this user is selling
  offers              Offer[]             // Offers this user has placed
  sentMessages        Message[]           @relation("SentMessages")
  receivedMessages    Message[]           @relation("ReceivedMessages")
  checklistProgress   ChecklistProgress[]
  sessions            Session[]
  
  @@index([email])
  @@index([verificationStatus])
  @@index([publicAlias])
}
```

### Session

For NextAuth.js session management.

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

### Listing

A property listed for sale on TrueBid.

```prisma
model Listing {
  id                String          @id @default(cuid())
  
  // Seller
  sellerId          String
  seller            User            @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  
  // Address
  streetAddress     String
  suburb            String
  state             AustralianState
  postcode          String
  
  // Geo (for map display and proximity search)
  latitude          Float?
  longitude         Float?
  
  // Property details
  propertyType      PropertyType
  bedrooms          Int
  bathrooms         Int
  carSpaces         Int
  landSizeM2        Int?            // Land size in square metres
  buildingSizeM2    Int?            // Building/floor size in square metres
  yearBuilt         Int?
  
  // Listing content
  title             String?         // Optional custom title
  description       String          @db.Text
  
  // Pricing (stored in cents)
  guidePriceCents   Int?            // Guide price or starting price
  guideRangeMaxCents Int?           // Upper end of price range (if range used)
  minOfferCents     Int?            // Minimum offer threshold for display on board
  
  // Sale method
  saleMethod        SaleMethod      @default(OPEN_OFFERS)
  
  // Open Offers specific
  closingDate       DateTime?       // When the offer period ends
  originalClosingDate DateTime?     // Original closing date (before any anti-snipe extensions)
  requireDeposit    Boolean         @default(false)
  depositAmountCents Int?           // Required holding deposit amount
  
  // Status
  status            ListingStatus   @default(DRAFT)
  publishedAt       DateTime?
  soldAt            DateTime?
  soldPriceCents    Int?            // Final sale price
  
  // REA/Domain integration
  reaDomainListed   Boolean         @default(false)
  reaListingRef     String?         // Reference ID on realestate.com.au
  domainListingRef  String?         // Reference ID on domain.com.au
  
  // Engagement metrics
  viewCount         Int             @default(0)
  saveCount         Int             @default(0)
  
  // Features & extras (flexible JSON for things like pool, garden, aircon, etc.)
  features          Json?           // Array of feature strings
  
  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  // Relations
  images            ListingImage[]
  offers            Offer[]
  messages          Message[]
  
  @@index([sellerId])
  @@index([status])
  @@index([saleMethod])
  @@index([suburb, state])
  @@index([postcode])
  @@index([propertyType])
  @@index([bedrooms])
  @@index([guidePriceCents])
  @@index([closingDate])
  @@index([publishedAt])
  @@index([latitude, longitude])
}
```

### ListingImage

Photos, floor plans, and videos associated with a listing.

```prisma
model ListingImage {
  id            String   @id @default(cuid())
  listingId     String
  listing       Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  
  url           String   // Full-size S3 URL
  thumbnailUrl  String   // Resized thumbnail S3 URL
  altText       String?
  
  displayOrder  Int      @default(0)
  isPrimary     Boolean  @default(false)  // Cover image
  
  // Type of media
  mediaType     String   @default("photo")  // photo, floorplan, video
  
  // Image dimensions (for responsive loading)
  width         Int?
  height        Int?
  sizeBytes     Int?
  
  createdAt     DateTime @default(now())
  
  @@index([listingId])
  @@index([listingId, displayOrder])
}
```

### Offer

An offer placed by a buyer on a listing. This is the core of the Open Offers system.

```prisma
model Offer {
  id              String          @id @default(cuid())
  
  // References
  listingId       String
  listing         Listing         @relation(fields: [listingId], references: [id], onDelete: Cascade)
  buyerId         String
  buyer           User            @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  
  // Offer details (amount in cents)
  amountCents     Int
  
  // Conditions
  conditionType   ConditionType   @default(UNCONDITIONAL)
  conditionText   String?         // Free text for OTHER condition type
  
  // Settlement
  settlementDays  Int             @default(30)
  
  // Personal note from buyer to seller
  personalNote    String?         @db.Text
  
  // Status
  status          OfferStatus     @default(ACTIVE)
  
  // Visibility (for private_offers sale method, offers may be hidden from public)
  isPublic        Boolean         @default(true)
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  withdrawnAt     DateTime?
  acceptedAt      DateTime?
  rejectedAt      DateTime?
  
  // History of amount changes
  history         OfferHistory[]
  
  @@unique([listingId, buyerId])  // One active offer per buyer per listing
  @@index([listingId])
  @@index([buyerId])
  @@index([listingId, status])
  @@index([listingId, amountCents])
  @@index([status])
  @@index([createdAt])
}
```

### OfferHistory

Tracks every change to an offer amount. When a buyer increases their offer, the old amount is recorded here.

```prisma
model OfferHistory {
  id              String   @id @default(cuid())
  
  offerId         String
  offer           Offer    @relation(fields: [offerId], references: [id], onDelete: Cascade)
  
  previousAmountCents  Int
  newAmountCents       Int
  
  // What changed
  changeType      String   // "increased", "conditions_changed"
  
  // Previous condition (if conditions changed)
  previousConditionType ConditionType?
  
  createdAt       DateTime @default(now())
  
  @@index([offerId])
  @@index([offerId, createdAt])
}
```

### Message

Buyer-seller communication within a listing context.

```prisma
model Message {
  id          String        @id @default(cuid())
  
  // Participants
  senderId    String
  sender      User          @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  recipientId String
  recipient   User          @relation("ReceivedMessages", fields: [recipientId], references: [id], onDelete: Cascade)
  
  // Context
  listingId   String
  listing     Listing       @relation(fields: [listingId], references: [id], onDelete: Cascade)
  
  // Content
  content     String        @db.Text
  
  // Status
  status      MessageStatus @default(SENT)
  readAt      DateTime?
  
  // Timestamps
  createdAt   DateTime      @default(now())
  
  @@index([senderId])
  @@index([recipientId])
  @@index([listingId])
  @@index([recipientId, status])  // For "unread messages" queries
  @@index([listingId, senderId, recipientId])  // For conversation threads
}
```

### ChecklistProgress

Tracks a seller's progress through their state-specific legal checklist.

```prisma
model ChecklistProgress {
  id          String              @id @default(cuid())
  
  userId      String
  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Which checklist item (references the static checklist config by item key)
  itemKey     String              // e.g., "wa_settlement_agent", "wa_title_search"
  state       AustralianState
  
  // Progress
  status      ChecklistItemStatus @default(NOT_STARTED)
  completedAt DateTime?
  notes       String?
  
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  @@unique([userId, itemKey])
  @@index([userId, state])
}
```

### ListingSave

Tracks when buyers save/favourite a listing.

```prisma
model ListingSave {
  id        String   @id @default(cuid())
  userId    String
  listingId String
  createdAt DateTime @default(now())
  
  @@unique([userId, listingId])
  @@index([userId])
  @@index([listingId])
}
```

### ListingView

Tracks listing page views for analytics. Deduplicated per user per day.

```prisma
model ListingView {
  id        String   @id @default(cuid())
  listingId String
  userId    String?  // Null for anonymous views
  ipHash    String?  // Hashed IP for anonymous deduplication
  date      DateTime @default(now()) @db.Date  // Date only, for daily dedup
  createdAt DateTime @default(now())
  
  @@unique([listingId, userId, date])
  @@unique([listingId, ipHash, date])
  @@index([listingId])
  @@index([listingId, date])
}
```

### ReferralPartner

Partner businesses (settlement agents, inspectors, brokers) for the referral revenue model.

```prisma
model ReferralPartner {
  id            String          @id @default(cuid())
  name          String
  businessType  String          // "settlement_agent", "building_inspector", "mortgage_broker", "photographer"
  contactEmail  String
  contactPhone  String?
  website       String?
  state         AustralianState
  suburbs       String[]        // Suburbs they service
  isActive      Boolean         @default(true)
  
  // Referral tracking
  referrals     Referral[]
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  @@index([businessType, state])
  @@index([isActive])
}

model Referral {
  id          String          @id @default(cuid())
  partnerId   String
  partner     ReferralPartner @relation(fields: [partnerId], references: [id])
  userId      String          // The user who was referred
  listingId   String?         // The listing context
  source      String          // "checklist", "listing_page", "post_sale"
  status      String          @default("pending")  // "pending", "contacted", "converted"
  createdAt   DateTime        @default(now())
  
  @@index([partnerId])
  @@index([userId])
}
```

## Seed Data

The seed script (`prisma/seed.ts`) should read fixture data from:
- `/docs/fixtures/sample-users.json`
- `/docs/fixtures/sample-listings.json`
- `/docs/fixtures/sample-offers.json`

It should create users first, then listings (assigned to seller users), then offers (assigned to buyer users on various listings). Generate realistic `publicAlias` values in the format `Buyer_` followed by 4 random alphanumeric characters.

## Migration Notes

- Run `npx prisma db push` for development (no migration files needed).
- Run `npx prisma migrate dev --name description` for production migrations.
- The `@@unique([listingId, buyerId])` constraint on Offer enforces one active offer per buyer per listing. If a buyer wants to change their offer, they UPDATE the existing record (and create an OfferHistory entry), not create a new one.
- Currency fields end in `Cents` to make it obvious they're stored in cents. The UI layer converts to dollars for display using a `formatCurrency` utility.
- The `publicAlias` on User is auto-generated and used on the public offer board instead of real names. The seller dashboard shows real names.

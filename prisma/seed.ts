import { PrismaClient, AustralianState, SaleMethod, PropertyType, ConditionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import fixtures from "../docs/fixtures/sample-fixtures.json";

const prisma = new PrismaClient();

function generatePublicAlias(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "Buyer_";
  for (let i = 0; i < 4; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function main() {
  console.log("Seeding database...");

  // Clear existing data (order matters for FK constraints)
  await prisma.offer.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ── Create users ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password1!", 10);

  const createdUsers: Record<string, { id: string; publicAlias: string }> = {};

  for (const u of fixtures.users) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: u.role as "BUYER" | "SELLER" | "BOTH",
        verificationStatus: u.verificationStatus as
          | "UNVERIFIED"
          | "PENDING"
          | "VERIFIED"
          | "FAILED",
        verificationDate:
          u.verificationStatus === "VERIFIED" ? new Date() : null,
        publicAlias: generatePublicAlias(),
      },
      select: { id: true, publicAlias: true },
    });
    createdUsers[u.email] = user;
    console.log(`  Created user: ${u.email}`);
  }

  // ── Create listings ─────────────────────────────────────────────────────────
  const createdListings: Record<string, string> = {}; // streetAddress → id

  for (const l of fixtures.listings) {
    const seller = createdUsers[l.sellerEmail];
    if (!seller) {
      console.warn(`  Seller not found: ${l.sellerEmail}, skipping listing`);
      continue;
    }

    let closingDate: Date | null = null;
    if (l.closingDaysFromNow !== null && l.closingDaysFromNow !== undefined) {
      closingDate = new Date(
        Date.now() + l.closingDaysFromNow * 24 * 60 * 60 * 1000
      );
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        streetAddress: l.streetAddress,
        suburb: l.suburb,
        state: l.state as AustralianState,
        postcode: l.postcode,
        latitude: l.latitude ?? undefined,
        longitude: l.longitude ?? undefined,
        propertyType: l.propertyType as PropertyType,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        carSpaces: l.carSpaces,
        landSizeM2: l.landSizeM2 ?? undefined,
        buildingSizeM2: l.buildingSizeM2 ?? undefined,
        yearBuilt: l.yearBuilt ?? undefined,
        description: l.description,
        guidePriceCents: l.guidePriceCents,
        saleMethod: l.saleMethod as SaleMethod,
        closingDate,
        originalClosingDate: closingDate,
        status: l.status as "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "SOLD" | "WITHDRAWN" | "EXPIRED",
        publishedAt: l.status === "ACTIVE" ? new Date() : null,
        features: l.features ?? undefined,
      },
      select: { id: true },
    });

    createdListings[l.streetAddress] = listing.id;
    console.log(`  Created listing: ${l.streetAddress}`);
  }

  // ── Create offers ───────────────────────────────────────────────────────────
  for (const o of fixtures.offers) {
    const buyer = createdUsers[o.buyerEmail];
    const listingId = createdListings[o.listingAddress];

    if (!buyer) {
      console.warn(`  Buyer not found: ${o.buyerEmail}, skipping offer`);
      continue;
    }
    if (!listingId) {
      console.warn(
        `  Listing not found: ${o.listingAddress}, skipping offer`
      );
      continue;
    }

    // Check if offer already exists (fixture has duplicate listing+buyer combos)
    const existing = await prisma.offer.findUnique({
      where: { listingId_buyerId: { listingId, buyerId: buyer.id } },
    });
    if (existing) {
      console.warn(
        `  Duplicate offer for ${o.buyerEmail} on ${o.listingAddress}, skipping`
      );
      continue;
    }

    await prisma.offer.create({
      data: {
        listingId,
        buyerId: buyer.id,
        amountCents: o.amountCents,
        conditionType: o.conditionType as ConditionType,
        settlementDays: o.settlementDays,
        personalNote: o.personalNote ?? undefined,
        status: "ACTIVE",
        isPublic: true,
      },
    });
    console.log(
      `  Created offer: ${o.buyerEmail} on ${o.listingAddress} — $${(o.amountCents / 100).toLocaleString()}`
    );
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

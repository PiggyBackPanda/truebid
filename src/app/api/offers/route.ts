import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireVerified,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { createOfferSchema } from "@/lib/validation";
import { checkAntiSnipe } from "@/lib/offers";
import { emitToListing } from "@/lib/socket";
import { sendNewOfferEmail } from "@/lib/email";

// POST /api/offers — place a new offer
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    requireVerified(user);

    const body = await req.json();
    const data = createOfferSchema.parse(body);

    // Fetch listing with seller info for validation and email
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        saleMethod: true,
        closingDate: true,
        minOfferCents: true,
        streetAddress: true,
        suburb: true,
        state: true,
        seller: {
          select: { email: true, firstName: true },
        },
      },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    if (listing.status !== "ACTIVE") {
      throw new ApiError(400, "LISTING_NOT_ACTIVE", "This listing is not accepting offers");
    }

    if (listing.closingDate && listing.closingDate < new Date()) {
      throw new ApiError(400, "LISTING_CLOSED", "The offer period for this listing has closed");
    }

    if (listing.sellerId === user.id) {
      throw new ApiError(403, "CANNOT_BID_OWN_LISTING", "You cannot place an offer on your own listing");
    }

    // Check for existing offer
    const existing = await prisma.offer.findUnique({
      where: { listingId_buyerId: { listingId: data.listingId, buyerId: user.id } },
      select: { id: true, status: true },
    });

    if (existing && existing.status === "ACTIVE") {
      throw new ApiError(
        409,
        "OFFER_EXISTS",
        "You already have an active offer on this listing. Use the increase endpoint to raise your offer."
      );
    }

    // Minimum offer check (OPEN_OFFERS only)
    if (
      listing.saleMethod === "OPEN_OFFERS" &&
      listing.minOfferCents !== null &&
      data.amountCents < listing.minOfferCents
    ) {
      throw new ApiError(400, "BELOW_MINIMUM", "Offer is below the minimum threshold", {
        minOfferCents: listing.minOfferCents,
      });
    }

    const isPublic = listing.saleMethod === "OPEN_OFFERS";
    const address = `${listing.streetAddress}, ${listing.suburb} ${listing.state}`;

    const offer = await prisma.offer.create({
      data: {
        listingId: data.listingId,
        buyerId: user.id,
        amountCents: data.amountCents,
        conditionType: data.conditionType,
        conditionText: data.conditionText ?? null,
        settlementDays: data.settlementDays,
        personalNote: data.personalNote ?? null,
        status: "ACTIVE",
        isPublic,
      },
      select: {
        id: true,
        amountCents: true,
        conditionType: true,
        conditionText: true,
        settlementDays: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: { select: { publicAlias: true } },
      },
    });

    const publicOffer = {
      id: offer.id,
      publicAlias: offer.buyer.publicAlias,
      amountCents: offer.amountCents,
      conditionType: offer.conditionType,
      conditionText: offer.conditionText,
      settlementDays: offer.settlementDays,
      status: offer.status,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };

    if (isPublic) {
      emitToListing(listing.id, "offer:new", {
        listingId: listing.id,
        offer: publicOffer,
      });
    }

    // Anti-snipe check
    await checkAntiSnipe(
      { ...listing, closingDate: listing.closingDate },
      "offer:new"
    );

    // Notify seller
    sendNewOfferEmail({
      sellerEmail: listing.seller.email,
      sellerName: listing.seller.firstName,
      listingAddress: address,
      amountCents: data.amountCents,
    }).catch(() => {/* non-critical — log handled inside sendEmail */});

    return Response.json(
      {
        offer: {
          id: offer.id,
          publicAlias: offer.buyer.publicAlias,
          amountCents: offer.amountCents,
          conditionType: offer.conditionType,
          settlementDays: offer.settlementDays,
          status: offer.status,
          createdAt: offer.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

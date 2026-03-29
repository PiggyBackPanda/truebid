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
import { sendNewOfferEmail, sendHigherOfferEmail } from "@/lib/email";
import { Redis } from "@upstash/redis";

// GET /api/offers: list the authenticated buyer's own offers
export async function GET() {
  try {
    const user = await requireAuth();

    const offers = await prisma.offer.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amountCents: true,
        conditionType: true,
        conditionText: true,
        settlementDays: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        listing: {
          select: {
            id: true,
            streetAddress: true,
            suburb: true,
            state: true,
            postcode: true,
            status: true,
            closingDate: true,
          },
        },
      },
    });

    return Response.json({
      offers: offers.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        listing: {
          ...o.listing,
          closingDate: o.listing.closingDate?.toISOString() ?? null,
        },
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/offers: place a new offer
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
        requireInspection: true,
        seller: {
          select: { email: true, firstName: true },
        },
      },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    if (listing.status === "COMING_SOON") {
      throw new ApiError(400, "LISTING_NOT_YET_OPEN", "This listing is not yet accepting offers");
    }
    if (listing.status === "INSPECTIONS_OPEN") {
      throw new ApiError(400, "OFFERS_NOT_YET_OPEN", "This listing is not yet open for offers. Inspections are underway");
    }
    if (listing.status !== "ACTIVE") {
      throw new ApiError(400, "LISTING_NOT_ACTIVE", "This listing is not accepting offers");
    }

    if (listing.closingDate && listing.closingDate < new Date()) {
      throw new ApiError(400, "LISTING_CLOSED", "The offer period for this listing has closed");
    }

    if (listing.sellerId === user.id) {
      throw new ApiError(403, "CANNOT_OFFER_OWN_LISTING", "You cannot place an offer on your own listing");
    }

    // Inspection gate: buyer must have attended an inspection if seller requires it
    if (listing.requireInspection) {
      const attendedBooking = await prisma.inspectionBooking.findFirst({
        where: {
          buyerId: user.id,
          status: "ATTENDED",
          slot: { listingId: data.listingId },
        },
        select: { id: true },
      });

      if (!attendedBooking) {
        // Include next 3 upcoming slots so the client can show booking options
        const upcomingSlots = await prisma.inspectionSlot.findMany({
          where: {
            listingId: data.listingId,
            status: "SCHEDULED",
            startTime: { gt: new Date() },
          },
          orderBy: { startTime: "asc" },
          take: 3,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            maxGroups: true,
            _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
          },
        });

        throw new ApiError(
          403,
          "INSPECTION_REQUIRED",
          "You must attend an inspection before placing an offer on this property.",
          {
            slots: upcomingSlots.map((s) => ({
              id: s.id,
              startTime: s.startTime.toISOString(),
              endTime: s.endTime.toISOString(),
              spotsRemaining: s.maxGroups - s._count.bookings,
            })),
          }
        );
      }
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
        legalAcknowledgedAt: new Date(data.legalAcknowledgedAt),
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
      listingId: listing.id,
      amountCents: data.amountCents,
    }).catch(() => {/* non-critical, log handled inside sendEmail */});

    // Notify buyers whose offers have been exceeded
    ;(async () => {
      const affectedOffers = await prisma.offer.findMany({
        where: {
          listingId: data.listingId,
          status: "ACTIVE",
          id: { not: offer.id },
          amountCents: { lt: data.amountCents },
        },
        select: {
          id: true,
          amountCents: true,
          buyerId: true,
          buyer: { select: { email: true, firstName: true } },
        },
      });

      if (affectedOffers.length === 0) return;

      // Only notify while the offer window is still open
      if (listing.closingDate !== null && listing.closingDate <= new Date()) return;

      let redisClient: Redis | null = null;
      if (
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN
      ) {
        redisClient = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
      }

      for (const affectedOffer of affectedOffers) {
        const rateLimitKey = `higher_offer_email:${listing.id}:${affectedOffer.buyerId}`;

        if (redisClient) {
          const existing = await redisClient.get(rateLimitKey);
          if (existing !== null) continue;
        }

        await sendHigherOfferEmail({
          buyerEmail: affectedOffer.buyer.email,
          buyerName: affectedOffer.buyer.firstName,
          listingAddress: address,
          listingId: listing.id,
          buyerOfferCents: affectedOffer.amountCents,
          highestOfferCents: data.amountCents,
          closingDate: listing.closingDate,
        });

        if (redisClient) {
          await redisClient.setex(rateLimitKey, 600, "1");
        }
      }
    })().catch(() => { /* non-critical */ });

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

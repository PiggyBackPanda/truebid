import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOwner,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { emitToListing } from "@/lib/socket";
import { sendOfferAcceptedEmail, sendOfferRejectedEmail } from "@/lib/email";

// POST /api/offers/[id]/accept — seller accepts an offer
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      select: {
        id: true,
        listingId: true,
        amountCents: true,
        status: true,
        buyer: {
          select: { id: true, email: true, firstName: true },
        },
        listing: {
          select: {
            id: true,
            sellerId: true,
            status: true,
            streetAddress: true,
            suburb: true,
            state: true,
          },
        },
      },
    });

    if (!offer) {
      throw new ApiError(404, "NOT_FOUND", "Offer not found");
    }

    requireOwner(user, offer.listing.sellerId);

    if (offer.status !== "ACTIVE") {
      throw new ApiError(400, "INVALID_STATUS", "Only active offers can be accepted");
    }

    if (offer.listing.status !== "ACTIVE") {
      throw new ApiError(400, "LISTING_NOT_ACTIVE", "This listing is not in a state that allows offer acceptance");
    }

    const address = `${offer.listing.streetAddress}, ${offer.listing.suburb} ${offer.listing.state}`;
    const now = new Date();

    // Fetch all OTHER active offers so we can notify their buyers
    const otherActiveOffers = await prisma.offer.findMany({
      where: {
        listingId: offer.listingId,
        status: "ACTIVE",
        id: { not: id },
      },
      select: {
        id: true,
        amountCents: true,
        buyer: { select: { email: true, firstName: true } },
      },
    });

    await prisma.$transaction([
      // Accept this offer
      prisma.offer.update({
        where: { id },
        data: { status: "ACCEPTED", acceptedAt: now },
      }),
      // Move listing to UNDER_OFFER
      prisma.listing.update({
        where: { id: offer.listingId },
        data: { status: "UNDER_OFFER" },
      }),
      // Reject all other active offers
      prisma.offer.updateMany({
        where: { listingId: offer.listingId, status: "ACTIVE", id: { not: id } },
        data: { status: "REJECTED", rejectedAt: now },
      }),
      // Open a secure conversation between buyer and seller
      prisma.conversation.create({
        data: {
          listingId: offer.listingId,
          offerId: id,
          buyerId: offer.buyer.id,
          sellerId: offer.listing.sellerId,
        },
      }),
    ]);

    // Broadcast acceptance to all listing viewers
    emitToListing(offer.listingId, "offer:accepted", {
      listingId: offer.listingId,
      offerId: id,
    });

    // Email winning buyer
    sendOfferAcceptedEmail({
      buyerEmail: offer.buyer.email,
      buyerName: offer.buyer.firstName,
      listingAddress: address,
      amountCents: offer.amountCents,
    }).catch(() => {});

    // Email all rejected buyers
    for (const rejected of otherActiveOffers) {
      sendOfferRejectedEmail({
        buyerEmail: rejected.buyer.email,
        buyerName: rejected.buyer.firstName,
        listingAddress: address,
        amountCents: rejected.amountCents,
      }).catch(() => {});
    }

    return Response.json({
      offer: { id, status: "ACCEPTED", acceptedAt: now.toISOString() },
      listing: { id: offer.listingId, status: "UNDER_OFFER" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

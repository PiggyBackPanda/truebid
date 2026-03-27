import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOwner,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { sendOfferRejectedEmail } from "@/lib/email";

// POST /api/offers/[id]/reject — seller explicitly rejects one offer
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
          select: { email: true, firstName: true },
        },
        listing: {
          select: {
            sellerId: true,
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
      throw new ApiError(400, "INVALID_STATUS", "Only active offers can be rejected");
    }

    const now = new Date();
    await prisma.offer.update({
      where: { id },
      data: { status: "REJECTED", rejectedAt: now },
    });

    // No public WebSocket event — individual rejections are private
    const address = `${offer.listing.streetAddress}, ${offer.listing.suburb} ${offer.listing.state}`;

    sendOfferRejectedEmail({
      buyerEmail: offer.buyer.email,
      buyerName: offer.buyer.firstName,
      listingAddress: address,
      amountCents: offer.amountCents,
    }).catch(() => {});

    return Response.json({
      offer: { id, status: "REJECTED", rejectedAt: now.toISOString() },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

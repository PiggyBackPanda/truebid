import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOwner,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { increaseOfferSchema } from "@/lib/validation";
import { checkAntiSnipe } from "@/lib/offers";
import { emitToListing } from "@/lib/socket";

// PATCH /api/offers/[id]/increase
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        listingId: true,
        amountCents: true,
        conditionType: true,
        status: true,
        listing: {
          select: {
            id: true,
            status: true,
            saleMethod: true,
            closingDate: true,
          },
        },
        buyer: { select: { publicAlias: true } },
      },
    });

    if (!offer) {
      throw new ApiError(404, "NOT_FOUND", "Offer not found");
    }

    requireOwner(user, offer.buyerId);

    if (offer.status !== "ACTIVE") {
      throw new ApiError(400, "INVALID_STATUS", "Only active offers can be increased");
    }

    if (offer.listing.status !== "ACTIVE") {
      throw new ApiError(400, "LISTING_NOT_ACTIVE", "This listing is no longer accepting offers");
    }

    if (offer.listing.closingDate && offer.listing.closingDate < new Date()) {
      throw new ApiError(400, "LISTING_CLOSED", "The offer period for this listing has closed");
    }

    const body = await req.json();
    const data = increaseOfferSchema.parse(body);

    if (data.amountCents <= offer.amountCents) {
      throw new ApiError(
        400,
        "AMOUNT_NOT_INCREASED",
        `New amount must be greater than current offer of ${offer.amountCents} cents`
      );
    }

    const conditionChanged =
      data.conditionType !== undefined && data.conditionType !== offer.conditionType;

    const [updated] = await prisma.$transaction([
      prisma.offer.update({
        where: { id },
        data: {
          amountCents: data.amountCents,
          ...(data.conditionType ? { conditionType: data.conditionType } : {}),
          ...(data.conditionText !== undefined
            ? { conditionText: data.conditionText ?? null }
            : {}),
          ...(data.settlementDays ? { settlementDays: data.settlementDays } : {}),
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
      }),
      prisma.offerHistory.create({
        data: {
          offerId: id,
          previousAmountCents: offer.amountCents,
          newAmountCents: data.amountCents,
          changeType: conditionChanged ? "conditions_changed" : "increased",
          ...(conditionChanged
            ? { previousConditionType: offer.conditionType }
            : {}),
        },
      }),
    ]);

    const publicOffer = {
      id: updated.id,
      publicAlias: updated.buyer.publicAlias,
      amountCents: updated.amountCents,
      conditionType: updated.conditionType,
      conditionText: updated.conditionText,
      settlementDays: updated.settlementDays,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    emitToListing(offer.listingId, "offer:updated", {
      listingId: offer.listingId,
      offer: publicOffer,
    });

    await checkAntiSnipe(offer.listing, "offer:updated");

    return Response.json({ offer: publicOffer });
  } catch (error) {
    return errorResponse(error);
  }
}

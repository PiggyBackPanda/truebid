import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOwner,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { emitToListing } from "@/lib/socket";

// POST /api/offers/[id]/withdraw
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
        buyerId: true,
        listingId: true,
        status: true,
      },
    });

    if (!offer) {
      throw new ApiError(404, "NOT_FOUND", "Offer not found");
    }

    requireOwner(user, offer.buyerId);

    if (offer.status !== "ACTIVE") {
      throw new ApiError(
        400,
        "INVALID_STATUS",
        "Only active offers can be withdrawn"
      );
    }

    const now = new Date();
    const updated = await prisma.offer.update({
      where: { id },
      data: { status: "WITHDRAWN", withdrawnAt: now },
      select: { id: true, status: true, withdrawnAt: true },
    });

    // Withdrawn offers stay visible on the board: broadcast the withdrawal
    emitToListing(offer.listingId, "offer:withdrawn", {
      listingId: offer.listingId,
      offerId: id,
    });

    return Response.json({
      offer: {
        id: updated.id,
        status: updated.status,
        withdrawnAt: updated.withdrawnAt?.toISOString(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

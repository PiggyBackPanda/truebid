import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOwner,
  errorResponse,
  ApiError,
} from "@/lib/api-helpers";
import { emitToListing } from "@/lib/socket";

// POST /api/listings/[id]/withdraw — withdraw an active listing
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    if (listing.status !== "ACTIVE" && listing.status !== "UNDER_OFFER") {
      throw new ApiError(
        400,
        "INVALID_STATUS",
        "Only active or under-offer listings can be withdrawn"
      );
    }

    await prisma.$transaction([
      // Withdraw the listing
      prisma.listing.update({
        where: { id },
        data: { status: "WITHDRAWN" },
      }),
      // Expire all active offers on this listing
      prisma.offer.updateMany({
        where: { listingId: id, status: "ACTIVE" },
        data: { status: "EXPIRED" },
      }),
    ]);

    // Notify all viewers
    emitToListing(id, "listing:withdrawn", { listingId: id });

    return Response.json({
      listing: { id, status: "WITHDRAWN" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

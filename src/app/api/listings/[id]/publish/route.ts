import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireVerified, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";

// POST /api/listings/[id]/publish
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    requireVerified(user);

    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        status: true,
        saleMethod: true,
        closingDate: true,
        description: true,
        images: { select: { id: true }, take: 1 },
      },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    if (listing.status !== "DRAFT") {
      throw new ApiError(400, "INVALID_STATUS", "Only draft listings can be published");
    }

    if (listing.images.length === 0) {
      throw new ApiError(400, "NO_IMAGES", "At least one image is required before publishing");
    }

    if (listing.saleMethod === "OPEN_OFFERS") {
      if (!listing.closingDate) {
        throw new ApiError(400, "MISSING_CLOSING_DATE", "Open Offers listings require a closing date");
      }
      const minDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      if (new Date(listing.closingDate) < minDate) {
        throw new ApiError(400, "INVALID_CLOSING_DATE", "Closing date must be at least 14 days in the future");
      }
    }

    const published = await prisma.listing.update({
      where: { id },
      data: {
        status: "ACTIVE",
        publishedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        streetAddress: true,
        suburb: true,
      },
    });

    return Response.json({ listing: published });
  } catch (error) {
    return errorResponse(error);
  }
}

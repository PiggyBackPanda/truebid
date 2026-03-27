import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { reorderImagesSchema } from "@/lib/validation";

// PATCH /api/listings/[id]/images/reorder
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    const body = await req.json();
    const { imageIds } = reorderImagesSchema.parse(body);

    // Update sortOrder for each image in the provided order
    await Promise.all(
      imageIds.map((imageId, index) =>
        prisma.listingImage.updateMany({
          where: { id: imageId, listingId: id },
          data: { displayOrder: index },
        })
      )
    );

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

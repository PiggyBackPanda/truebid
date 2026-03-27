import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";

// DELETE /api/listings/[id]/images/[imageId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, imageId } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    const image = await prisma.listingImage.findUnique({
      where: { id: imageId },
      select: { id: true, listingId: true },
    });

    if (!image || image.listingId !== id) {
      throw new ApiError(404, "NOT_FOUND", "Image not found");
    }

    await prisma.listingImage.delete({ where: { id: imageId } });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

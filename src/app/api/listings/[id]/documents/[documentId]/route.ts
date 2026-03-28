import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";

// DELETE /api/listings/[id]/documents/[documentId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, documentId } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    const document = await prisma.listingDocument.findUnique({
      where: { id: documentId },
      select: { id: true, listingId: true },
    });

    if (!document || document.listingId !== id) {
      throw new ApiError(404, "NOT_FOUND", "Document not found");
    }

    await prisma.listingDocument.delete({ where: { id: documentId } });

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

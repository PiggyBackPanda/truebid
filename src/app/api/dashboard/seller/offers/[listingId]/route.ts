import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";

// GET /api/dashboard/seller/offers/[listingId]: full offer details with buyer info (seller only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const user = await requireAuth();
    const { listingId } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    const offers = await prisma.offer.findMany({
      where: { listingId },
      orderBy: [{ amountCents: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        amountCents: true,
        conditionType: true,
        conditionText: true,
        settlementDays: true,
        personalNote: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            publicAlias: true,
            verificationStatus: true,
          },
        },
        history: {
          orderBy: { createdAt: "desc" },
          select: {
            previousAmountCents: true,
            newAmountCents: true,
            changeType: true,
            createdAt: true,
          },
        },
      },
    });

    return Response.json({
      offers: offers.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        history: o.history.map((h) => ({
          ...h,
          createdAt: h.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

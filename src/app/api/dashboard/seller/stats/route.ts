import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";

// GET /api/dashboard/seller/stats: aggregated stats for the current seller
export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== "SELLER" && user.role !== "BOTH") {
      throw new ApiError(403, "FORBIDDEN", "Seller access required");
    }

    const listings = await prisma.listing.findMany({
      where: {
        sellerId: user.id,
        status: { in: ["ACTIVE", "UNDER_OFFER"] },
      },
      select: {
        id: true,
        viewCount: true,
        saveCount: true,
        _count: { select: { offers: { where: { status: "ACTIVE" } } } },
        offers: {
          where: { status: "ACTIVE" },
          select: { amountCents: true },
          orderBy: { amountCents: "desc" },
          take: 1,
        },
      },
    });

    const listingIds = listings.map((l) => l.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [viewsToday, savesListingToday, unreadMessages] = await Promise.all([
      prisma.listingView.count({
        where: { listingId: { in: listingIds }, date: { gte: today } },
      }),
      prisma.favourite.count({
        where: { listingId: { in: listingIds }, createdAt: { gte: today } },
      }),
      prisma.conversationMessage.count({
        where: {
          senderId: { not: user.id },
          readAt: null,
          conversation: { sellerId: user.id },
        },
      }),
    ]);

    const totalViews = listings.reduce((sum, l) => sum + l.viewCount, 0);
    const totalSaves = listings.reduce((sum, l) => sum + l.saveCount, 0);
    const activeOffers = listings.reduce(
      (sum, l) => sum + l._count.offers,
      0
    );
    const highestOfferCents =
      listings.reduce<number | null>((best, l) => {
        const top = l.offers[0]?.amountCents ?? null;
        if (top === null) return best;
        if (best === null) return top;
        return top > best ? top : best;
      }, null);

    return Response.json({
      stats: {
        totalViews,
        totalViewsToday: viewsToday,
        totalSaves,
        totalSavesToday: savesListingToday,
        activeOffers,
        highestOfferCents,
        unreadMessages,
        activeListings: listings.length,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

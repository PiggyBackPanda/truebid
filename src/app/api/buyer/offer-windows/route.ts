import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";

// GET /api/buyer/offer-windows
// Returns listings where the buyer has an active offer or has favourited,
// filtered to those with an upcoming or open offer window.
export async function GET() {
  try {
    const user = await requireAuth();

    // SET 1: listings where buyer has an active offer
    const activeOfferRows = await prisma.offer.findMany({
      where: { buyerId: user.id, status: "ACTIVE" },
      select: {
        id: true,
        amountCents: true,
        status: true,
        listing: {
          select: {
            id: true,
            streetAddress: true,
            suburb: true,
            state: true,
            postcode: true,
            status: true,
            closingDate: true,
            guidePriceCents: true,
            images: {
              select: { thumbnailUrl: true },
              orderBy: { displayOrder: "asc" },
              take: 1,
            },
            offers: {
              where: { status: "ACTIVE" },
              select: { amountCents: true },
              orderBy: { amountCents: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    // SET 2: favourited listings with an active offer window
    const favouriteRows = await prisma.favourite.findMany({
      where: {
        userId: user.id,
        listing: { status: { in: ["ACTIVE", "COMING_SOON"] } },
      },
      select: {
        listing: {
          select: {
            id: true,
            streetAddress: true,
            suburb: true,
            state: true,
            postcode: true,
            status: true,
            closingDate: true,
            guidePriceCents: true,
            images: {
              select: { thumbnailUrl: true },
              orderBy: { displayOrder: "asc" },
              take: 1,
            },
            offers: {
              where: { status: "ACTIVE" },
              select: { amountCents: true },
              orderBy: { amountCents: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    // Build a map from listingId -> myOffer (from SET 1)
    const myOfferByListingId = new Map<
      string,
      { id: string; amountCents: number; status: string }
    >();
    for (const row of activeOfferRows) {
      myOfferByListingId.set(row.listing.id, {
        id: row.id,
        amountCents: row.amountCents,
        status: row.status,
      });
    }

    // Collect listing shapes from both sets, deduplicate by listing.id
    type ListingShape = (typeof activeOfferRows)[number]["listing"];
    const listingMap = new Map<string, ListingShape>();

    for (const row of activeOfferRows) {
      listingMap.set(row.listing.id, row.listing);
    }
    for (const row of favouriteRows) {
      if (!listingMap.has(row.listing.id)) {
        listingMap.set(row.listing.id, row.listing);
      }
    }

    const now = new Date();

    // Filter, annotate, and sort
    const entries = Array.from(listingMap.values())
      .filter((listing) => {
        if (!listing.closingDate) {
          // No closing date: include if status is ACTIVE or COMING_SOON
          return listing.status === "ACTIVE" || listing.status === "COMING_SOON";
        }
        // Has a closing date: include only if it's in the future
        return new Date(listing.closingDate) > now;
      })
      .map((listing) => {
        const myOffer = myOfferByListingId.get(listing.id) ?? null;
        const highestOfferCents = listing.offers[0]?.amountCents ?? null;
        const isHighest =
          myOffer !== null &&
          (highestOfferCents === null || myOffer.amountCents === highestOfferCents);
        return {
          listingId: listing.id,
          streetAddress: listing.streetAddress,
          suburb: listing.suburb,
          state: listing.state,
          postcode: listing.postcode,
          status: listing.status,
          closingDate: listing.closingDate
            ? (listing.closingDate as Date).toISOString()
            : null,
          guidePriceCents: listing.guidePriceCents,
          thumbnailUrl: listing.images[0]?.thumbnailUrl ?? null,
          myOffer,
          highestOfferCents,
          isHighest,
        };
      })
      // Sort by closingDate ascending, null closingDates last
      .sort((a, b) => {
        if (a.closingDate === null && b.closingDate === null) return 0;
        if (a.closingDate === null) return 1;
        if (b.closingDate === null) return -1;
        return new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime();
      });

    return Response.json({ entries });
  } catch (error) {
    return errorResponse(error);
  }
}

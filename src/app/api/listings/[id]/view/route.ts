import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";
import { emitToListing } from "@/lib/socket";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/listings/[id]/view
// Records a registered viewer and returns current viewerCount + offerCount.
// Anonymous users are not tracked; returns null viewerCount for unauthenticated requests.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      // Do not track anonymous views via this endpoint
      const offerCount = await prisma.offer.count({
        where: { listingId: id, status: "ACTIVE" },
      });
      return Response.json({ viewerCount: null, offerCount });
    }

    // Derive today's date in Australia/Perth timezone
    const perthDateStr = new Date().toLocaleDateString("en-AU", {
      timeZone: "Australia/Perth",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // en-AU format is DD/MM/YYYY, parse it into a Date
    const [day, month, year] = perthDateStr.split("/");
    const today = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    // Upsert view record for today
    await prisma.listingView.upsert({
      where: {
        listingId_userId_date: {
          listingId: id,
          userId,
          date: today,
        },
      },
      create: {
        listingId: id,
        userId,
        date: today,
      },
      update: {},
    });

    // Count unique registered viewers (distinct userIds, not null)
    const viewerCount = await prisma.listingView.count({
      where: {
        listingId: id,
        userId: { not: null },
      },
    });

    // Count active offers
    const offerCount = await prisma.offer.count({
      where: { listingId: id, status: "ACTIVE" },
    });

    // Broadcast updated stats to all connected clients in this listing room
    emitToListing(id, "listing:stats", {
      listingId: id,
      viewerCount,
      offerCount,
    });

    return Response.json({ viewerCount, offerCount });
  } catch (error) {
    return errorResponse(error);
  }
}

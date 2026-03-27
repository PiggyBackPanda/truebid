import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const toggleSchema = z.object({
  listingId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorised", code: "UNAUTHENTICATED" }, { status: 401 });
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;

    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const { listingId } = parsed.data;

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const existing = await prisma.favourite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favourited: false });
    } else {
      await prisma.favourite.create({ data: { userId, listingId } });
      return NextResponse.json({ favourited: true });
    }
  } catch (error) {
    logger.error("[POST /api/favourites]", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorised", code: "UNAUTHENTICATED" }, { status: 401 });
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;

    const favourites = await prisma.favourite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
            streetAddress: true,
            suburb: true,
            state: true,
            postcode: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            carSpaces: true,
            landSizeM2: true,
            guidePriceCents: true,
            saleMethod: true,
            closingDate: true,
            status: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, thumbnailUrl: true },
            },
            _count: {
              select: { offers: { where: { status: "ACTIVE" } } },
            },
          },
        },
      },
    });

    return NextResponse.json({ favourites });
  } catch (error) {
    logger.error("[GET /api/favourites]", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

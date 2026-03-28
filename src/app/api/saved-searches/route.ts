import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().max(80).optional(),
  suburb: z.string().max(100).optional(),
  propertyType: z.string().optional(),
  saleMethod: z.string().optional(),
  minPriceCents: z.number().int().positive().optional(),
  maxPriceCents: z.number().int().positive().optional(),
  minBeds: z.number().int().min(1).max(10).optional(),
  minBaths: z.number().int().min(1).max(10).optional(),
});

// GET /api/saved-searches: list current user's saved searches
export async function GET() {
  try {
    const user = await requireAuth();

    const searches = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        suburb: true,
        propertyType: true,
        saleMethod: true,
        minPriceCents: true,
        maxPriceCents: true,
        minBeds: true,
        minBaths: true,
        createdAt: true,
      },
    });

    return Response.json({ searches });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/saved-searches: create a new saved search
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const data = createSchema.parse(body);

    // Require at least one filter
    const hasFilter = Object.values(data).some((v) => v !== undefined && v !== null);
    if (!hasFilter) {
      throw new ApiError(400, "NO_FILTERS", "At least one search filter is required");
    }

    // Cap at 20 saved searches per user
    const count = await prisma.savedSearch.count({ where: { userId: user.id } });
    if (count >= 20) {
      throw new ApiError(400, "LIMIT_REACHED", "You can save up to 20 searches");
    }

    const search = await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: data.name,
        suburb: data.suburb,
        propertyType: data.propertyType,
        saleMethod: data.saleMethod,
        minPriceCents: data.minPriceCents,
        maxPriceCents: data.maxPriceCents,
        minBeds: data.minBeds,
        minBaths: data.minBaths,
      },
      select: {
        id: true,
        name: true,
        suburb: true,
        propertyType: true,
        saleMethod: true,
        minPriceCents: true,
        maxPriceCents: true,
        minBeds: true,
        minBaths: true,
        createdAt: true,
      },
    });

    return Response.json({ search }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

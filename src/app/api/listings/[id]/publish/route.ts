import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, requireVerified, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";

const bodySchema = z.object({
  // "coming_soon" = publish as COMING_SOON (default)
  // "active"      = go straight to ACTIVE (requires closingDate for Open Offers)
  mode: z.enum(["coming_soon", "active"]).default("coming_soon"),
});

// POST /api/listings/[id]/publish
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    requireVerified(user);

    const { id } = await params;

    // Body is optional — defaults to coming_soon
    let mode: "coming_soon" | "active" = "coming_soon";
    try {
      const body = await req.json();
      const parsed = bodySchema.safeParse(body);
      if (parsed.success) mode = parsed.data.mode;
    } catch {
      // empty body — use default mode
    }

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

    // Going straight to ACTIVE requires a valid closing date for Open Offers
    if (mode === "active" && listing.saleMethod === "OPEN_OFFERS") {
      if (!listing.closingDate) {
        throw new ApiError(400, "MISSING_CLOSING_DATE", "Open Offers listings require a closing date to go live");
      }
      const minDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      if (new Date(listing.closingDate) < minDate) {
        throw new ApiError(400, "INVALID_CLOSING_DATE", "Closing date must be at least 14 days in the future");
      }
    }

    const newStatus = mode === "active" ? "ACTIVE" : "COMING_SOON";

    const published = await prisma.listing.update({
      where: { id },
      data: {
        status: newStatus,
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

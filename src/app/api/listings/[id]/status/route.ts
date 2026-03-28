import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, requireVerified, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";

// Valid status transitions. Key = from, Value = allowed destinations.
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT:            ["COMING_SOON", "ACTIVE"],
  COMING_SOON:      ["INSPECTIONS_OPEN", "ACTIVE", "WITHDRAWN"],
  INSPECTIONS_OPEN: ["ACTIVE", "COMING_SOON", "WITHDRAWN"],
  ACTIVE:           ["UNDER_OFFER", "WITHDRAWN"],
  UNDER_OFFER:      ["ACTIVE", "SOLD", "WITHDRAWN"],
};

const bodySchema = z.object({
  status: z.enum(["COMING_SOON", "INSPECTIONS_OPEN", "ACTIVE", "UNDER_OFFER", "SOLD", "WITHDRAWN"]),
});

// PATCH /api/listings/[id]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    requireVerified(user);

    const { id } = await params;
    const body = await req.json();
    const { status: newStatus } = bodySchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        status: true,
        saleMethod: true,
        closingDate: true,
        description: true,
        propertyType: true,
        bedrooms: true,
        bathrooms: true,
        carSpaces: true,
        images: { select: { id: true }, take: 1 },
      },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    // Validate transition
    const allowed = VALID_TRANSITIONS[listing.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(
        400,
        "INVALID_TRANSITION",
        `Cannot transition listing from ${listing.status} to ${newStatus}`
      );
    }

    // Validate completeness when publishing to any visible state
    if (newStatus === "COMING_SOON" || newStatus === "ACTIVE") {
      const missing: string[] = [];
      if (!listing.description?.trim()) missing.push("description");
      if (!listing.propertyType) missing.push("propertyType");
      if (listing.bedrooms == null) missing.push("bedrooms");
      if (listing.bathrooms == null) missing.push("bathrooms");
      if (listing.carSpaces == null) missing.push("carSpaces");
      if (listing.images.length === 0) missing.push("images");

      if (missing.length > 0) {
        throw new ApiError(400, "LISTING_INCOMPLETE", "Listing is missing required fields before publishing", {
          missingFields: missing,
        });
      }
    }

    // For ACTIVE, Open Offers listings need a future closing date
    if (newStatus === "ACTIVE" && listing.saleMethod === "OPEN_OFFERS") {
      if (!listing.closingDate) {
        throw new ApiError(400, "MISSING_CLOSING_DATE", "Open Offers listings require a closing date before going live");
      }
      if (new Date(listing.closingDate) <= new Date()) {
        throw new ApiError(400, "INVALID_CLOSING_DATE", "Closing date must be in the future");
      }
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    // Record publishedAt on first exit from DRAFT
    if (listing.status === "DRAFT") {
      updateData.publishedAt = new Date();
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
      select: { id: true, status: true, publishedAt: true },
    });

    return Response.json({ listing: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

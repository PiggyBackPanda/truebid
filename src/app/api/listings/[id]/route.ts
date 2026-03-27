import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { updateListingSchema } from "@/lib/validation";

// GET /api/listings/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        streetAddress: true,
        suburb: true,
        state: true,
        postcode: true,
        latitude: true,
        longitude: true,
        propertyType: true,
        bedrooms: true,
        bathrooms: true,
        carSpaces: true,
        landSizeM2: true,
        buildingSizeM2: true,
        yearBuilt: true,
        title: true,
        description: true,
        features: true,
        guidePriceCents: true,
        guideRangeMaxCents: true,
        saleMethod: true,
        closingDate: true,
        originalClosingDate: true,
        minOfferCents: true,
        requireDeposit: true,
        depositAmountCents: true,
        createdAt: true,
        publishedAt: true,
        images: {
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            displayOrder: true,
            mediaType: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            publicAlias: true,
            verificationStatus: true,
          },
        },
        // Offers — public board data only (no personal details)
        offers: {
          where: { isPublic: true },
          orderBy: [{ amountCents: "desc" }, { createdAt: "asc" }],
          select: {
            id: true,
            amountCents: true,
            conditionType: true,
            conditionText: true,
            settlementDays: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            buyer: { select: { publicAlias: true } },
          },
        },
      },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    // Shape offers into the PublicOffer format; hide for non-OPEN_OFFERS listings
    const offers =
      listing.saleMethod === "OPEN_OFFERS"
        ? listing.offers.map((o) => ({
            id: o.id,
            publicAlias: o.buyer.publicAlias,
            amountCents: o.amountCents,
            conditionType: o.conditionType,
            conditionText: o.conditionText,
            settlementDays: o.settlementDays,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
          }))
        : [];

    const { offers: _raw, ...listingWithoutRaw } = listing;
    void _raw;

    return Response.json({
      listing: {
        ...listingWithoutRaw,
        closingDate: listing.closingDate?.toISOString() ?? null,
        originalClosingDate: listing.originalClosingDate?.toISOString() ?? null,
        offers,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/listings/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    const body = await req.json();
    const data = updateListingSchema.parse(body);

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(data.streetAddress !== undefined ? { streetAddress: data.streetAddress } : {}),
        ...(data.suburb !== undefined ? { suburb: data.suburb } : {}),
        ...(data.state !== undefined ? { state: data.state } : {}),
        ...(data.postcode !== undefined ? { postcode: data.postcode } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.propertyType !== undefined ? { propertyType: data.propertyType } : {}),
        ...(data.bedrooms !== undefined ? { bedrooms: data.bedrooms } : {}),
        ...(data.bathrooms !== undefined ? { bathrooms: data.bathrooms } : {}),
        ...(data.carSpaces !== undefined ? { carSpaces: data.carSpaces } : {}),
        ...(data.landSizeM2 !== undefined ? { landSizeM2: data.landSizeM2 } : {}),
        ...(data.buildingSizeM2 !== undefined ? { buildingSizeM2: data.buildingSizeM2 } : {}),
        ...(data.yearBuilt !== undefined ? { yearBuilt: data.yearBuilt } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.guidePriceCents !== undefined ? { guidePriceCents: data.guidePriceCents } : {}),
        ...(data.guideRangeMaxCents !== undefined ? { guideRangeMaxCents: data.guideRangeMaxCents } : {}),
        ...(data.saleMethod !== undefined ? { saleMethod: data.saleMethod } : {}),
        ...(data.closingDate !== undefined ? { closingDate: data.closingDate ? new Date(data.closingDate) : null } : {}),
        ...(data.minOfferCents !== undefined ? { minOfferCents: data.minOfferCents } : {}),
        ...(data.requireDeposit !== undefined ? { requireDeposit: data.requireDeposit } : {}),
        ...(data.depositAmountCents !== undefined ? { depositAmountCents: data.depositAmountCents } : {}),
        ...(data.features !== undefined ? { features: data.features ?? Prisma.JsonNull } : {}),
      },
      select: {
        id: true,
        status: true,
        streetAddress: true,
        suburb: true,
        state: true,
        saleMethod: true,
        updatedAt: true,
      },
    });

    return Response.json({ listing: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/listings/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    if (listing.status !== "DRAFT") {
      throw new ApiError(400, "INVALID_STATUS", "Only draft listings can be deleted");
    }

    await prisma.listing.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

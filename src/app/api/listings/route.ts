import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth, requireVerified, errorResponse, paginatedResponse } from "@/lib/api-helpers";
import { createListingSchema, listingSearchSchema } from "@/lib/validation";

// POST /api/listings — create a draft listing
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    requireVerified(user);

    const body = await req.json();
    const data = createListingSchema.parse(body);

    const listing = await prisma.$transaction(async (tx) => {
      if (user.role === "BUYER") {
        await tx.user.update({
          where: { id: user.id },
          data: { role: "BOTH" },
        });
      }
      return tx.listing.create({
        data: {
          sellerId: user.id,
          status: "DRAFT",
          streetAddress: data.streetAddress,
          suburb: data.suburb,
          state: data.state,
          postcode: data.postcode,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          carSpaces: data.carSpaces,
          landSizeM2: data.landSizeM2 ?? null,
          buildingSizeM2: data.buildingSizeM2 ?? null,
          yearBuilt: data.yearBuilt ?? null,
          title: data.title ?? null,
          description: data.description,
          guidePriceCents: data.guidePriceCents ?? null,
          guideRangeMaxCents: data.guideRangeMaxCents ?? null,
          saleMethod: data.saleMethod,
          closingDate: data.closingDate ? new Date(data.closingDate) : null,
          minOfferCents: data.minOfferCents ?? null,
          requireDeposit: data.requireDeposit ?? false,
          depositAmountCents: data.depositAmountCents ?? null,
          features: data.features ?? Prisma.JsonNull,
        },
        select: {
          id: true,
          status: true,
          streetAddress: true,
          suburb: true,
          state: true,
          postcode: true,
          propertyType: true,
          bedrooms: true,
          bathrooms: true,
          carSpaces: true,
          saleMethod: true,
          createdAt: true,
        },
      });
    });

    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/listings — search/browse listings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params = listingSearchSchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      suburb: searchParams.get("suburb") ?? undefined,
      postcode: searchParams.get("postcode") ?? undefined,
      state: searchParams.get("state") ?? undefined,
      propertyType: searchParams.get("propertyType") ?? undefined,
      saleMethod: searchParams.get("saleMethod") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      minBeds: searchParams.get("minBeds") ?? undefined,
      maxBeds: searchParams.get("maxBeds") ?? undefined,
      minBaths: searchParams.get("minBaths") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });

    const skip = (params.page - 1) * params.limit;

    const where = {
      status: "ACTIVE" as const,
      ...(params.suburb ? { suburb: { contains: params.suburb, mode: "insensitive" as const } } : {}),
      ...(params.postcode ? { postcode: params.postcode } : {}),
      ...(params.state ? { state: params.state } : {}),
      ...(params.propertyType ? { propertyType: params.propertyType } : {}),
      ...(params.saleMethod ? { saleMethod: params.saleMethod } : {}),
      ...(params.minBeds ? { bedrooms: { gte: params.minBeds } } : {}),
      ...(params.maxBeds ? { bedrooms: { lte: params.maxBeds } } : {}),
      ...(params.minBaths ? { bathrooms: { gte: params.minBaths } } : {}),
      ...(params.minPrice ? { guidePriceCents: { gte: params.minPrice } } : {}),
      ...(params.maxPrice ? { guidePriceCents: { lte: params.maxPrice } } : {}),
      ...(params.q
        ? {
            OR: [
              { suburb: { contains: params.q, mode: "insensitive" as const } },
              { streetAddress: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const orderBy =
      params.sort === "price_asc"
        ? { guidePriceCents: "asc" as const }
        : params.sort === "price_desc"
        ? { guidePriceCents: "desc" as const }
        : params.sort === "closing_soon"
        ? { closingDate: "asc" as const }
        : { createdAt: "desc" as const };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: params.limit,
        orderBy,
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
          guideRangeMaxCents: true,
          saleMethod: true,
          closingDate: true,
          status: true,
          createdAt: true,
          images: {
            orderBy: { displayOrder: "asc" as const },
            take: 1,
            select: { url: true, thumbnailUrl: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return Response.json(paginatedResponse(listings, total, params.page, params.limit));
  } catch (error) {
    return errorResponse(error);
  }
}

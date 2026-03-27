import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { z } from "zod";

const confirmSchema = z.object({
  s3Key: z.string().min(1),
  mediaType: z.enum(["photo", "floorplan"]).default("photo"),
});

// POST /api/listings/[id]/images/confirm
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        images: { select: { id: true, displayOrder: true }, orderBy: { displayOrder: "desc" }, take: 1 },
      },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    const imageCount = await prisma.listingImage.count({ where: { listingId: id } });
    if (imageCount >= 15) {
      throw new ApiError(400, "IMAGE_LIMIT", "Maximum 15 images allowed per listing");
    }

    const body = await req.json();
    const { s3Key, mediaType } = confirmSchema.parse(body);

    const expectedKeyPrefix = `listings/${id}/images/`;
    if (!s3Key.startsWith(expectedKeyPrefix)) {
      throw new ApiError(400, "INVALID_KEY", "Invalid image key for this listing");
    }

    const nextDisplayOrder = listing.images.length > 0
      ? (listing.images[0].displayOrder ?? 0) + 1
      : 0;

    const cdnBase = process.env.CLOUDFRONT_URL ?? `https://${process.env.AWS_S3_BUCKET ?? ""}.s3.${process.env.AWS_REGION ?? "ap-southeast-2"}.amazonaws.com`;
    const imageUrl = `${cdnBase}/${s3Key}`;

    const image = await prisma.listingImage.create({
      data: {
        listingId: id,
        url: imageUrl,
        thumbnailUrl: imageUrl,
        displayOrder: nextDisplayOrder,
        isPrimary: nextDisplayOrder === 0,
        mediaType,
      },
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        displayOrder: true,
        mediaType: true,
      },
    });

    return Response.json({ image }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

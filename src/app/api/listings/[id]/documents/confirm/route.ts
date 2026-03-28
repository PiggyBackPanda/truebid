import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { isS3Configured } from "@/lib/s3";
import { z } from "zod";

const confirmSchema = z.object({
  s3Key: z.string().min(1),
  name: z.string().min(1, "Document name is required").max(100),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
});

// POST /api/listings/[id]/documents/confirm
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    const docCount = await prisma.listingDocument.count({ where: { listingId: id } });
    if (docCount >= 10) {
      throw new ApiError(400, "DOCUMENT_LIMIT", "Maximum 10 documents allowed per listing");
    }

    const body = await req.json();
    const { s3Key, name, mimeType, fileSize } = confirmSchema.parse(body);

    const expectedKeyPrefix = `listings/${id}/documents/`;
    if (!s3Key.startsWith(expectedKeyPrefix)) {
      throw new ApiError(400, "INVALID_KEY", "Invalid document key for this listing");
    }

    const url = isS3Configured()
      ? `${process.env.CLOUDFRONT_URL ?? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION ?? "ap-southeast-2"}.amazonaws.com`}/${s3Key}`
      : `/dev-uploads/${s3Key}`;

    const document = await prisma.listingDocument.create({
      data: {
        listingId: id,
        name: name.trim(),
        url,
        s3Key,
        mimeType,
        fileSize,
      },
      select: {
        id: true,
        name: true,
        url: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
      },
    });

    return Response.json({ document }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

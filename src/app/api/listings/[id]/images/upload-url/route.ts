import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { getPresignedUploadUrl } from "@/lib/s3";
import { z } from "zod";

const uploadUrlSchema = z
  .object({
    fileName: z.string().min(1).max(200),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    mediaType: z.enum(["photo", "floorplan"]).default("photo"),
  })
  .refine(
    (data) => !(data.contentType === "application/pdf" && data.mediaType !== "floorplan"),
    { message: "PDF uploads are only allowed for floor plans" }
  );

// POST /api/listings/[id]/images/upload-url
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true, images: { select: { id: true } } },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    requireOwner(user, listing.sellerId);

    if (listing.images.length >= 15) {
      throw new ApiError(400, "IMAGE_LIMIT", "Maximum 15 images allowed per listing");
    }

    const body = await req.json();
    const { contentType } = uploadUrlSchema.parse(body);

    const ext = contentType.split("/")[1];
    const s3Key = `listings/${id}/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(s3Key, contentType);

    return Response.json({ uploadUrl, s3Key, publicUrl });
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { getPresignedUploadUrl } from "@/lib/s3";
import { z } from "zod";

const schema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  documentType: z.enum(["buildingPestReport", "floorplan"]),
});

// POST /api/listings/[id]/documents/upload-url
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

    const body = await req.json();
    const { fileName, contentType, documentType } = schema.parse(body);

    const ext = fileName.split(".").pop()?.toLowerCase() ?? contentType.split("/")[1];
    const s3Key = `listings/${id}/documents/${documentType}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(s3Key, contentType);

    return Response.json({ uploadUrl, publicUrl });
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { getPresignedUploadUrl } from "@/lib/s3";
import { z } from "zod";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
] as const;

const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.enum(ALLOWED_MIME_TYPES),
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

    const docCount = await prisma.listingDocument.count({ where: { listingId: id } });
    if (docCount >= 10) {
      throw new ApiError(400, "DOCUMENT_LIMIT", "Maximum 10 documents allowed per listing");
    }

    const body = await req.json();
    const { fileName, contentType } = uploadUrlSchema.parse(body);

    const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const s3Key = `listings/${id}/documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(s3Key, contentType);

    return Response.json({ uploadUrl, s3Key, publicUrl });
  } catch (error) {
    return errorResponse(error);
  }
}

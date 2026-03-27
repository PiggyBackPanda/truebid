import { type NextRequest } from "next/server";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { getPresignedUploadUrl } from "@/lib/s3";
import { z } from "zod";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];

const requestSchema = z.object({
  licenceContentType: z.string().refine((t) => ALLOWED_TYPES.includes(t), {
    message: "Unsupported file type. Please use JPEG, PNG, WebP, or HEIC.",
  }),
  selfieContentType: z.string().refine((t) => ALLOWED_TYPES.includes(t), {
    message: "Unsupported file type. Please use JPEG, PNG, WebP, or HEIC.",
  }),
});

// POST /api/verify-identity/upload-url
// Returns presigned S3 PUT URLs for licence and selfie uploads.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.verificationStatus === "VERIFIED") {
      throw new ApiError(400, "ALREADY_VERIFIED", "Your identity is already verified");
    }

    const body = await req.json();
    const { licenceContentType, selfieContentType } = requestSchema.parse(body);

    const timestamp = Date.now();
    const licenceKey = `verifications/${user.id}/licence-${timestamp}`;
    const selfieKey = `verifications/${user.id}/selfie-${timestamp}`;

    const [licence, selfie] = await Promise.all([
      getPresignedUploadUrl(licenceKey, licenceContentType),
      getPresignedUploadUrl(selfieKey, selfieContentType),
    ]);

    return Response.json({
      licence: { uploadUrl: licence.uploadUrl, key: licenceKey },
      selfie: { uploadUrl: selfie.uploadUrl, key: selfieKey },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

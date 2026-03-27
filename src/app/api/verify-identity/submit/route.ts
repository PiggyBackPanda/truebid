import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { z } from "zod";

const submitSchema = z.object({
  licenceKey: z.string().min(1),
  selfieKey: z.string().min(1),
});

// POST /api/verify-identity/submit
// Records that the user has uploaded their documents and sets status to PENDING.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.verificationStatus === "VERIFIED") {
      throw new ApiError(400, "ALREADY_VERIFIED", "Your identity is already verified");
    }

    const body = await req.json();
    const { licenceKey, selfieKey } = submitSchema.parse(body);

    // Ensure the keys belong to this user (prevent spoofing another user's upload path)
    const expectedPrefix = `verifications/${user.id}/`;
    if (!licenceKey.startsWith(expectedPrefix) || !selfieKey.startsWith(expectedPrefix)) {
      throw new ApiError(403, "FORBIDDEN", "Invalid document keys");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationStatus: "PENDING",
        verificationRef: JSON.stringify({
          licenceKey,
          selfieKey,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    return Response.json({ status: "PENDING" });
  } catch (error) {
    return errorResponse(error);
  }
}

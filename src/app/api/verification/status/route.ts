import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";

// GET /api/verification/status: check current verification status
export async function GET() {
  try {
    const sessionUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        verificationStatus: true,
        verificationDate: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return Response.json({
      status: user.verificationStatus,
      verifiedAt: user.verificationDate?.toISOString() ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

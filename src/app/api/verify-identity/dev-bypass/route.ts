import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";

// POST /api/verify-identity/dev-bypass
// Development-only: immediately marks the authenticated user as VERIFIED.
// Returns 404 in production.
export async function POST() {
  // Only accessible if ENABLE_DEV_BYPASS=true is explicitly set AND we are not in production
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_DEV_BYPASS !== "true"
  ) {
    return Response.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const user = await requireAuth();

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationStatus: "VERIFIED" },
    });

    return Response.json({ status: "VERIFIED" });
  } catch (error) {
    return errorResponse(error);
  }
}

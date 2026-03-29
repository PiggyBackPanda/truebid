import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";

// GET /api/verification/consent — check whether the current user has given biometric consent
export async function GET() {
  try {
    const user = await requireAuth();

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { biometricConsentAt: true },
    });

    return Response.json({
      consented: record?.biometricConsentAt !== null && record?.biometricConsentAt !== undefined,
      consentedAt: record?.biometricConsentAt?.toISOString() ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/verification/consent — record that the user has given explicit biometric consent
export async function POST() {
  try {
    const user = await requireAuth();

    await prisma.user.update({
      where: { id: user.id },
      data: { biometricConsentAt: new Date() },
    });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

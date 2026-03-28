import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";

// GET /api/auth/me: return the current authenticated user's profile
export async function GET() {
  try {
    const sessionUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        verificationStatus: true,
        verificationDate: true,
        publicAlias: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return Response.json({
      user: {
        ...user,
        verificationDate: user.verificationDate?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

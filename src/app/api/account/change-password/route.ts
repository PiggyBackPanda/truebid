import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { changePasswordSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

// POST /api/account/change-password
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "User not found");
    }

    const isValid = await bcrypt.compare(data.currentPassword, existing.passwordHash);
    if (!isValid) {
      throw new ApiError(400, "INVALID_PASSWORD", "Current password is incorrect");
    }

    const newHash = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, passwordChangedAt: new Date() },
    });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

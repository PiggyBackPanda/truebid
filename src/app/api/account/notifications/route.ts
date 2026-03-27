import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";
import { notificationPrefsSchema } from "@/lib/validation";

// PATCH /api/account/notifications — update notification preferences
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const prefs = notificationPrefsSchema.parse(body);

    await prisma.user.update({
      where: { id: user.id },
      data: { notificationPreferences: prefs },
    });

    return Response.json({ preferences: prefs });
  } catch (error) {
    return errorResponse(error);
  }
}

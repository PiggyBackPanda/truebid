import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";
import { updateProfileSchema, deleteAccountSchema } from "@/lib/validation";

// PATCH /api/account: update personal details
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return Response.json({ user: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/account: delete account and withdraw all active listings
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    deleteAccountSchema.parse(body);

    await prisma.$transaction(async (tx) => {
      await tx.offer.updateMany({
        where: { buyerId: user.id, status: "ACTIVE" },
        data: { status: "WITHDRAWN", withdrawnAt: new Date() },
      });
      await tx.listing.updateMany({
        where: { sellerId: user.id, status: { in: ["ACTIVE", "UNDER_OFFER"] } },
        data: { status: "WITHDRAWN" },
      });
      await tx.user.delete({ where: { id: user.id } });
    });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

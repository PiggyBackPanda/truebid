import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";

// DELETE /api/saved-searches/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const search = await prisma.savedSearch.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!search) {
      throw new ApiError(404, "NOT_FOUND", "Saved search not found");
    }

    if (search.userId !== user.id) {
      throw new ApiError(403, "FORBIDDEN", "Not your saved search");
    }

    await prisma.savedSearch.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

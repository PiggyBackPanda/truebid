import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";
import { AustralianStateSchema } from "@/lib/validation";

const checklistRequestSchema = z.object({
  itemKey: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  state: AustralianStateSchema,
});

// PATCH /api/dashboard/seller/checklist — upsert a checklist item's status
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { itemKey, status, state } = checklistRequestSchema.parse(body);

    const progress = await prisma.checklistProgress.upsert({
      where: { userId_itemKey: { userId: user.id, itemKey } },
      create: {
        userId: user.id,
        itemKey,
        state,
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
      update: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
      select: {
        itemKey: true,
        status: true,
        completedAt: true,
      },
    });

    return Response.json({ progress });
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/dashboard/seller/checklist — get all checklist progress for current user
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const url = new URL(req.url);
    const rawState = url.searchParams.get("state") ?? "WA";
    const state = AustralianStateSchema.parse(rawState);

    const progress = await prisma.checklistProgress.findMany({
      where: { userId: user.id, state },
      select: { itemKey: true, status: true, completedAt: true },
    });

    return Response.json({ progress });
  } catch (error) {
    return errorResponse(error);
  }
}

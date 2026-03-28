import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { updateInspectionSlotSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string; slotId: string }> };

const MIN_LEAD_TIME_MS = 2 * 60 * 60 * 1000;
const MAX_DURATION_MS  = 4 * 60 * 60 * 1000;

// PATCH /api/listings/[id]/inspections/[slotId]
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id, slotId } = await params;

    const slot = await prisma.inspectionSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        listingId: true,
        status: true,
        type: true,
        startTime: true,
        endTime: true,
        listing: { select: { sellerId: true } },
        _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      },
    });

    if (!slot || slot.listingId !== id) {
      throw new ApiError(404, "NOT_FOUND", "Inspection slot not found");
    }

    requireOwner(user, slot.listing.sellerId);

    if (slot.status === "COMPLETED" || slot.status === "CANCELLED") {
      throw new ApiError(400, "SLOT_NOT_EDITABLE", "Cannot edit a completed or cancelled slot");
    }

    const body = await req.json();
    const data = updateInspectionSlotSchema.parse(body);

    // Cancellation
    if (data.status === "CANCELLED") {
      const bookings = await prisma.inspectionBooking.findMany({
        where: { slotId, status: "CONFIRMED" },
        select: { id: true, buyer: { select: { email: true, firstName: true } } },
      });

      await prisma.$transaction(async (tx) => {
        await tx.inspectionSlot.update({
          where: { id: slotId },
          data: { status: "CANCELLED" },
        });
        if (bookings.length > 0) {
          await tx.inspectionBooking.updateMany({
            where: { slotId, status: "CONFIRMED" },
            data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: "seller" },
          });
        }

        // Revert listing to COMING_SOON if no slots remain
        const remaining = await tx.inspectionSlot.count({
          where: {
            listingId: id,
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
        });

        if (remaining === 0) {
          const listing = await tx.listing.findUnique({
            where: { id },
            select: { status: true },
          });
          if (listing?.status === "INSPECTIONS_OPEN") {
            await tx.listing.update({
              where: { id },
              data: { status: "COMING_SOON" },
            });
          }
        }
      });

      return Response.json({ success: true });
    }

    // Time/capacity edits: only if no confirmed bookings
    const updateData: Record<string, unknown> = {};

    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.maxGroups !== undefined) {
      if (slot._count.bookings > 0) {
        throw new ApiError(400, "HAS_BOOKINGS", "Cannot change capacity after bookings have been made");
      }
      updateData.maxGroups = data.maxGroups;
    }

    if (data.startTime !== undefined || data.endTime !== undefined) {
      if (slot._count.bookings > 0) {
        throw new ApiError(400, "HAS_BOOKINGS", "Cannot reschedule a slot that already has bookings");
      }

      const start = data.startTime ? new Date(data.startTime) : slot.startTime;
      const end = data.endTime ? new Date(data.endTime) : slot.endTime;

      if (start.getTime() - Date.now() < MIN_LEAD_TIME_MS) {
        throw new ApiError(400, "TOO_SOON", "Slot must be at least 2 hours in the future");
      }
      if (end <= start) {
        throw new ApiError(400, "INVALID_TIME_RANGE", "End time must be after start time");
      }
      if (end.getTime() - start.getTime() > MAX_DURATION_MS) {
        throw new ApiError(400, "SLOT_TOO_LONG", "Slot cannot be longer than 4 hours");
      }

      updateData.startTime = start;
      updateData.endTime = end;
    }

    const updated = await prisma.inspectionSlot.update({
      where: { id: slotId },
      data: updateData,
      select: {
        id: true, type: true, status: true,
        startTime: true, endTime: true, maxGroups: true, notes: true,
      },
    });

    return Response.json({
      slot: {
        ...updated,
        startTime: updated.startTime.toISOString(),
        endTime: updated.endTime.toISOString(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/listings/[id]/inspections/[slotId]
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id, slotId } = await params;

    const slot = await prisma.inspectionSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        listingId: true,
        listing: { select: { sellerId: true, status: true } },
        _count: { select: { bookings: true } },
      },
    });

    if (!slot || slot.listingId !== id) {
      throw new ApiError(404, "NOT_FOUND", "Inspection slot not found");
    }

    requireOwner(user, slot.listing.sellerId);

    if (slot._count.bookings > 0) {
      throw new ApiError(
        400,
        "HAS_BOOKINGS",
        "Cannot delete a slot with bookings. Use PATCH to cancel it instead."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.inspectionSlot.delete({ where: { id: slotId } });

      const remaining = await tx.inspectionSlot.count({
        where: { listingId: id, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      });

      if (remaining === 0 && slot.listing.status === "INSPECTIONS_OPEN") {
        await tx.listing.update({
          where: { id },
          data: { status: "COMING_SOON" },
        });
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

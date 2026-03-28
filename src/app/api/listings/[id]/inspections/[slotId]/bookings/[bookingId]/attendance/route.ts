import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string; slotId: string; bookingId: string }> };

const bodySchema = z.object({
  status: z.enum(["ATTENDED", "NO_SHOW"]),
});

// PATCH: seller marks a buyer as attended or no-show
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id, slotId, bookingId } = await params;

    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        slot: {
          select: {
            id: true,
            listingId: true,
            startTime: true,
            listing: { select: { sellerId: true } },
          },
        },
      },
    });

    if (!booking || booking.slot.listingId !== id || booking.slot.id !== slotId) {
      throw new ApiError(404, "NOT_FOUND", "Booking not found");
    }

    requireOwner(user, booking.slot.listing.sellerId);

    if (booking.slot.startTime > new Date()) {
      throw new ApiError(400, "INSPECTION_NOT_YET_STARTED", "Cannot mark attendance before the inspection time");
    }

    if (booking.status !== "CONFIRMED") {
      throw new ApiError(400, "BOOKING_NOT_ACTIVE", "Can only mark attendance on confirmed bookings");
    }

    const body = await req.json();
    const { status } = bodySchema.parse(body);

    const updateData =
      status === "ATTENDED"
        ? { status: "ATTENDED" as const, attendedAt: new Date() }
        : { status: "NO_SHOW" as const, markedNoShowAt: new Date() };

    const updated = await prisma.inspectionBooking.update({
      where: { id: bookingId },
      data: updateData,
      select: { id: true, status: true, attendedAt: true, markedNoShowAt: true },
    });

    return Response.json({ booking: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

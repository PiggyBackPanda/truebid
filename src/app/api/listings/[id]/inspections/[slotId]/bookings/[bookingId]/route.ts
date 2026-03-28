import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { sendBuyerCancelledBookingEmail } from "@/lib/email";

type RouteContext = { params: Promise<{ id: string; slotId: string; bookingId: string }> };

const CANCEL_CUTOFF_MS = 2 * 60 * 60 * 1000; // 2 hours

// DELETE — buyer cancels their own booking
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id, slotId, bookingId } = await params;

    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        slot: {
          select: {
            id: true,
            listingId: true,
            startTime: true,
            endTime: true,
            maxGroups: true,
            listing: {
              select: {
                streetAddress: true,
                suburb: true,
                state: true,
                seller: { select: { email: true, firstName: true } },
              },
            },
            _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
          },
        },
        buyer: { select: { firstName: true, lastName: true } },
      },
    });

    if (!booking || booking.slot.listingId !== id || booking.slot.id !== slotId) {
      throw new ApiError(404, "NOT_FOUND", "Booking not found");
    }

    if (booking.buyerId !== user.id) {
      throw new ApiError(403, "FORBIDDEN", "You can only cancel your own bookings");
    }

    if (booking.status !== "CONFIRMED") {
      throw new ApiError(400, "BOOKING_NOT_ACTIVE", "This booking cannot be cancelled");
    }

    const timeUntilSlot = booking.slot.startTime.getTime() - Date.now();
    if (timeUntilSlot < CANCEL_CUTOFF_MS) {
      throw new ApiError(
        400,
        "TOO_LATE_TO_CANCEL",
        "Bookings cannot be cancelled less than 2 hours before the inspection"
      );
    }

    await prisma.inspectionBooking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: "buyer",
      },
    });

    const address = `${booking.slot.listing.streetAddress}, ${booking.slot.listing.suburb} ${booking.slot.listing.state}`;
    const spotsRemaining = booking.slot.maxGroups - (booking.slot._count.bookings - 1);

    sendBuyerCancelledBookingEmail({
      sellerEmail: booking.slot.listing.seller.email,
      sellerName: booking.slot.listing.seller.firstName,
      buyerName: `${booking.buyer.firstName} ${booking.buyer.lastName}`,
      address,
      startTime: booking.slot.startTime.toISOString(),
      endTime: booking.slot.endTime.toISOString(),
      spotsRemaining,
    }).catch(() => {});

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

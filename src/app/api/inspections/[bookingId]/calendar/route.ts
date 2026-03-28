import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { serializeListingAddress } from "@/lib/listing-serializer";
import type { AddressVisibility } from "@/lib/listing-serializer";

type RouteContext = { params: Promise<{ bookingId: string }> };

function formatIcalDt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function generateIcal(params: {
  startTime: Date;
  endTime: Date;
  address: string;
  bookingId: string;
}): string {
  const { startTime, endTime, address, bookingId } = params;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TrueBid//Property Inspections//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatIcalDt(startTime)}`,
    `DTEND:${formatIcalDt(endTime)}`,
    `SUMMARY:Property Inspection: ${address}`,
    `LOCATION:${address}`,
    `DESCRIPTION:Your inspection booking for ${address}.\\nBooking reference: ${bookingId}`,
    `UID:truebid-inspection-${bookingId}@truebid.com.au`,
    `DTSTAMP:${formatIcalDt(new Date())}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// GET /api/inspections/[bookingId]/calendar
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { bookingId } = await params;

    const booking = await prisma.inspectionBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        slot: {
          select: {
            startTime: true,
            endTime: true,
            listing: {
              select: {
                id: true,
                streetAddress: true,
                suburb: true,
                state: true,
                postcode: true,
                latitude: true,
                longitude: true,
                addressVisibility: true,
                _count: { select: { inspectionSlots: true } },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new ApiError(404, "NOT_FOUND", "Booking not found");
    }

    if (booking.buyerId !== user.id) {
      throw new ApiError(403, "FORBIDDEN", "Access denied");
    }

    const { listing } = booking.slot;
    const serialized = serializeListingAddress(
      {
        id: listing.id,
        streetAddress: listing.streetAddress,
        suburb: listing.suburb,
        state: listing.state,
        postcode: listing.postcode,
        latitude: listing.latitude,
        longitude: listing.longitude,
        addressVisibility: listing.addressVisibility as AddressVisibility,
        hasInspectionSlots: listing._count.inspectionSlots > 0,
      },
      {
        userId: user.id,
        hasBooking: booking.status === "CONFIRMED" || booking.status === "ATTENDED",
      }
    );
    const address = serialized.streetAddress
      ? `${serialized.streetAddress}, ${listing.suburb} ${listing.state} ${listing.postcode}`
      : `${listing.suburb}, ${listing.state} ${listing.postcode}`;

    const ical = generateIcal({
      startTime: booking.slot.startTime,
      endTime: booking.slot.endTime,
      address,
      bookingId,
    });

    return new Response(ical, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="truebid-inspection.ics"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

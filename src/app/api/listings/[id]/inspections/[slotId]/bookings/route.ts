import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, requireVerified, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import {
  sendInspectionBookingConfirmedEmail,
  sendInspectionNewBookingEmail,
} from "@/lib/email";

type RouteContext = { params: Promise<{ id: string; slotId: string }> };

const createBookingSchema = z.object({
  note: z.string().max(200).optional(),
});

// POST /api/listings/[id]/inspections/[slotId]/bookings: buyer books a slot
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    requireVerified(user);

    const { id, slotId } = await params;

    const slot = await prisma.inspectionSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        listingId: true,
        type: true,
        status: true,
        startTime: true,
        endTime: true,
        maxGroups: true,
        notes: true,
        listing: {
          select: {
            id: true,
            sellerId: true,
            streetAddress: true,
            suburb: true,
            state: true,
            seller: { select: { email: true, firstName: true } },
          },
        },
        _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      },
    });

    if (!slot || slot.listingId !== id) {
      throw new ApiError(404, "NOT_FOUND", "Inspection slot not found");
    }

    if (slot.status !== "SCHEDULED") {
      throw new ApiError(400, "SLOT_NOT_AVAILABLE", "This inspection slot is no longer available");
    }

    if (slot.startTime <= new Date()) {
      throw new ApiError(400, "SLOT_PASSED", "This inspection slot has already passed");
    }

    if (slot.type !== "SCHEDULED") {
      throw new ApiError(400, "NO_BOOKING_REQUIRED", "This is an open house. No booking required.");
    }

    if (slot.listing.sellerId === user.id) {
      throw new ApiError(403, "CANNOT_BOOK_OWN_LISTING", "You cannot book an inspection on your own listing");
    }

    const existing = await prisma.inspectionBooking.findUnique({
      where: { slotId_buyerId: { slotId, buyerId: user.id } },
      select: { id: true, status: true },
    });

    if (existing && existing.status === "CONFIRMED") {
      throw new ApiError(409, "ALREADY_BOOKED", "You have already booked this inspection slot");
    }

    // Parse body before the transaction to avoid holding a lock while reading the request
    const body = await req.json();
    const { note } = createBookingSchema.parse(body);

    // Wrap capacity check + upsert in a transaction with a row-level lock to prevent
    // concurrent bookings from exceeding maxGroups
    const booking = await prisma.$transaction(async (tx) => {
      // Lock the slot row so concurrent requests queue up here
      await tx.$queryRaw`SELECT id FROM "InspectionSlot" WHERE id = ${slotId} FOR UPDATE`;

      const confirmedCount = await tx.inspectionBooking.count({
        where: { slotId, status: "CONFIRMED" },
      });

      if (confirmedCount >= slot.maxGroups) {
        throw new ApiError(409, "SLOT_FULL", "This inspection slot is fully booked", { spotsRemaining: 0 });
      }

      return tx.inspectionBooking.upsert({
        where: { slotId_buyerId: { slotId, buyerId: user.id } },
        create: {
          slotId,
          buyerId: user.id,
          status: "CONFIRMED",
          note: note ?? null,
        },
        update: {
          status: "CONFIRMED",
          note: note ?? null,
          cancelledAt: null,
          cancelledBy: null,
        },
        select: { id: true, status: true, note: true, createdAt: true },
      });
    });

    const address = `${slot.listing.streetAddress}, ${slot.listing.suburb} ${slot.listing.state}`;
    const confirmedCount = slot._count.bookings + 1;

    // Fire-and-forget emails
    sendInspectionBookingConfirmedEmail({
      buyerEmail: user.email,
      buyerName: user.firstName,
      address,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      listingId: id,
    }).catch(() => {});

    sendInspectionNewBookingEmail({
      sellerEmail: slot.listing.seller.email,
      sellerName: slot.listing.seller.firstName,
      buyerName: `${user.firstName} ${user.lastName}`,
      address,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      listingId: id,
      confirmedCount,
      maxGroups: slot.maxGroups,
    }).catch(() => {});

    return Response.json(
      {
        booking: {
          id: booking.id,
          slotId,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          address,
          status: booking.status,
          note: booking.note,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/listings/[id]/inspections/[slotId]/bookings: seller views bookings for a slot
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await requireAuth();
    const { id, slotId } = await params;

    const slot = await prisma.inspectionSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        listingId: true,
        startTime: true,
        endTime: true,
        maxGroups: true,
        notes: true,
        listing: { select: { sellerId: true } },
        _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
      },
    });

    if (!slot || slot.listingId !== id) {
      throw new ApiError(404, "NOT_FOUND", "Inspection slot not found");
    }

    requireOwner(user, slot.listing.sellerId);

    const bookings = await prisma.inspectionBooking.findMany({
      where: { slotId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        note: true,
        createdAt: true,
        attendedAt: true,
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            verificationStatus: true,
          },
        },
      },
    });

    return Response.json({
      slot: {
        id: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        maxGroups: slot.maxGroups,
        confirmedCount: slot._count.bookings,
        notes: slot.notes ?? null,
      },
      bookings: bookings.map((b) => ({
        id: b.id,
        status: b.status,
        note: b.note,
        createdAt: b.createdAt.toISOString(),
        attendedAt: b.attendedAt?.toISOString() ?? null,
        buyer: {
          firstName: b.buyer.firstName,
          lastName: b.buyer.lastName,
          email: b.buyer.email,
          phone: b.buyer.phone ?? null,
          verificationStatus: b.buyer.verificationStatus,
        },
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

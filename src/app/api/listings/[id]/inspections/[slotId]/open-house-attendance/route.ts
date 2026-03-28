import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";

type RouteContext = { params: Promise<{ id: string; slotId: string }> };

const bodySchema = z.object({
  email: z.string().email(),
});

// POST /api/listings/[id]/inspections/[slotId]/open-house-attendance
// Seller marks a buyer (by email) as having attended an open house.
// If the buyer is registered: creates a synthetic ATTENDED InspectionBooking.
// If not registered: stores a PendingInspectionAttendance record for when they sign up.
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id, slotId } = await params;

    const slot = await prisma.inspectionSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        listingId: true,
        type: true,
        status: true,
        listing: { select: { sellerId: true } },
      },
    });

    if (!slot || slot.listingId !== id) {
      throw new ApiError(404, "NOT_FOUND", "Inspection slot not found");
    }

    requireOwner(user, slot.listing.sellerId);

    if (slot.type !== "OPEN_HOUSE") {
      throw new ApiError(400, "NOT_OPEN_HOUSE", "This endpoint is only for Open House slots");
    }

    if (slot.status !== "COMPLETED" && slot.status !== "IN_PROGRESS") {
      throw new ApiError(
        400,
        "SLOT_NOT_COMPLETED",
        "Can only mark open house attendance after the slot has started or completed"
      );
    }

    const body = await req.json();
    const { email } = bodySchema.parse(body);

    // Look up the user by email
    const buyer = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, lastName: true, email: true, verificationStatus: true },
    });

    if (buyer) {
      // Upsert a synthetic ATTENDED booking
      await prisma.inspectionBooking.upsert({
        where: { slotId_buyerId: { slotId, buyerId: buyer.id } },
        create: {
          slotId,
          buyerId: buyer.id,
          status: "ATTENDED",
          attendedAt: new Date(),
        },
        update: {
          status: "ATTENDED",
          attendedAt: new Date(),
          cancelledAt: null,
          cancelledBy: null,
        },
        select: { id: true },
      });
    } else {
      // User not found: store pending attendance
      await prisma.pendingInspectionAttendance.upsert({
        where: { slotId_email: { slotId, email } },
        create: { slotId, email },
        update: {}, // already exists, no-op
      });
    }

    // Return the same response regardless of registered/unregistered to prevent email enumeration
    return Response.json({
      result: "ATTENDANCE_RECORDED",
      message: "Attendance recorded. If not yet registered, offer access will be granted automatically when they sign up.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// GET: list all attendees (registered + pending) for this open house slot
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { id, slotId } = await params;

    const slot = await prisma.inspectionSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        listingId: true,
        type: true,
        listing: { select: { sellerId: true } },
      },
    });

    if (!slot || slot.listingId !== id) {
      throw new ApiError(404, "NOT_FOUND", "Inspection slot not found");
    }

    requireOwner(user, slot.listing.sellerId);

    if (slot.type !== "OPEN_HOUSE") {
      throw new ApiError(400, "NOT_OPEN_HOUSE", "This endpoint is only for Open House slots");
    }

    const [attendedBookings, pendingAttendances] = await Promise.all([
      prisma.inspectionBooking.findMany({
        where: { slotId, status: "ATTENDED" },
        select: {
          id: true,
          attendedAt: true,
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: { attendedAt: "asc" },
      }),
      prisma.pendingInspectionAttendance.findMany({
        where: { slotId },
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return Response.json({
      attended: attendedBookings.map((b) => ({
        bookingId: b.id,
        attendedAt: b.attendedAt?.toISOString() ?? null,
        buyer: b.buyer,
      })),
      pending: pendingAttendances.map((p) => ({
        id: p.id,
        email: p.email,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

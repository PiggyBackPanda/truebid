import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwner, errorResponse, ApiError } from "@/lib/api-helpers";
import { createInspectionSlotSchema } from "@/lib/validation";

const MAX_SLOTS_PER_LISTING = 20;
const MIN_LEAD_TIME_MS = 2 * 60 * 60 * 1000;   // 2 hours
const MAX_DURATION_MS  = 4 * 60 * 60 * 1000;   // 4 hours

// GET /api/listings/[id]/inspections
// Public: returns upcoming slots with available spot counts.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const slots = await prisma.inspectionSlot.findMany({
      where: {
        listingId: id,
        status: "SCHEDULED",
        startTime: { gt: new Date() },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        type: true,
        startTime: true,
        endTime: true,
        maxGroups: true,
        notes: true,
        _count: {
          select: { bookings: { where: { status: "CONFIRMED" } } },
        },
      },
    });

    const result = slots.map((s) => {
      const confirmedCount = s._count.bookings;
      const availableSpots = s.type === "OPEN_HOUSE" ? null : s.maxGroups - confirmedCount;
      return {
        id: s.id,
        type: s.type,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        availableSpots,
        isFull: s.type === "SCHEDULED" && confirmedCount >= s.maxGroups,
        notes: s.notes ?? null,
      };
    });

    return Response.json({ slots: result });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/listings/[id]/inspections
// Seller only: create a new inspection slot.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        status: true,
        _count: { select: { inspectionSlots: { where: { status: { not: "CANCELLED" } } } } },
      },
    });

    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found");
    requireOwner(user, listing.sellerId);

    const allowedStatuses = ["DRAFT", "COMING_SOON", "INSPECTIONS_OPEN", "ACTIVE"];
    if (!allowedStatuses.includes(listing.status)) {
      throw new ApiError(400, "LISTING_NOT_EDITABLE", "Cannot add inspection slots to a listing in this state");
    }

    if (listing._count.inspectionSlots >= MAX_SLOTS_PER_LISTING) {
      throw new ApiError(400, "TOO_MANY_SLOTS", `Maximum of ${MAX_SLOTS_PER_LISTING} inspection slots per listing`);
    }

    const body = await req.json();
    const data = createInspectionSlotSchema.parse(body);

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const now = new Date();

    if (start.getTime() - now.getTime() < MIN_LEAD_TIME_MS) {
      throw new ApiError(400, "TOO_SOON", "Inspection slots must be at least 2 hours in the future");
    }

    if (end <= start) {
      throw new ApiError(400, "INVALID_TIME_RANGE", "End time must be after start time");
    }

    if (end.getTime() - start.getTime() > MAX_DURATION_MS) {
      throw new ApiError(400, "SLOT_TOO_LONG", "Inspection slots cannot be longer than 4 hours");
    }

    if (data.type === "SCHEDULED" && !data.maxGroups) {
      throw new ApiError(400, "MAX_GROUPS_REQUIRED", "maxGroups is required for SCHEDULED slots");
    }

    // Check for overlapping slots on this listing
    const overlap = await prisma.inspectionSlot.findFirst({
      where: {
        listingId: id,
        status: { not: "CANCELLED" },
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } },
        ],
      },
      select: { id: true },
    });

    if (overlap) {
      throw new ApiError(400, "SLOT_OVERLAP", "This time slot overlaps with an existing inspection");
    }

    const slot = await prisma.$transaction(async (tx) => {
      const created = await tx.inspectionSlot.create({
        data: {
          listingId: id,
          type: data.type,
          status: "SCHEDULED",
          startTime: start,
          endTime: end,
          maxGroups: data.type === "SCHEDULED" ? (data.maxGroups ?? 4) : 0,
          notes: data.notes ?? null,
        },
        select: {
          id: true, type: true, status: true,
          startTime: true, endTime: true, maxGroups: true, notes: true,
        },
      });

      // Auto-transition COMING_SOON → INSPECTIONS_OPEN when first slot is added
      if (listing.status === "COMING_SOON") {
        await tx.listing.update({
          where: { id },
          data: { status: "INSPECTIONS_OPEN" },
        });
      }

      return created;
    });

    return Response.json(
      {
        slot: {
          ...slot,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

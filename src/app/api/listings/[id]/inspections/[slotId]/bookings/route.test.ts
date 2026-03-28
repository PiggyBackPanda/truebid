import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, mockBuyer, parseResponse } from "@/test/helpers";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockPrisma, mockRequireAuth, mockRequireOwner, mockRequireVerified } = vi.hoisted(() => {
  const createModelMock = () => ({
    findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(),
    create: vi.fn(), update: vi.fn(), updateMany: vi.fn(),
    delete: vi.fn(), count: vi.fn(), upsert: vi.fn(), groupBy: vi.fn(),
  });
  return {
    mockPrisma: {
      user: createModelMock(), listing: createModelMock(),
      listingImage: createModelMock(), offer: createModelMock(),
      offerHistory: createModelMock(), message: createModelMock(),
      conversation: createModelMock(), conversationMessage: createModelMock(),
      favourite: createModelMock(), checklistProgress: createModelMock(),
      listingView: createModelMock(), inspectionSlot: createModelMock(),
      inspectionBooking: createModelMock(),
      $queryRaw: vi.fn().mockResolvedValue([]), // FOR UPDATE lock, no-op in tests
      $transaction: vi.fn((fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
    },
    mockRequireAuth: vi.fn(),
    mockRequireOwner: vi.fn(),
    mockRequireVerified: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/api-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-helpers")>();
  return {
    ...actual,
    requireAuth: mockRequireAuth,
    requireVerified: mockRequireVerified,
    requireOwner: mockRequireOwner,
  };
});
vi.mock("@/lib/email", () => ({
  sendInspectionBookingConfirmedEmail: vi.fn().mockResolvedValue(undefined),
  sendInspectionNewBookingEmail: vi.fn().mockResolvedValue(undefined),
  sendBuyerCancelledBookingEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST, GET } from "./route";
import { DELETE } from "./[bookingId]/route";
import { PATCH as PATCH_ATTENDANCE } from "./[bookingId]/attendance/route";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeBookingsParams(id: string, slotId: string) {
  return { params: Promise.resolve({ id, slotId }) };
}

function makeBookingParams(id: string, slotId: string, bookingId: string) {
  return { params: Promise.resolve({ id, slotId, bookingId }) };
}

function postRequest(id: string, slotId: string, body: object = {}) {
  return new Request(
    `http://localhost/api/listings/${id}/inspections/${slotId}/bookings`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
}

function deleteRequest(id: string, slotId: string, bookingId: string) {
  return new Request(
    `http://localhost/api/listings/${id}/inspections/${slotId}/bookings/${bookingId}`,
    { method: "DELETE" }
  );
}

function patchRequest(id: string, slotId: string, bookingId: string, body: object) {
  return new Request(
    `http://localhost/api/listings/${id}/inspections/${slotId}/bookings/${bookingId}/attendance`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
}

// A slot time safely in the future (4 hours from now)
const futureSlotStart = new Date(Date.now() + 4 * 60 * 60 * 1000);
const futureSlotEnd   = new Date(Date.now() + 4.5 * 60 * 60 * 1000);
// A slot in the past
const pastSlotStart   = new Date(Date.now() - 2 * 60 * 60 * 1000);
// A slot within the 2-hour cancellation cutoff (1 hour from now)
const soonSlotStart   = new Date(Date.now() + 1 * 60 * 60 * 1000);
const soonSlotEnd     = new Date(Date.now() + 1.5 * 60 * 60 * 1000);

function baseSlot(overrides: object = {}) {
  return {
    id: "slot_1",
    listingId: "listing_1",
    type: "SCHEDULED",
    status: "SCHEDULED",
    startTime: futureSlotStart,
    endTime: futureSlotEnd,
    maxGroups: 4,
    notes: null,
    listing: {
      id: "listing_1",
      sellerId: "seller_1",
      streetAddress: "1 Test St",
      suburb: "Perth",
      state: "WA",
      seller: { email: "seller@example.com", firstName: "Jane" },
    },
    _count: { bookings: 1 },
    ...overrides,
  };
}

function baseBooking(overrides: object = {}) {
  return {
    id: "booking_1",
    buyerId: "user_buyer_1",
    status: "CONFIRMED",
    note: null,
    slot: {
      id: "slot_1",
      listingId: "listing_1",
      startTime: futureSlotStart,
      endTime: futureSlotEnd,
      maxGroups: 4,
      listing: {
        streetAddress: "1 Test St",
        suburb: "Perth",
        state: "WA",
        seller: { email: "seller@example.com", firstName: "Jane" },
      },
      _count: { bookings: 1 },
    },
    buyer: { firstName: "John", lastName: "Doe" },
    ...overrides,
  };
}

// ── POST /bookings ─────────────────────────────────────────────────────────────

describe("POST /api/listings/[id]/inspections/[slotId]/bookings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a booking for a verified buyer: 201", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(baseSlot());
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue(null); // no existing booking
    mockPrisma.inspectionBooking.upsert.mockResolvedValue({
      id: "booking_1", status: "CONFIRMED", note: null, createdAt: new Date(),
    });

    const req = postRequest("listing_1", "slot_1");
    const { status, body } = await parseResponse(
      await POST(req as never, makeBookingsParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(201);
    expect(body.booking.status).toBe("CONFIRMED");
    expect(body.booking.slotId).toBe("slot_1");
  });

  it("returns 403 VERIFICATION_REQUIRED for unverified buyer", async () => {
    const buyer = mockBuyer({ verificationStatus: "PENDING" });
    mockRequireAuth.mockResolvedValue(buyer);
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireVerified.mockImplementation(() => {
      throw new ApiError(403, "VERIFICATION_REQUIRED", "Identity verification required");
    });

    const req = postRequest("listing_1", "slot_1");
    const { status, body } = await parseResponse(
      await POST(req as never, makeBookingsParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(403);
    expect(body.code).toBe("VERIFICATION_REQUIRED");
  });

  it("returns 409 SLOT_FULL when slot has no remaining capacity", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(
      baseSlot({ maxGroups: 2, _count: { bookings: 2 } })
    );
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue(null);
    // Transaction re-checks count with a fresh query
    mockPrisma.inspectionBooking.count.mockResolvedValue(2);

    const req = postRequest("listing_1", "slot_1");
    const { status, body } = await parseResponse(
      await POST(req as never, makeBookingsParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(409);
    expect(body.code).toBe("SLOT_FULL");
    expect(body.details?.spotsRemaining).toBe(0);
  });

  it("returns 409 ALREADY_BOOKED when buyer has an active booking", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(baseSlot());
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue({
      id: "booking_existing", status: "CONFIRMED",
    });

    const req = postRequest("listing_1", "slot_1");
    const { status, body } = await parseResponse(
      await POST(req as never, makeBookingsParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(409);
    expect(body.code).toBe("ALREADY_BOOKED");
  });

  it("returns 400 NO_BOOKING_REQUIRED for OPEN_HOUSE slots", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(
      baseSlot({ type: "OPEN_HOUSE" })
    );

    const req = postRequest("listing_1", "slot_1");
    const { status, body } = await parseResponse(
      await POST(req as never, makeBookingsParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(400);
    expect(body.code).toBe("NO_BOOKING_REQUIRED");
  });

  it("returns 403 CANNOT_BOOK_OWN_LISTING when seller tries to book", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(
      baseSlot({ listing: { ...baseSlot().listing, sellerId: "seller_1" } })
    );

    const req = postRequest("listing_1", "slot_1");
    const { status, body } = await parseResponse(
      await POST(req as never, makeBookingsParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(403);
    expect(body.code).toBe("CANNOT_BOOK_OWN_LISTING");
  });
});

// ── GET /bookings ──────────────────────────────────────────────────────────────

describe("GET /api/listings/[id]/inspections/[slotId]/bookings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns bookings for the slot owner", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue({
      id: "slot_1", listingId: "listing_1",
      startTime: futureSlotStart, endTime: futureSlotEnd,
      maxGroups: 4, notes: null,
      listing: { sellerId: "seller_1" },
      _count: { bookings: 1 },
    });
    mockPrisma.inspectionBooking.findMany.mockResolvedValue([
      {
        id: "booking_1", status: "CONFIRMED", note: null,
        createdAt: new Date(), attendedAt: null,
        buyer: {
          firstName: "John", lastName: "Doe",
          email: "buyer@example.com", phone: null,
          verificationStatus: "VERIFIED",
        },
      },
    ]);

    const req = new Request("http://localhost/api/listings/listing_1/inspections/slot_1/bookings");
    const { status, body } = await parseResponse(
      await GET(req as never, makeBookingsParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(200);
    expect(body.bookings).toHaveLength(1);
    expect(body.bookings[0].buyer.email).toBe("buyer@example.com");
  });

  it("returns 403 when non-owner tries to view bookings", async () => {
    const otherUser = mockBuyer();
    mockRequireAuth.mockResolvedValue(otherUser);
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireOwner.mockImplementation(() => {
      throw new ApiError(403, "FORBIDDEN", "Not the owner");
    });
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue({
      id: "slot_1", listingId: "listing_1",
      startTime: futureSlotStart, endTime: futureSlotEnd,
      maxGroups: 4, notes: null,
      listing: { sellerId: "seller_1" },
      _count: { bookings: 0 },
    });

    const req = new Request("http://localhost/api/listings/listing_1/inspections/slot_1/bookings");
    const { status } = await parseResponse(
      await GET(req as never, makeBookingsParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(403);
  });
});

// ── DELETE /bookings/[bookingId] ───────────────────────────────────────────────

describe("DELETE /api/listings/[id]/inspections/[slotId]/bookings/[bookingId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cancels booking when more than 2 hours before slot: 200", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue(baseBooking());
    mockPrisma.inspectionBooking.update.mockResolvedValue({});

    const req = deleteRequest("listing_1", "slot_1", "booking_1");
    const { status, body } = await parseResponse(
      await DELETE(req as never, makeBookingParams("listing_1", "slot_1", "booking_1") as never)
    );

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrisma.inspectionBooking.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) })
    );
  });

  it("returns 400 TOO_LATE_TO_CANCEL when less than 2 hours before slot", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue(
      baseBooking({
        slot: {
          id: "slot_1",
          listingId: "listing_1",
          startTime: soonSlotStart,
          endTime: soonSlotEnd,
          maxGroups: 4,
          listing: {
            streetAddress: "1 Test St", suburb: "Perth", state: "WA",
            seller: { email: "seller@example.com", firstName: "Jane" },
          },
          _count: { bookings: 1 },
        },
      })
    );

    const req = deleteRequest("listing_1", "slot_1", "booking_1");
    const { status, body } = await parseResponse(
      await DELETE(req as never, makeBookingParams("listing_1", "slot_1", "booking_1") as never)
    );

    expect(status).toBe(400);
    expect(body.code).toBe("TOO_LATE_TO_CANCEL");
  });

  it("returns 403 when buyer tries to cancel another buyer's booking", async () => {
    const otherBuyer = mockBuyer({ id: "different_buyer" });
    mockRequireAuth.mockResolvedValue(otherBuyer);
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue(baseBooking()); // buyerId: "user_buyer_1"

    const req = deleteRequest("listing_1", "slot_1", "booking_1");
    const { status, body } = await parseResponse(
      await DELETE(req as never, makeBookingParams("listing_1", "slot_1", "booking_1") as never)
    );

    expect(status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("returns 400 BOOKING_NOT_ACTIVE when booking is already cancelled", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue(
      baseBooking({ status: "CANCELLED" })
    );

    const req = deleteRequest("listing_1", "slot_1", "booking_1");
    const { status, body } = await parseResponse(
      await DELETE(req as never, makeBookingParams("listing_1", "slot_1", "booking_1") as never)
    );

    expect(status).toBe(400);
    expect(body.code).toBe("BOOKING_NOT_ACTIVE");
  });
});

// ── PATCH /bookings/[bookingId]/attendance ─────────────────────────────────────

describe("PATCH /api/listings/[id]/inspections/[slotId]/bookings/[bookingId]/attendance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks booking as ATTENDED after slot start time: 200", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue({
      id: "booking_1",
      status: "CONFIRMED",
      slot: {
        id: "slot_1",
        listingId: "listing_1",
        startTime: pastSlotStart,  // already started
        listing: { sellerId: "seller_1" },
      },
    });
    mockPrisma.inspectionBooking.update.mockResolvedValue({
      id: "booking_1", status: "ATTENDED", attendedAt: new Date(), markedNoShowAt: null,
    });

    const req = patchRequest("listing_1", "slot_1", "booking_1", { status: "ATTENDED" });
    const { status, body } = await parseResponse(
      await PATCH_ATTENDANCE(req as never, makeBookingParams("listing_1", "slot_1", "booking_1") as never)
    );

    expect(status).toBe(200);
    expect(body.booking.status).toBe("ATTENDED");
  });

  it("returns 400 INSPECTION_NOT_YET_STARTED when marking attendance before slot time", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue({
      id: "booking_1",
      status: "CONFIRMED",
      slot: {
        id: "slot_1",
        listingId: "listing_1",
        startTime: futureSlotStart,  // hasn't started yet
        listing: { sellerId: "seller_1" },
      },
    });

    const req = patchRequest("listing_1", "slot_1", "booking_1", { status: "ATTENDED" });
    const { status, body } = await parseResponse(
      await PATCH_ATTENDANCE(req as never, makeBookingParams("listing_1", "slot_1", "booking_1") as never)
    );

    expect(status).toBe(400);
    expect(body.code).toBe("INSPECTION_NOT_YET_STARTED");
  });

  it("marks booking as NO_SHOW: 200", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue({
      id: "booking_1",
      status: "CONFIRMED",
      slot: {
        id: "slot_1",
        listingId: "listing_1",
        startTime: pastSlotStart,
        listing: { sellerId: "seller_1" },
      },
    });
    mockPrisma.inspectionBooking.update.mockResolvedValue({
      id: "booking_1", status: "NO_SHOW", attendedAt: null, markedNoShowAt: new Date(),
    });

    const req = patchRequest("listing_1", "slot_1", "booking_1", { status: "NO_SHOW" });
    const { status, body } = await parseResponse(
      await PATCH_ATTENDANCE(req as never, makeBookingParams("listing_1", "slot_1", "booking_1") as never)
    );

    expect(status).toBe(200);
    expect(body.booking.status).toBe("NO_SHOW");
  });

  it("returns 400 BOOKING_NOT_ACTIVE when booking is not CONFIRMED", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionBooking.findUnique.mockResolvedValue({
      id: "booking_1",
      status: "CANCELLED",
      slot: {
        id: "slot_1",
        listingId: "listing_1",
        startTime: pastSlotStart,
        listing: { sellerId: "seller_1" },
      },
    });

    const req = patchRequest("listing_1", "slot_1", "booking_1", { status: "ATTENDED" });
    const { status, body } = await parseResponse(
      await PATCH_ATTENDANCE(req as never, makeBookingParams("listing_1", "slot_1", "booking_1") as never)
    );

    expect(status).toBe(400);
    expect(body.code).toBe("BOOKING_NOT_ACTIVE");
  });
});

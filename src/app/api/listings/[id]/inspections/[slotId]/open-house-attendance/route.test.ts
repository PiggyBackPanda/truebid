import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse } from "@/test/helpers";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockPrisma, mockRequireAuth, mockRequireOwner } = vi.hoisted(() => {
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
      pendingInspectionAttendance: createModelMock(),
      $transaction: vi.fn((fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
    },
    mockRequireAuth: vi.fn(),
    mockRequireOwner: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/api-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-helpers")>();
  return { ...actual, requireAuth: mockRequireAuth, requireOwner: mockRequireOwner };
});

import { POST } from "./route";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeParams(id: string, slotId: string) {
  return { params: Promise.resolve({ id, slotId }) };
}

function postRequest(id: string, slotId: string, body: object) {
  return new Request(
    `http://localhost/api/listings/${id}/inspections/${slotId}/open-house-attendance`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
}

function baseOpenHouseSlot(overrides: object = {}) {
  return {
    id: "slot_1",
    listingId: "listing_1",
    type: "OPEN_HOUSE",
    status: "COMPLETED",
    listing: { sellerId: "seller_1" },
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("POST /api/listings/[id]/inspections/[slotId]/open-house-attendance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks existing registered user as ATTENDED: creates synthetic booking", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(baseOpenHouseSlot());
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "buyer_1", firstName: "Alice", lastName: "Smith",
      email: "alice@example.com", verificationStatus: "VERIFIED",
    });
    mockPrisma.inspectionBooking.upsert.mockResolvedValue({
      id: "booking_syn_1", status: "ATTENDED",
    });

    const req = postRequest("listing_1", "slot_1", { email: "alice@example.com" });
    const { status, body } = await parseResponse(
      await POST(req as never, makeParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(200);
    expect(body.result).toBe("ATTENDANCE_RECORDED");
    expect(mockPrisma.inspectionBooking.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: "ATTENDED", buyerId: "buyer_1" }),
      })
    );
  });

  it("creates PendingInspectionAttendance for unknown email", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(baseOpenHouseSlot());
    mockPrisma.user.findUnique.mockResolvedValue(null); // user not found
    mockPrisma.pendingInspectionAttendance.upsert.mockResolvedValue({
      id: "pending_1", slotId: "slot_1", email: "unknown@example.com",
    });

    const req = postRequest("listing_1", "slot_1", { email: "unknown@example.com" });
    const { status, body } = await parseResponse(
      await POST(req as never, makeParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(200);
    expect(body.result).toBe("ATTENDANCE_RECORDED");
    expect(mockPrisma.pendingInspectionAttendance.upsert).toHaveBeenCalled();
  });

  it("returns 400 NOT_OPEN_HOUSE for SCHEDULED slot", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(
      baseOpenHouseSlot({ type: "SCHEDULED" })
    );

    const req = postRequest("listing_1", "slot_1", { email: "alice@example.com" });
    const { status, body } = await parseResponse(
      await POST(req as never, makeParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(400);
    expect(body.code).toBe("NOT_OPEN_HOUSE");
  });

  it("returns 400 SLOT_NOT_COMPLETED when slot is still SCHEDULED", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(
      baseOpenHouseSlot({ status: "SCHEDULED" })
    );

    const req = postRequest("listing_1", "slot_1", { email: "alice@example.com" });
    const { status, body } = await parseResponse(
      await POST(req as never, makeParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(400);
    expect(body.code).toBe("SLOT_NOT_COMPLETED");
  });

  it("returns 403 when non-owner tries to mark attendance", async () => {
    const otherUser = mockUser({ id: "other_user" });
    mockRequireAuth.mockResolvedValue(otherUser);
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireOwner.mockImplementation(() => {
      throw new ApiError(403, "FORBIDDEN", "Not the owner");
    });
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(baseOpenHouseSlot());

    const req = postRequest("listing_1", "slot_1", { email: "alice@example.com" });
    const { status } = await parseResponse(
      await POST(req as never, makeParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(403);
  });

  it("returns 400 VALIDATION_ERROR for invalid email", async () => {
    const seller = mockUser({ id: "seller_1" });
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.inspectionSlot.findUnique.mockResolvedValue(baseOpenHouseSlot());

    const req = postRequest("listing_1", "slot_1", { email: "not-an-email" });
    const { status } = await parseResponse(
      await POST(req as never, makeParams("listing_1", "slot_1") as never)
    );

    expect(status).toBe(400);
  });
});

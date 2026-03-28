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
      $transaction: vi.fn((fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
    },
    mockRequireAuth: vi.fn(),
    mockRequireOwner: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/api-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-helpers")>();
  return {
    ...actual,
    requireAuth: mockRequireAuth,
    requireVerified: vi.fn(),
    requireOwner: mockRequireOwner,
  };
});

import { GET, POST } from "./route";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function postRequest(id: string, body: object) {
  return new Request(`http://localhost/api/listings/${id}/inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// A start time safely in the future (3 hours from now)
const futureStart = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
const futureEnd   = new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString();

function baseListing(overrides: object = {}) {
  return {
    id: "listing_1",
    sellerId: "user_1",
    status: "COMING_SOON",
    _count: { inspectionSlots: 0 },
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("GET /api/listings/[id]/inspections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns upcoming slots with availability", async () => {
    mockPrisma.inspectionSlot.findMany.mockResolvedValue([
      {
        id: "slot_1",
        type: "SCHEDULED",
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 5400000),
        maxGroups: 4,
        notes: null,
        _count: { bookings: 2 },
      },
    ]);

    const req = new Request("http://localhost/api/listings/listing_1/inspections");
    const { status, body } = await parseResponse(await GET(req as never, makeParams("listing_1") as never));

    expect(status).toBe(200);
    expect(body.slots).toHaveLength(1);
    expect(body.slots[0].availableSpots).toBe(2);
    expect(body.slots[0].isFull).toBe(false);
  });

  it("returns null availableSpots for open house slots", async () => {
    mockPrisma.inspectionSlot.findMany.mockResolvedValue([
      {
        id: "slot_2",
        type: "OPEN_HOUSE",
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        maxGroups: 0,
        notes: "Come any time",
        _count: { bookings: 0 },
      },
    ]);

    const req = new Request("http://localhost/api/listings/listing_1/inspections");
    const { status, body } = await parseResponse(await GET(req as never, makeParams("listing_1") as never));

    expect(status).toBe(200);
    expect(body.slots[0].availableSpots).toBeNull();
    expect(body.slots[0].isFull).toBe(false);
  });
});

describe("POST /api/listings/[id]/inspections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a SCHEDULED slot and returns 201", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing());
    mockPrisma.inspectionSlot.findFirst.mockResolvedValue(null); // no overlap
    mockPrisma.inspectionSlot.create.mockResolvedValue({
      id: "slot_1", type: "SCHEDULED", status: "SCHEDULED",
      startTime: new Date(futureStart), endTime: new Date(futureEnd),
      maxGroups: 4, notes: null,
    });
    mockPrisma.listing.update.mockResolvedValue({});

    const req = postRequest("listing_1", {
      type: "SCHEDULED", startTime: futureStart, endTime: futureEnd, maxGroups: 4,
    });
    const { status, body } = await parseResponse(await POST(req as never, makeParams("listing_1") as never));

    expect(status).toBe(201);
    expect(body.slot.type).toBe("SCHEDULED");
  });

  it("auto-transitions listing from COMING_SOON to INSPECTIONS_OPEN", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ status: "COMING_SOON" }));
    mockPrisma.inspectionSlot.findFirst.mockResolvedValue(null);
    mockPrisma.inspectionSlot.create.mockResolvedValue({
      id: "slot_1", type: "SCHEDULED", status: "SCHEDULED",
      startTime: new Date(futureStart), endTime: new Date(futureEnd),
      maxGroups: 4, notes: null,
    });
    mockPrisma.listing.update.mockResolvedValue({});

    const req = postRequest("listing_1", {
      type: "SCHEDULED", startTime: futureStart, endTime: futureEnd, maxGroups: 4,
    });
    await POST(req as never, makeParams("listing_1") as never);

    expect(mockPrisma.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "INSPECTIONS_OPEN" } })
    );
  });

  it("does NOT transition listing already INSPECTIONS_OPEN", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ status: "INSPECTIONS_OPEN" }));
    mockPrisma.inspectionSlot.findFirst.mockResolvedValue(null);
    mockPrisma.inspectionSlot.create.mockResolvedValue({
      id: "slot_2", type: "OPEN_HOUSE", status: "SCHEDULED",
      startTime: new Date(futureStart), endTime: new Date(futureEnd),
      maxGroups: 0, notes: null,
    });

    const req = postRequest("listing_1", {
      type: "OPEN_HOUSE", startTime: futureStart, endTime: futureEnd,
    });
    await POST(req as never, makeParams("listing_1") as never);

    expect(mockPrisma.listing.update).not.toHaveBeenCalled();
  });

  it("returns 400 if slot overlaps with an existing slot", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing());
    mockPrisma.inspectionSlot.findFirst.mockResolvedValue({ id: "existing_slot" });

    const req = postRequest("listing_1", {
      type: "SCHEDULED", startTime: futureStart, endTime: futureEnd, maxGroups: 4,
    });
    const { status, body } = await parseResponse(await POST(req as never, makeParams("listing_1") as never));

    expect(status).toBe(400);
    expect(body.code).toBe("SLOT_OVERLAP");
  });

  it("returns 400 if SCHEDULED slot is missing maxGroups", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing());
    mockPrisma.inspectionSlot.findFirst.mockResolvedValue(null);

    const req = postRequest("listing_1", {
      type: "SCHEDULED", startTime: futureStart, endTime: futureEnd,
      // maxGroups omitted
    });
    const { status, body } = await parseResponse(await POST(req as never, makeParams("listing_1") as never));

    expect(status).toBe(400);
    expect(body.code).toBe("MAX_GROUPS_REQUIRED");
  });

  it("returns 403 when non-owner tries to add a slot", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireOwner.mockImplementation(() => {
      throw new ApiError(403, "FORBIDDEN", "Not the owner");
    });
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ sellerId: "other_user" }));

    const req = postRequest("listing_1", {
      type: "SCHEDULED", startTime: futureStart, endTime: futureEnd, maxGroups: 2,
    });
    const { status } = await parseResponse(await POST(req as never, makeParams("listing_1") as never));

    expect(status).toBe(403);
  });
});

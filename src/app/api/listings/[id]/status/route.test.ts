import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse } from "@/test/helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockPrisma, mockRequireAuth, mockRequireVerified, mockRequireOwner } = vi.hoisted(() => {
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
      listingView: createModelMock(), $transaction: vi.fn(),
    },
    mockRequireAuth: vi.fn(),
    mockRequireVerified: vi.fn(),
    mockRequireOwner: vi.fn(),
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

import { PATCH } from "./route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patchRequest(id: string, body: object) {
  return new Request(`http://localhost/api/listings/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function baseListing(overrides: object = {}) {
  return {
    id: "listing_1",
    sellerId: "user_1",
    status: "DRAFT",
    saleMethod: "FIXED_PRICE",
    closingDate: null,
    description: "A lovely home",
    propertyType: "HOUSE",
    bedrooms: 3,
    bathrooms: 2,
    carSpaces: 1,
    images: [{ id: "img_1" }],
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PATCH /api/listings/[id]/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("transitions DRAFT → COMING_SOON successfully", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing());
    mockPrisma.listing.update.mockResolvedValue({ id: "listing_1", status: "COMING_SOON", publishedAt: new Date() });

    const req = patchRequest("listing_1", { status: "COMING_SOON" });
    const { status, body } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(200);
    expect(body.listing.status).toBe("COMING_SOON");
    expect(mockPrisma.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ publishedAt: expect.any(Date) }) })
    );
  });

  it("transitions DRAFT → ACTIVE successfully for FIXED_PRICE", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ status: "DRAFT", saleMethod: "FIXED_PRICE" }));
    mockPrisma.listing.update.mockResolvedValue({ id: "listing_1", status: "ACTIVE", publishedAt: new Date() });

    const req = patchRequest("listing_1", { status: "ACTIVE" });
    const { status } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(200);
  });

  it("transitions COMING_SOON → ACTIVE", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ status: "COMING_SOON" }));
    mockPrisma.listing.update.mockResolvedValue({ id: "listing_1", status: "ACTIVE", publishedAt: new Date() });

    const req = patchRequest("listing_1", { status: "ACTIVE" });
    const { status } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(200);
  });

  it("transitions INSPECTIONS_OPEN → COMING_SOON (revert)", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ status: "INSPECTIONS_OPEN" }));
    mockPrisma.listing.update.mockResolvedValue({ id: "listing_1", status: "COMING_SOON", publishedAt: new Date() });

    const req = patchRequest("listing_1", { status: "COMING_SOON" });
    const { status } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(200);
  });

  it("rejects invalid transition ACTIVE → COMING_SOON", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ status: "ACTIVE" }));

    const req = patchRequest("listing_1", { status: "COMING_SOON" });
    const { status, body } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_TRANSITION");
  });

  it("rejects invalid transition SOLD → any", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ status: "SOLD" }));

    const req = patchRequest("listing_1", { status: "ACTIVE" });
    const { status, body } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_TRANSITION");
  });

  it("returns 400 LISTING_INCOMPLETE when publishing without images", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ images: [] }));

    const req = patchRequest("listing_1", { status: "COMING_SOON" });
    const { status, body } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(400);
    expect(body.code).toBe("LISTING_INCOMPLETE");
    expect(body.details.missingFields).toContain("images");
  });

  it("returns 400 MISSING_CLOSING_DATE when OPEN_OFFERS goes to ACTIVE without closing date", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(
      baseListing({ status: "COMING_SOON", saleMethod: "OPEN_OFFERS", closingDate: null })
    );

    const req = patchRequest("listing_1", { status: "ACTIVE" });
    const { status, body } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(400);
    expect(body.code).toBe("MISSING_CLOSING_DATE");
  });

  it("returns 403 when a non-owner attempts a transition", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    // Simulate requireOwner throwing
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireOwner.mockImplementation(() => {
      throw new ApiError(403, "FORBIDDEN", "Not the owner");
    });
    mockPrisma.listing.findUnique.mockResolvedValue(baseListing({ sellerId: "other_user" }));

    const req = patchRequest("listing_1", { status: "COMING_SOON" });
    const { status } = await parseResponse(await PATCH(req as never, makeParams("listing_1") as never));

    expect(status).toBe(403);
  });

  it("returns 404 when listing does not exist", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    const req = patchRequest("nonexistent", { status: "COMING_SOON" });
    const { status, body } = await parseResponse(await PATCH(req as never, makeParams("nonexistent") as never));

    expect(status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });
});

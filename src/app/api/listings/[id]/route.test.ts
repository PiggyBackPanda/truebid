import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse } from "@/test/helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

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
      listingView: createModelMock(), $transaction: vi.fn(),
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
    requireOwner: mockRequireOwner,
  };
});

import { GET, PATCH, DELETE } from "./route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/listings/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns listing with offers for OPEN_OFFERS", async () => {
    const now = new Date();
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      status: "ACTIVE",
      streetAddress: "1 Main St",
      suburb: "Perth",
      state: "WA",
      postcode: "6000",
      latitude: null,
      longitude: null,
      propertyType: "HOUSE",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,
      landSizeM2: 500,
      buildingSizeM2: null,
      yearBuilt: null,
      title: null,
      description: "A nice house",
      features: [],
      guidePriceCents: 80_000_000,
      guideRangeMaxCents: null,
      saleMethod: "OPEN_OFFERS",
      closingDate: now,
      originalClosingDate: now,
      minOfferCents: null,
      requireDeposit: false,
      depositAmountCents: null,
      createdAt: now,
      publishedAt: now,
      images: [],
      seller: { id: "seller_1", firstName: "Jane", publicAlias: "Buyer_ab12", verificationStatus: "VERIFIED" },
      offers: [
        {
          id: "offer_1",
          amountCents: 80_000_000,
          conditionType: "UNCONDITIONAL",
          conditionText: null,
          settlementDays: 30,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now,
          buyer: { publicAlias: "Buyer_cd34" },
        },
      ],
    });

    const req = new Request("http://localhost/api/listings/listing_1");
    const res = await GET(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.listing.offers).toHaveLength(1);
    expect(body.listing.offers[0].publicAlias).toBe("Buyer_cd34");
  });

  it("returns 404 for non-existent listing", async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/listings/nonexistent");
    const res = await GET(req as never, makeParams("nonexistent") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });
});

describe("PATCH /api/listings/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a listing", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "DRAFT",
    });

    mockPrisma.listing.update.mockResolvedValue({
      id: "listing_1",
      status: "DRAFT",
      streetAddress: "1 Main St",
      suburb: "Fremantle",
      state: "WA",
      saleMethod: "OPEN_OFFERS",
      updatedAt: new Date(),
    });

    const req = new Request("http://localhost/api/listings/listing_1", {
      method: "PATCH",
      body: JSON.stringify({ suburb: "Fremantle" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.listing.suburb).toBe("Fremantle");
  });

  it("returns 404 for non-existent listing", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/listings/nonexistent", {
      method: "PATCH",
      body: JSON.stringify({ suburb: "Perth" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req as never, makeParams("nonexistent") as never);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/listings/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a draft listing", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "DRAFT",
    });
    mockPrisma.listing.delete.mockResolvedValue({});

    const req = new Request("http://localhost/api/listings/listing_1", {
      method: "DELETE",
    });

    const res = await DELETE(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 400 if listing is not draft", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "ACTIVE",
    });

    const req = new Request("http://localhost/api/listings/listing_1", {
      method: "DELETE",
    });

    const res = await DELETE(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });
});

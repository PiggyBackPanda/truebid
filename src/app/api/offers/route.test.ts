import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, mockBuyer, parseResponse, CUID } from "@/test/helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockPrisma, mockRequireAuth, mockRequireVerified } = vi.hoisted(() => {
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
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/api-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-helpers")>();
  return {
    ...actual,
    requireAuth: mockRequireAuth,
    requireVerified: mockRequireVerified,
  };
});

vi.mock("@/lib/offers", () => ({
  checkAntiSnipe: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/socket", () => ({
  emitToListing: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendNewOfferEmail: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/offers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the authenticated buyer's offers", async () => {
    const user = mockBuyer();
    mockRequireAuth.mockResolvedValue(user);

    const now = new Date();
    mockPrisma.offer.findMany.mockResolvedValue([
      {
        id: "offer_1",
        amountCents: 80_000_000,
        conditionType: "UNCONDITIONAL",
        conditionText: null,
        settlementDays: 30,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
        listing: {
          id: "listing_1",
          streetAddress: "1 Main St",
          suburb: "Perth",
          state: "WA",
          postcode: "6000",
          status: "ACTIVE",
          closingDate: null,
        },
      },
    ]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.offers).toHaveLength(1);
    expect(body.offers[0].amountCents).toBe(80_000_000);
  });

  it("returns 401 when not authenticated", async () => {
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireAuth.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Authentication required"));

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/offers", () => {
  beforeEach(() => vi.clearAllMocks());

  const validOffer = {
    listingId: CUID.listing1,
    amountCents: 80_000_000,
    conditionType: "UNCONDITIONAL",
    settlementDays: 30,
    legalAcknowledgedAt: new Date().toISOString(),
  };

  function setupValidPost() {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockRequireVerified.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: "user_seller_1",
      status: "ACTIVE",
      saleMethod: "OPEN_OFFERS",
      closingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      minOfferCents: null,
      streetAddress: "1 Main St",
      suburb: "Perth",
      state: "WA",
      seller: { email: "seller@example.com", firstName: "Jane" },
    });

    mockPrisma.offer.findUnique.mockResolvedValue(null);

    const now = new Date();
    mockPrisma.offer.create.mockResolvedValue({
      id: "offer_new",
      amountCents: 80_000_000,
      conditionType: "UNCONDITIONAL",
      conditionText: null,
      settlementDays: 30,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
      buyer: { publicAlias: "Buyer_cd34" },
    });

    return buyer;
  }

  it("creates an offer and returns 201", async () => {
    setupValidPost();

    const req = new Request("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(validOffer),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.offer.id).toBe("offer_new");
    expect(body.offer.status).toBe("ACTIVE");
  });

  it("returns 404 if listing not found", async () => {
    mockRequireAuth.mockResolvedValue(mockBuyer());
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(validOffer),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });

  it("returns 400 if listing is not active", async () => {
    mockRequireAuth.mockResolvedValue(mockBuyer());
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: "user_seller_1",
      status: "SOLD",
      saleMethod: "OPEN_OFFERS",
      closingDate: null,
      minOfferCents: null,
      streetAddress: "1 Main St",
      suburb: "Perth",
      state: "WA",
      seller: { email: "seller@example.com", firstName: "Jane" },
    });

    const req = new Request("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(validOffer),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("LISTING_NOT_ACTIVE");
  });

  it("returns 403 if seller tries to offer on own listing", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: seller.id,
      status: "ACTIVE",
      saleMethod: "OPEN_OFFERS",
      closingDate: new Date(Date.now() + 86400000),
      minOfferCents: null,
      streetAddress: "1 Main St",
      suburb: "Perth",
      state: "WA",
      seller: { email: "seller@example.com", firstName: "Jane" },
    });

    const req = new Request("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(validOffer),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.code).toBe("CANNOT_OFFER_OWN_LISTING");
  });

  it("returns 409 if buyer already has an active offer", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: "user_seller_1",
      status: "ACTIVE",
      saleMethod: "OPEN_OFFERS",
      closingDate: new Date(Date.now() + 86400000),
      minOfferCents: null,
      streetAddress: "1 Main St",
      suburb: "Perth",
      state: "WA",
      seller: { email: "seller@example.com", firstName: "Jane" },
    });
    mockPrisma.offer.findUnique.mockResolvedValue({ id: "existing_offer", status: "ACTIVE" });

    const req = new Request("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(validOffer),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(409);
    expect(body.code).toBe("OFFER_EXISTS");
  });

  it("returns 400 if offer is below minimum", async () => {
    mockRequireAuth.mockResolvedValue(mockBuyer());
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: "user_seller_1",
      status: "ACTIVE",
      saleMethod: "OPEN_OFFERS",
      closingDate: new Date(Date.now() + 86400000),
      minOfferCents: 90_000_000,
      streetAddress: "1 Main St",
      suburb: "Perth",
      state: "WA",
      seller: { email: "seller@example.com", firstName: "Jane" },
    });
    mockPrisma.offer.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(validOffer),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("BELOW_MINIMUM");
  });

  it("returns 400 if listing is closed", async () => {
    mockRequireAuth.mockResolvedValue(mockBuyer());
    mockRequireVerified.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: "user_seller_1",
      status: "ACTIVE",
      saleMethod: "OPEN_OFFERS",
      closingDate: new Date(Date.now() - 86400000), // past
      minOfferCents: null,
      streetAddress: "1 Main St",
      suburb: "Perth",
      state: "WA",
      seller: { email: "seller@example.com", firstName: "Jane" },
    });

    const req = new Request("http://localhost/api/offers", {
      method: "POST",
      body: JSON.stringify(validOffer),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("LISTING_CLOSED");
  });
});

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

vi.mock("@/lib/socket", () => ({
  emitToListing: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendOfferAcceptedEmail: vi.fn().mockResolvedValue(undefined),
  sendOfferRejectedEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { POST } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/offers/[id]/accept", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeParams(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  it("accepts an offer and moves listing to UNDER_OFFER", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      listingId: "listing_1",
      amountCents: 80_000_000,
      status: "ACTIVE",
      buyer: { id: "buyer_1", email: "buyer@example.com", firstName: "John" },
      listing: {
        id: "listing_1",
        sellerId: seller.id,
        status: "ACTIVE",
        streetAddress: "1 Main St",
        suburb: "Perth",
        state: "WA",
      },
    });

    mockPrisma.offer.findMany.mockResolvedValue([]); // no other active offers

    mockPrisma.$transaction.mockResolvedValue([]);

    const req = new Request("http://localhost/api/offers/offer_1/accept", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("offer_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.offer.status).toBe("ACCEPTED");
    expect(body.listing.status).toBe("UNDER_OFFER");
  });

  it("returns 404 for non-existent offer", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.offer.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/offers/fake/accept", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("fake") as never);
    expect(res.status).toBe(404);
  });

  it("returns 400 if offer is not active", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      listingId: "listing_1",
      amountCents: 80_000_000,
      status: "WITHDRAWN",
      buyer: { id: "buyer_1", email: "buyer@example.com", firstName: "John" },
      listing: {
        id: "listing_1",
        sellerId: seller.id,
        status: "ACTIVE",
        streetAddress: "1 Main St",
        suburb: "Perth",
        state: "WA",
      },
    });

    const req = new Request("http://localhost/api/offers/offer_1/accept", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("offer_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });

  it("returns 400 if listing is not active", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      listingId: "listing_1",
      amountCents: 80_000_000,
      status: "ACTIVE",
      buyer: { id: "buyer_1", email: "buyer@example.com", firstName: "John" },
      listing: {
        id: "listing_1",
        sellerId: seller.id,
        status: "SOLD",
        streetAddress: "1 Main St",
        suburb: "Perth",
        state: "WA",
      },
    });

    const req = new Request("http://localhost/api/offers/offer_1/accept", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("offer_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("LISTING_NOT_ACTIVE");
  });
});

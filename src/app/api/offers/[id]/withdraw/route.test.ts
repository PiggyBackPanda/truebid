import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockBuyer, parseResponse } from "@/test/helpers";

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

import { POST } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/offers/[id]/withdraw", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeParams(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  it("withdraws an active offer", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      buyerId: buyer.id,
      listingId: "listing_1",
      status: "ACTIVE",
    });

    const now = new Date();
    mockPrisma.offer.update.mockResolvedValue({
      id: "offer_1",
      status: "WITHDRAWN",
      withdrawnAt: now,
    });

    const req = new Request("http://localhost/api/offers/offer_1/withdraw", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("offer_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.offer.status).toBe("WITHDRAWN");
  });

  it("returns 404 for non-existent offer", async () => {
    mockRequireAuth.mockResolvedValue(mockBuyer());
    mockPrisma.offer.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/offers/fake/withdraw", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("fake") as never);
    expect(res.status).toBe(404);
  });

  it("returns 400 if offer is not active", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      buyerId: buyer.id,
      listingId: "listing_1",
      status: "WITHDRAWN",
    });

    const req = new Request("http://localhost/api/offers/offer_1/withdraw", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("offer_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });
});

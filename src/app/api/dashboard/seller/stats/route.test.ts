import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse } from "@/test/helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockPrisma, mockRequireAuth } = vi.hoisted(() => {
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
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/api-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-helpers")>();
  return { ...actual, requireAuth: mockRequireAuth };
});

import { GET } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/dashboard/seller/stats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns aggregated seller stats", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());

    mockPrisma.listing.findMany.mockResolvedValue([
      {
        id: "listing_1",
        viewCount: 150,
        saveCount: 10,
        _count: { offers: 3 },
        offers: [{ amountCents: 85_000_000 }],
      },
    ]);

    mockPrisma.listingView.count.mockResolvedValue(5);
    mockPrisma.favourite.count.mockResolvedValue(2);
    mockPrisma.conversationMessage.count.mockResolvedValue(1);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.stats.totalViews).toBe(150);
    expect(body.stats.totalSaves).toBe(10);
    expect(body.stats.activeOffers).toBe(3);
    expect(body.stats.highestOfferCents).toBe(85_000_000);
    expect(body.stats.activeListings).toBe(1);
    expect(body.stats.unreadMessages).toBe(1);
  });

  it("returns 403 for non-seller role", async () => {
    mockRequireAuth.mockResolvedValue(mockUser({ role: "BUYER" }));

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("handles seller with no listings", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listingView.count.mockResolvedValue(0);
    mockPrisma.favourite.count.mockResolvedValue(0);
    mockPrisma.conversationMessage.count.mockResolvedValue(0);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.stats.totalViews).toBe(0);
    expect(body.stats.activeListings).toBe(0);
    expect(body.stats.highestOfferCents).toBeNull();
  });
});

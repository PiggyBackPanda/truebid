import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResponse } from "@/test/helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockPrisma, mockGetServerSession } = vi.hoisted(() => {
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
    mockGetServerSession: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { POST, GET } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/favourites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("toggles favourite on (adds)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockPrisma.listing.findUnique.mockResolvedValue({ id: "listing_1" });
    mockPrisma.favourite.findUnique.mockResolvedValue(null);
    mockPrisma.favourite.create.mockResolvedValue({});

    const req = new Request("http://localhost/api/favourites", {
      method: "POST",
      body: JSON.stringify({ listingId: "listing_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.favourited).toBe(true);
  });

  it("toggles favourite off (removes)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockPrisma.listing.findUnique.mockResolvedValue({ id: "listing_1" });
    mockPrisma.favourite.findUnique.mockResolvedValue({ id: "fav_1" });
    mockPrisma.favourite.delete.mockResolvedValue({});

    const req = new Request("http://localhost/api/favourites", {
      method: "POST",
      body: JSON.stringify({ listingId: "listing_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.favourited).toBe(false);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new Request("http://localhost/api/favourites", {
      method: "POST",
      body: JSON.stringify({ listingId: "listing_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent listing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/favourites", {
      method: "POST",
      body: JSON.stringify({ listingId: "nonexistent" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/favourites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user's favourites", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockPrisma.favourite.findMany.mockResolvedValue([
      {
        id: "fav_1",
        createdAt: new Date(),
        listing: {
          id: "listing_1",
          streetAddress: "1 Main St",
          suburb: "Perth",
          state: "WA",
          postcode: "6000",
          propertyType: "HOUSE",
          bedrooms: 3,
          bathrooms: 2,
          carSpaces: 1,
          landSizeM2: 500,
          guidePriceCents: 80_000_000,
          saleMethod: "OPEN_OFFERS",
          closingDate: null,
          status: "ACTIVE",
          images: [],
          _count: { offers: 2 },
        },
      },
    ]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.favourites).toHaveLength(1);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse } from "@/test/helpers";

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

import { POST, GET } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/listings", () => {
  beforeEach(() => vi.clearAllMocks());

  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const validListing = {
    streetAddress: "123 Main St",
    suburb: "Perth",
    state: "WA",
    postcode: "6000",
    propertyType: "HOUSE",
    bedrooms: 3,
    bathrooms: 2,
    carSpaces: 1,
    description: "A beautiful family home in a great location with plenty of natural light and space for everyone.",
    saleMethod: "OPEN_OFFERS",
    closingDate: futureDate,
  };

  it("creates a draft listing and returns 201", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);

    const created = {
      id: "listing_1",
      status: "DRAFT",
      streetAddress: "123 Main St",
      suburb: "Perth",
      state: "WA",
      postcode: "6000",
      propertyType: "HOUSE",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,
      saleMethod: "OPEN_OFFERS",
      createdAt: new Date(),
    };

    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        user: { update: vi.fn() },
        listing: { create: vi.fn().mockResolvedValue(created) },
      });
    });

    const req = new Request("http://localhost/api/listings", {
      method: "POST",
      body: JSON.stringify(validListing),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.listing.id).toBe("listing_1");
    expect(body.listing.status).toBe("DRAFT");
  });

  it("returns 401 when not authenticated", async () => {
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireAuth.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Authentication required"));

    const req = new Request("http://localhost/api/listings", {
      method: "POST",
      body: JSON.stringify(validListing),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when user is not verified", async () => {
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireAuth.mockResolvedValue(mockUser({ verificationStatus: "UNVERIFIED" }));
    mockRequireVerified.mockImplementation(() => {
      throw new ApiError(403, "VERIFICATION_REQUIRED", "Identity verification is required");
    });

    const req = new Request("http://localhost/api/listings", {
      method: "POST",
      body: JSON.stringify(validListing),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.code).toBe("VERIFICATION_REQUIRED");
  });

  it("returns 400 for invalid listing data", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockRequireVerified.mockReturnValue(undefined);

    const req = new Request("http://localhost/api/listings", {
      method: "POST",
      body: JSON.stringify({ ...validListing, postcode: "XX" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/listings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated listings", async () => {
    const listings = [
      {
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
        guideRangeMaxCents: null,
        saleMethod: "OPEN_OFFERS",
        closingDate: null,
        status: "ACTIVE",
        createdAt: new Date(),
        images: [],
      },
    ];

    mockPrisma.listing.findMany.mockResolvedValue(listings);
    mockPrisma.listing.count.mockResolvedValue(1);

    const req = new Request("http://localhost/api/listings?page=1&limit=20", {
      method: "GET",
    });

    const res = await GET(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.page).toBe(1);
  });

  it("applies search filters", async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    const req = new Request(
      "http://localhost/api/listings?suburb=Perth&propertyType=HOUSE&minBeds=3&sort=price_asc",
      { method: "GET" }
    );

    const res = await GET(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(0);
    // Verify the Prisma call received the correct where clause
    const call = mockPrisma.listing.findMany.mock.calls[0][0];
    expect(call.where.suburb).toBeDefined();
    expect(call.where.propertyType).toBe("HOUSE");
    expect(call.where.bedrooms).toEqual({ gte: 3 });
  });
});

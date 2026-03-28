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

import { POST } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/listings/[id]/publish", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeParams(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  it("publishes a draft listing as COMING_SOON by default", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "DRAFT",
      saleMethod: "OPEN_OFFERS",
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: "A house",
      images: [{ id: "img_1" }],
    });

    mockPrisma.listing.update.mockResolvedValue({
      id: "listing_1",
      status: "COMING_SOON",
      publishedAt: new Date(),
      streetAddress: "1 Main St",
      suburb: "Perth",
    });

    const req = new Request("http://localhost/api/listings/listing_1/publish", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.listing.status).toBe("COMING_SOON");
  });

  it("publishes a draft listing as ACTIVE when mode=active", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "DRAFT",
      saleMethod: "FIXED_PRICE",
      closingDate: null,
      description: "A house",
      images: [{ id: "img_1" }],
    });

    mockPrisma.listing.update.mockResolvedValue({
      id: "listing_1",
      status: "ACTIVE",
      publishedAt: new Date(),
      streetAddress: "1 Main St",
      suburb: "Perth",
    });

    const req = new Request("http://localhost/api/listings/listing_1/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "active" }),
    });

    const res = await POST(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.listing.status).toBe("ACTIVE");
  });

  it("returns 400 if listing has no images", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "DRAFT",
      saleMethod: "FIXED_PRICE",
      closingDate: null,
      description: "A house",
      images: [],
    });

    const req = new Request("http://localhost/api/listings/listing_1/publish", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("NO_IMAGES");
  });

  it("returns 400 if OPEN_OFFERS listing has no closing date when mode=active", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "DRAFT",
      saleMethod: "OPEN_OFFERS",
      closingDate: null,
      description: "A house",
      images: [{ id: "img_1" }],
    });

    const req = new Request("http://localhost/api/listings/listing_1/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "active" }),
    });

    const res = await POST(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("MISSING_CLOSING_DATE");
  });

  it("allows COMING_SOON publish for OPEN_OFFERS without a closing date", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "DRAFT",
      saleMethod: "OPEN_OFFERS",
      closingDate: null,
      description: "A house",
      images: [{ id: "img_1" }],
    });

    mockPrisma.listing.update.mockResolvedValue({
      id: "listing_1",
      status: "COMING_SOON",
      publishedAt: new Date(),
      streetAddress: "1 Main St",
      suburb: "Perth",
    });

    const req = new Request("http://localhost/api/listings/listing_1/publish", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.listing.status).toBe("COMING_SOON");
  });

  it("returns 400 if status is not DRAFT", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireVerified.mockReturnValue(undefined);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      sellerId: user.id,
      status: "ACTIVE",
      saleMethod: "OPEN_OFFERS",
      closingDate: null,
      description: "A house",
      images: [{ id: "img_1" }],
    });

    const req = new Request("http://localhost/api/listings/listing_1/publish", {
      method: "POST",
    });

    const res = await POST(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });
});

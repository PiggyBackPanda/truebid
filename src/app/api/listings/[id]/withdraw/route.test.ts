import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse } from "@/test/helpers";

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
  return { ...actual, requireAuth: mockRequireAuth, requireOwner: mockRequireOwner };
});
vi.mock("@/lib/socket", () => ({ emitToListing: vi.fn() }));

import { POST } from "./route";

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/listings/[id]/withdraw", () => {
  beforeEach(() => vi.clearAllMocks());

  it("withdraws an active listing and expires offers", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);

    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1", sellerId: user.id, status: "ACTIVE",
    });
    mockPrisma.$transaction.mockResolvedValue([]);

    const req = new Request("http://localhost/api/listings/listing_1/withdraw", { method: "POST" });
    const res = await POST(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.listing.status).toBe("WITHDRAWN");
  });

  it("returns 404 for non-existent listing", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/listings/fake/withdraw", { method: "POST" });
    const res = await POST(req as never, makeParams("fake") as never);
    expect(res.status).toBe(404);
  });

  it("returns 400 if listing is draft", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockRequireOwner.mockReturnValue(undefined);
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1", sellerId: user.id, status: "DRAFT",
    });

    const req = new Request("http://localhost/api/listings/listing_1/withdraw", { method: "POST" });
    const res = await POST(req as never, makeParams("listing_1") as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });
});

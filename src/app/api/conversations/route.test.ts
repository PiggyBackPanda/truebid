import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, mockBuyer, parseResponse } from "@/test/helpers";

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

import { GET, POST } from "./route";

// ── Tests: GET /api/conversations ───────────────────────────────────────────

describe("GET /api/conversations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns conversations for the authenticated user", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);

    const now = new Date();
    mockPrisma.conversation.findMany.mockResolvedValue([
      {
        id: "conv_1",
        buyerId: "user_buyer_1",
        sellerId: user.id,
        createdAt: now,
        listing: { id: "listing_1", streetAddress: "1 Main St", suburb: "Perth", state: "WA" },
        offer: { amountCents: 80_000_000 },
        buyer: { id: "user_buyer_1", firstName: "John", lastName: "Doe" },
        seller: { id: user.id, firstName: "Jane", lastName: "Smith" },
        messages: [
          { id: "msg_1", senderId: "user_buyer_1", body: "Hello!", sentAt: now, readAt: null },
        ],
      },
    ]);

    mockPrisma.conversationMessage.groupBy.mockResolvedValue([
      { conversationId: "conv_1", _count: { id: 2 } },
    ]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.conversations).toHaveLength(1);
    expect(body.conversations[0].id).toBe("conv_1");
    expect(body.conversations[0].listing.address).toBe("1 Main St, Perth WA");
    expect(body.conversations[0].other.firstName).toBe("John");
    expect(body.conversations[0].unreadCount).toBe(2);
    expect(body.totalUnread).toBe(2);
  });

  it("returns empty array when user has no conversations", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.conversation.findMany.mockResolvedValue([]);
    mockPrisma.conversationMessage.groupBy.mockResolvedValue([]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.conversations).toHaveLength(0);
    expect(body.totalUnread).toBe(0);
  });

  it("shows seller as 'other' when user is the buyer", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);

    const now = new Date();
    mockPrisma.conversation.findMany.mockResolvedValue([
      {
        id: "conv_1",
        buyerId: buyer.id,
        sellerId: "user_seller_1",
        createdAt: now,
        listing: { id: "listing_1", streetAddress: "5 Beach Rd", suburb: "Cottesloe", state: "WA" },
        offer: { amountCents: 90_000_000 },
        buyer: { id: buyer.id, firstName: "John", lastName: "Doe" },
        seller: { id: "user_seller_1", firstName: "Jane", lastName: "Smith" },
        messages: [],
      },
    ]);

    mockPrisma.conversationMessage.groupBy.mockResolvedValue([]);

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.conversations[0].other.firstName).toBe("Jane");
    expect(body.conversations[0].lastMessage).toBeNull();
  });
});

// ── Tests: POST /api/conversations ──────────────────────────────────────────

describe("POST /api/conversations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a conversation for an accepted offer", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      status: "ACCEPTED",
      buyerId: "user_buyer_1",
      listingId: "listing_1",
      listing: { sellerId: seller.id },
    });

    mockPrisma.conversation.findUnique.mockResolvedValue(null);
    mockPrisma.conversation.create.mockResolvedValue({ id: "conv_new" });

    const req = new Request("http://localhost/api/conversations", {
      method: "POST",
      body: JSON.stringify({ offerId: "offer_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.conversationId).toBe("conv_new");
    expect(mockPrisma.conversation.create).toHaveBeenCalledOnce();
  });

  it("returns existing conversation if already created (idempotent)", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      status: "ACCEPTED",
      buyerId: "user_buyer_1",
      listingId: "listing_1",
      listing: { sellerId: seller.id },
    });

    mockPrisma.conversation.findUnique.mockResolvedValue({ id: "conv_existing" });

    const req = new Request("http://localhost/api/conversations", {
      method: "POST",
      body: JSON.stringify({ offerId: "offer_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.conversationId).toBe("conv_existing");
    expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
  });

  it("returns 400 if offerId is missing", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());

    const req = new Request("http://localhost/api/conversations", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("MISSING_OFFER_ID");
  });

  it("returns 404 if offer not found", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.offer.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/conversations", {
      method: "POST",
      body: JSON.stringify({ offerId: "fake" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
  });

  it("returns 403 if caller is not the seller", async () => {
    const notSeller = mockUser({ id: "someone_else" });
    mockRequireAuth.mockResolvedValue(notSeller);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      status: "ACCEPTED",
      buyerId: "user_buyer_1",
      listingId: "listing_1",
      listing: { sellerId: "real_seller" },
    });

    const req = new Request("http://localhost/api/conversations", {
      method: "POST",
      body: JSON.stringify({ offerId: "offer_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("returns 400 if offer status is not ACCEPTED", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);

    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer_1",
      status: "ACTIVE",
      buyerId: "user_buyer_1",
      listingId: "listing_1",
      listing: { sellerId: seller.id },
    });

    const req = new Request("http://localhost/api/conversations", {
      method: "POST",
      body: JSON.stringify({ offerId: "offer_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_STATUS");
  });
});

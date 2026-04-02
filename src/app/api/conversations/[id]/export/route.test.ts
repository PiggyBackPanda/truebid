import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, mockBuyer } from "@/test/helpers";

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function mockConversation(overrides: Record<string, unknown> = {}) {
  const now = new Date("2025-01-15T10:00:00Z");
  return {
    id: "conv_1",
    buyerId: "user_buyer_1",
    sellerId: "user_seller_1",
    createdAt: now,
    listing: {
      id: "listing_1",
      streetAddress: "10 Marine Pde",
      suburb: "Cottesloe",
      state: "WA",
      postcode: "6011",
    },
    offer: {
      id: "offer_1",
      amountCents: 85_000_000,
      acceptedAt: now,
    },
    buyer: { id: "user_buyer_1", firstName: "John", lastName: "Doe" },
    seller: { id: "user_seller_1", firstName: "Jane", lastName: "Smith" },
    messages: [
      { id: "msg_1", senderId: "user_seller_1", body: "Hello John", sentAt: now },
      { id: "msg_2", senderId: "user_buyer_1", body: "Hi Jane!", sentAt: new Date("2025-01-15T10:05:00Z") },
    ],
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/conversations/[id]/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns HTML transcript for a participant (seller)", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation());

    const req = new Request("http://localhost/api/conversations/conv_1/export");
    const res = await GET(req as never, makeParams("conv_1") as never);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const html = await res.text();
    expect(html).toContain("Conversation Transcript");
    expect(html).toContain("10 Marine Pde, Cottesloe WA 6011");
    expect(html).toContain("Hello John");
    expect(html).toContain("Hi Jane!");
    expect(html).toContain("Jane Smith");
    expect(html).toContain("John Doe");
    expect(html).toContain("$850,000");
    expect(html).toContain("Messages (2)");
  });

  it("returns HTML transcript for the buyer", async () => {
    const buyer = mockBuyer();
    mockRequireAuth.mockResolvedValue(buyer);
    mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation());

    const req = new Request("http://localhost/api/conversations/conv_1/export");
    const res = await GET(req as never, makeParams("conv_1") as never);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Conversation Transcript");
  });

  it("returns 404 for non-existent conversation", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.conversation.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/conversations/fake/export");
    const res = await GET(req as never, makeParams("fake") as never);

    expect(res.status).toBe(404);
  });

  it("returns 403 if user is not a party to the conversation", async () => {
    const outsider = mockUser({ id: "outsider_user" });
    mockRequireAuth.mockResolvedValue(outsider);
    mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation());

    const req = new Request("http://localhost/api/conversations/conv_1/export");
    const res = await GET(req as never, makeParams("conv_1") as never);

    expect(res.status).toBe(403);
  });

  it("uses valid timezone from query parameter", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation());

    const req = new Request("http://localhost/api/conversations/conv_1/export?tz=Australia/Perth");
    const res = await GET(req as never, makeParams("conv_1") as never);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Australia/Perth");
  });

  it("falls back to Australia/Sydney for invalid timezone", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation());

    const req = new Request("http://localhost/api/conversations/conv_1/export?tz=Invalid/Zone");
    const res = await GET(req as never, makeParams("conv_1") as never);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Australia/Sydney");
  });

  it("handles conversation with no messages", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockPrisma.conversation.findUnique.mockResolvedValue(
      mockConversation({ messages: [] })
    );

    const req = new Request("http://localhost/api/conversations/conv_1/export");
    const res = await GET(req as never, makeParams("conv_1") as never);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("No messages in this conversation yet.");
    expect(html).toContain("Messages (0)");
  });

  it("escapes HTML in message bodies to prevent XSS", async () => {
    const seller = mockUser();
    mockRequireAuth.mockResolvedValue(seller);
    mockPrisma.conversation.findUnique.mockResolvedValue(
      mockConversation({
        messages: [
          {
            id: "msg_xss",
            senderId: "user_buyer_1",
            body: '<script>alert("xss")</script>',
            sentAt: new Date("2025-01-15T10:00:00Z"),
          },
        ],
      })
    );

    const req = new Request("http://localhost/api/conversations/conv_1/export");
    const res = await GET(req as never, makeParams("conv_1") as never);

    expect(res.status).toBe(200);
    const html = await res.text();
    // The message body should be escaped (not raw HTML)
    expect(html).not.toContain('alert("xss")');
    expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
  });
});

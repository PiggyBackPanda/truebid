import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse, CUID } from "@/test/helpers";

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
vi.mock("@/lib/email", () => ({ sendUnreadMessageEmail: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { POST } from "./route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockActiveListing() {
  mockPrisma.listing.findUnique.mockResolvedValue({
    id: "listing_1",
    status: "ACTIVE",
    streetAddress: "10 Marine Pde",
    suburb: "Cottesloe",
    state: "WA",
  });
}

function mockRecipient() {
  mockPrisma.user.findUnique.mockResolvedValue({
    id: "user_buyer_1",
    email: "buyer@example.com",
    firstName: "John",
    notificationPreferences: null,
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/messages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends a message and returns 201", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);
    mockActiveListing();
    mockRecipient();

    const now = new Date();
    mockPrisma.message.create.mockResolvedValue({
      id: "msg_1",
      senderId: user.id,
      recipientId: "user_buyer_1",
      listingId: "listing_1",
      content: "Hello!",
      status: "SENT",
      createdAt: now,
    });

    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        content: "Hello!",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.message.content).toBe("Hello!");
  });

  it("returns 400 if messaging yourself", async () => {
    const user = mockUser({ id: CUID.user1 });
    mockRequireAuth.mockResolvedValue(user);

    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientId: CUID.user1,
        listingId: CUID.listing1,
        content: "Hello!",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_RECIPIENT");
  });

  it("returns 400 if message contains a URL", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());

    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        content: "Check out https://scam.example.com",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("LINKS_NOT_ALLOWED");
  });

  it("returns 400 if message contains www.", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());

    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        content: "Visit www.example.com for more info",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("LINKS_NOT_ALLOWED");
  });

  it("returns 404 if listing not found", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        content: "Hello!",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(404);
  });

  it("returns 400 for listing that is not ACTIVE or UNDER_OFFER", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing_1",
      status: "DRAFT",
      streetAddress: "10 Marine Pde",
      suburb: "Cottesloe",
      state: "WA",
    });

    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        content: "Hello!",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("LISTING_UNAVAILABLE");
  });

  it("returns 400 for empty content", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());

    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({
        recipientId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        content: "",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});

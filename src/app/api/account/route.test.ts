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

import { PATCH, DELETE } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PATCH /api/account", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates user profile", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);

    mockPrisma.user.update.mockResolvedValue({
      id: user.id,
      firstName: "Updated",
      lastName: "Name",
      email: "seller@example.com",
      phone: null,
    });

    const req = new Request("http://localhost/api/account", {
      method: "PATCH",
      body: JSON.stringify({ firstName: "Updated", lastName: "Name" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.user.firstName).toBe("Updated");
  });

  it("returns 400 for invalid profile data", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());

    const req = new Request("http://localhost/api/account", {
      method: "PATCH",
      body: JSON.stringify({ firstName: "", lastName: "Name" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/account", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes account with correct confirmation", async () => {
    const user = mockUser();
    mockRequireAuth.mockResolvedValue(user);

    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        offer: { updateMany: vi.fn() },
        listing: { updateMany: vi.fn() },
        user: { delete: vi.fn() },
      });
    });

    const req = new Request("http://localhost/api/account", {
      method: "DELETE",
      body: JSON.stringify({ confirmation: "DELETE" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 400 for wrong confirmation", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());

    const req = new Request("http://localhost/api/account", {
      method: "DELETE",
      body: JSON.stringify({ confirmation: "nope" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});

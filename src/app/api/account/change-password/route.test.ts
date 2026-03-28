import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse } from "@/test/helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockPrisma, mockRequireAuth, mockCompare, mockHash } = vi.hoisted(() => {
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
    mockCompare: vi.fn(),
    mockHash: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/api-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-helpers")>();
  return { ...actual, requireAuth: mockRequireAuth };
});
vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => mockCompare(...args),
    hash: (...args: unknown[]) => mockHash(...args),
  },
}));

import { POST } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/account/change-password", () => {
  beforeEach(() => vi.clearAllMocks());

  it("changes password with valid current password", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: "$2a$12$old" });
    mockCompare.mockResolvedValue(true);
    mockHash.mockResolvedValue("$2a$12$new");
    mockPrisma.user.update.mockResolvedValue({});

    const req = new Request("http://localhost/api/account/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "OldPassword1",
        newPassword: "NewPassword1",
        confirmPassword: "NewPassword1",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 400 for wrong current password", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: "$2a$12$old" });
    mockCompare.mockResolvedValue(false);

    const req = new Request("http://localhost/api/account/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "WrongPassword1",
        newPassword: "NewPassword1",
        confirmPassword: "NewPassword1",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("INVALID_PASSWORD");
  });

  it("returns 400 for non-matching new passwords", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());

    const req = new Request("http://localhost/api/account/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: "OldPassword1",
        newPassword: "NewPassword1",
        confirmPassword: "Different1",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

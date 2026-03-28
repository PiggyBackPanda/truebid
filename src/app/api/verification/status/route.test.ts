import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockUser, parseResponse } from "@/test/helpers";

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

describe("GET /api/verification/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns VERIFIED status with date", async () => {
    mockRequireAuth.mockResolvedValue(mockUser());
    const now = new Date();
    mockPrisma.user.findUnique.mockResolvedValue({
      verificationStatus: "VERIFIED",
      verificationDate: now,
    });

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.status).toBe("VERIFIED");
    expect(body.verifiedAt).toBe(now.toISOString());
  });

  it("returns UNVERIFIED status with null date", async () => {
    mockRequireAuth.mockResolvedValue(mockUser({ verificationStatus: "UNVERIFIED" }));
    mockPrisma.user.findUnique.mockResolvedValue({
      verificationStatus: "UNVERIFIED",
      verificationDate: null,
    });

    const res = await GET();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.status).toBe("UNVERIFIED");
    expect(body.verifiedAt).toBeNull();
  });

  it("returns 401 when not authenticated", async () => {
    const { ApiError } = await import("@/lib/api-helpers");
    mockRequireAuth.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "Authentication required"));

    const res = await GET();
    expect(res.status).toBe(401);
  });
});

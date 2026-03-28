import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseResponse } from "@/test/helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockPrisma } = vi.hoisted(() => {
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
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 9, resetAt: 0 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword") },
}));

import { POST } from "./route";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    password: "Password1",
    role: "BUYER",
  };

  it("creates a user and returns 201", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user_1",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Smith",
      role: "BUYER",
      verificationStatus: "UNVERIFIED",
      publicAlias: "Buyer_ab12",
      createdAt: new Date(),
    });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(201);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe("jane@example.com");
    expect(body.user.verificationStatus).toBe("UNVERIFIED");
  });

  it("returns 409 for duplicate email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing" });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(409);
    expect(body.code).toBe("EMAIL_EXISTS");
  });

  it("returns 400 for validation failure", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...validBody, password: "weak" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 429 when rate limited", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    (rateLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(429);
    expect(body.code).toBe("RATE_LIMITED");
  });

  it("rejects missing firstName", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...validBody, firstName: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

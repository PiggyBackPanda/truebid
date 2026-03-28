import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { ApiError, errorResponse, requireVerified, requireOwner, paginationParams, paginatedResponse } from "./api-helpers";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ApiError", () => {
  it("creates an error with status code and code", () => {
    const err = new ApiError(404, "NOT_FOUND", "Not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Not found");
  });

  it("supports optional details", () => {
    const err = new ApiError(400, "VALIDATION_ERROR", "Bad", { field: "email" });
    expect(err.details).toEqual({ field: "email" });
  });
});

describe("errorResponse", () => {
  it("handles ApiError", async () => {
    const err = new ApiError(409, "EMAIL_EXISTS", "Already exists");
    const res = errorResponse(err);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.code).toBe("EMAIL_EXISTS");
  });

  it("handles ZodError-like objects", async () => {
    const err = { name: "ZodError", issues: [{ path: ["email"], message: "Invalid" }] };
    const res = errorResponse(err);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("handles unknown errors as 500", async () => {
    const res = errorResponse(new Error("something broke"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.code).toBe("SERVER_ERROR");
  });
});

describe("requireVerified", () => {
  it("does nothing for verified users", () => {
    expect(() =>
      requireVerified({ verificationStatus: "VERIFIED" } as never)
    ).not.toThrow();
  });

  it("throws ApiError for unverified users", () => {
    expect(() =>
      requireVerified({ verificationStatus: "UNVERIFIED" } as never)
    ).toThrow(ApiError);
  });
});

describe("requireOwner", () => {
  it("does nothing when IDs match", () => {
    expect(() =>
      requireOwner({ id: "user_1" } as never, "user_1")
    ).not.toThrow();
  });

  it("throws ApiError when IDs don't match", () => {
    expect(() =>
      requireOwner({ id: "user_1" } as never, "user_2")
    ).toThrow(ApiError);
  });
});

describe("paginationParams", () => {
  it("returns defaults for empty params", () => {
    const params = new URLSearchParams();
    const result = paginationParams(params);
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("calculates skip correctly", () => {
    const params = new URLSearchParams({ page: "3", limit: "10" });
    const result = paginationParams(params);
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });
});

describe("paginatedResponse", () => {
  it("builds correct pagination metadata", () => {
    const result = paginatedResponse(["a", "b"], 25, 1, 10);
    expect(result.data).toEqual(["a", "b"]);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });
});

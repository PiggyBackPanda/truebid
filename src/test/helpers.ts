/**
 * Shared test helpers and mock factories.
 */
import { vi } from "vitest";

// Valid CUIDs for use in tests where Zod validates cuid format
export const CUID = {
  listing1: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
  listing2: "clyyyyyyyyyyyyyyyyyyyyyyyy",
  user1: "cluser1xxxxxxxxxxxxxxxxxx",
  user2: "cluser2xxxxxxxxxxxxxxxxxx",
  offer1: "cloffer1xxxxxxxxxxxxxxxxx",
  image1: "climage1xxxxxxxxxxxxxxxxx",
} as const;

// ── Mock user factory ────────────────────────────────────────────────────────

export function mockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user_seller_1",
    email: "seller@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "SELLER",
    verificationStatus: "VERIFIED",
    publicAlias: "Buyer_ab12",
    ...overrides,
  };
}

export function mockBuyer(overrides: Record<string, unknown> = {}) {
  return mockUser({
    id: "user_buyer_1",
    email: "buyer@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "BUYER",
    publicAlias: "Buyer_cd34",
    ...overrides,
  });
}

// ── Mock Prisma ──────────────────────────────────────────────────────────────

export function createMockPrisma() {
  const createModelMock = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
    groupBy: vi.fn(),
  });

  return {
    user: createModelMock(),
    listing: createModelMock(),
    listingImage: createModelMock(),
    offer: createModelMock(),
    offerHistory: createModelMock(),
    message: createModelMock(),
    conversation: createModelMock(),
    conversationMessage: createModelMock(),
    favourite: createModelMock(),
    checklistProgress: createModelMock(),
    listingView: createModelMock(),
    $transaction: vi.fn(),
  };
}

// ── Request factory ──────────────────────────────────────────────────────────

export function makeRequest(
  method: string,
  body?: unknown,
  url = "http://localhost:3000/api/test"
): Request {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new Request(url, init);
}

export function makeNextRequest(
  method: string,
  body?: unknown,
  url = "http://localhost:3000/api/test"
) {
  // NextRequest is the same interface for our purposes in tests
  return makeRequest(method, body, url);
}

// ── Response helper ──────────────────────────────────────────────────────────

export async function parseResponse(response: Response) {
  const json = await response.json();
  return { status: response.status, body: json };
}

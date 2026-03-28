import { describe, it, expect } from "vitest";
import { serializeListingAddress } from "./listing-serializer";
import type { ListingAddressInput } from "./listing-serializer";

function baseListing(overrides: Partial<ListingAddressInput> = {}): ListingAddressInput {
  return {
    id: "listing_123",
    streetAddress: "14 Eucalyptus Way",
    suburb: "Floreat",
    state: "WA",
    postcode: "6014",
    latitude: -31.9505,
    longitude: 115.8605,
    addressVisibility: "LOGGED_IN",
    hasInspectionSlots: true,
    ...overrides,
  };
}

// ── PUBLIC visibility ─────────────────────────────────────────────────────────

describe("PUBLIC visibility", () => {
  it("shows full address to anonymous viewer", () => {
    const result = serializeListingAddress(baseListing({ addressVisibility: "PUBLIC" }), {});
    expect(result.addressRevealed).toBe(true);
    expect(result.streetAddress).toBe("14 Eucalyptus Way");
    expect(result.lockReason).toBeNull();
  });

  it("shows full address to logged-in unverified viewer", () => {
    const result = serializeListingAddress(
      baseListing({ addressVisibility: "PUBLIC" }),
      { userId: "user_1" }
    );
    expect(result.addressRevealed).toBe(true);
  });
});

// ── LOGGED_IN visibility ──────────────────────────────────────────────────────

describe("LOGGED_IN visibility", () => {
  it("hides full address from anonymous viewer", () => {
    const result = serializeListingAddress(baseListing(), {});
    expect(result.addressRevealed).toBe(false);
    expect(result.streetAddress).toBeNull();
    expect(result.displayAddress).toBe("Floreat, WA 6014");
    expect(result.lockReason).toBe("LOGIN_REQUIRED");
  });

  it("shows full address to any logged-in viewer", () => {
    const result = serializeListingAddress(baseListing(), { userId: "user_1" });
    expect(result.addressRevealed).toBe(true);
    expect(result.streetAddress).toBe("14 Eucalyptus Way");
    expect(result.lockReason).toBeNull();
  });

  it("fuzzed coords returned when address hidden", () => {
    const result = serializeListingAddress(baseListing(), {});
    // Coords should differ from originals (fuzzed)
    expect(result.latitude).not.toBeNull();
    expect(result.longitude).not.toBeNull();
    // The fuzzed coords differ from the originals
    const latDiff = Math.abs((result.latitude ?? 0) - (-31.9505));
    const lngDiff = Math.abs((result.longitude ?? 0) - 115.8605);
    // At least one dimension should be offset (astronomically unlikely to be exactly 0)
    expect(latDiff + lngDiff).toBeGreaterThan(0);
    // And within the allowed range
    expect(latDiff).toBeLessThanOrEqual(0.002 + 1e-9);
    expect(lngDiff).toBeLessThanOrEqual(0.002 + 1e-9);
  });
});

// ── BOOKED_ONLY visibility ────────────────────────────────────────────────────

describe("BOOKED_ONLY visibility", () => {
  it("hides address from anonymous viewer", () => {
    const result = serializeListingAddress(
      baseListing({ addressVisibility: "BOOKED_ONLY" }),
      {}
    );
    expect(result.addressRevealed).toBe(false);
    expect(result.lockReason).toBe("LOGIN_REQUIRED");
  });

  it("hides address from logged-in viewer without a booking", () => {
    const result = serializeListingAddress(
      baseListing({ addressVisibility: "BOOKED_ONLY" }),
      { userId: "user_1", isVerified: true, hasBooking: false }
    );
    expect(result.addressRevealed).toBe(false);
    expect(result.lockReason).toBe("BOOKING_REQUIRED");
  });

  it("reveals address to verified buyer with a booking", () => {
    const result = serializeListingAddress(
      baseListing({ addressVisibility: "BOOKED_ONLY" }),
      { userId: "user_1", isVerified: true, hasBooking: true }
    );
    expect(result.addressRevealed).toBe(true);
    expect(result.streetAddress).toBe("14 Eucalyptus Way");
  });

  it("falls back to LOGGED_IN behaviour when no inspection slots", () => {
    const result = serializeListingAddress(
      baseListing({ addressVisibility: "BOOKED_ONLY", hasInspectionSlots: false }),
      { userId: "user_1" }
    );
    // With no slots, logged-in user should see full address (LOGGED_IN fallback)
    expect(result.addressRevealed).toBe(true);
  });

  it("BOOKED_ONLY without slots still hides from anonymous", () => {
    const result = serializeListingAddress(
      baseListing({ addressVisibility: "BOOKED_ONLY", hasInspectionSlots: false }),
      {}
    );
    expect(result.addressRevealed).toBe(false);
  });
});

// ── Seller always sees full address ───────────────────────────────────────────

describe("Seller visibility override", () => {
  it("seller sees full address regardless of BOOKED_ONLY", () => {
    const result = serializeListingAddress(
      baseListing({ addressVisibility: "BOOKED_ONLY" }),
      { userId: "seller_1", isSeller: true }
    );
    expect(result.addressRevealed).toBe(true);
    expect(result.streetAddress).toBe("14 Eucalyptus Way");
  });

  it("seller sees full address regardless of LOGGED_IN when anonymous context", () => {
    // isSeller=true overrides even with no userId (edge case — shouldn't happen in practice)
    const result = serializeListingAddress(
      baseListing({ addressVisibility: "LOGGED_IN" }),
      { isSeller: true }
    );
    expect(result.addressRevealed).toBe(true);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("returns null coordinates when listing has no lat/lng and address is hidden", () => {
    const result = serializeListingAddress(
      baseListing({ latitude: null, longitude: null }),
      {}
    );
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });

  it("full displayAddress includes street when revealed", () => {
    const result = serializeListingAddress(baseListing(), { userId: "u1" });
    expect(result.displayAddress).toBe("14 Eucalyptus Way, Floreat WA 6014");
  });

  it("suburb-only displayAddress excludes street when hidden", () => {
    const result = serializeListingAddress(baseListing(), {});
    expect(result.displayAddress).toBe("Floreat, WA 6014");
    expect(result.displayAddress).not.toContain("Eucalyptus");
  });
});

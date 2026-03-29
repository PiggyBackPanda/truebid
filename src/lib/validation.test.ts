import { describe, it, expect } from "vitest";
import {
  registerApiSchema,
  loginSchema,
  createOfferSchema,
  increaseOfferSchema,
  createListingSchema,
  updateListingSchema,
  createMessageSchema,
  reorderImagesSchema,
  updateProfileSchema,
  changePasswordSchema,
  notificationPrefsSchema,
  deleteAccountSchema,
  paginationSchema,
  listingSearchSchema,
} from "./validation";

// ── registerApiSchema ────────────────────────────────────────────────────────

describe("registerApiSchema", () => {
  const valid = {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    password: "Password1",
    role: "BUYER" as const,
  };

  it("accepts valid registration data", () => {
    expect(registerApiSchema.parse(valid)).toMatchObject({ email: "jane@example.com" });
  });

  it("lowercases email", () => {
    const result = registerApiSchema.parse({ ...valid, email: "JANE@Example.COM" });
    expect(result.email).toBe("jane@example.com");
  });

  it("rejects short password", () => {
    expect(() => registerApiSchema.parse({ ...valid, password: "Short1" })).toThrow();
  });

  it("rejects password without uppercase", () => {
    expect(() => registerApiSchema.parse({ ...valid, password: "password1" })).toThrow();
  });

  it("rejects password without number", () => {
    expect(() => registerApiSchema.parse({ ...valid, password: "Password" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => registerApiSchema.parse({ ...valid, email: "notanemail" })).toThrow();
  });

  it("rejects invalid role", () => {
    expect(() => registerApiSchema.parse({ ...valid, role: "ADMIN" })).toThrow();
  });

  it("accepts optional Australian phone", () => {
    const result = registerApiSchema.parse({ ...valid, phone: "0412 345 678" });
    expect(result.phone).toBe("0412 345 678");
  });

  it("rejects invalid phone format", () => {
    expect(() => registerApiSchema.parse({ ...valid, phone: "555-1234" })).toThrow();
  });

  it("allows empty string phone", () => {
    expect(() => registerApiSchema.parse({ ...valid, phone: "" })).not.toThrow();
  });
});

// ── loginSchema ──────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.parse({ email: "a@b.com", password: "x" })).toBeTruthy();
  });

  it("rejects empty password", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "" })).toThrow();
  });
});

// ── createOfferSchema ────────────────────────────────────────────────────────

describe("createOfferSchema", () => {
  const valid = {
    listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
    amountCents: 80_000_000,
    conditionType: "UNCONDITIONAL" as const,
    settlementDays: 30,
    legalAcknowledgedAt: new Date().toISOString(),
  };

  it("accepts valid offer", () => {
    expect(createOfferSchema.parse(valid)).toMatchObject({ amountCents: 80_000_000 });
  });

  it("rejects invalid settlement days", () => {
    expect(() => createOfferSchema.parse({ ...valid, settlementDays: 25 })).toThrow();
  });

  it("rejects amount over $100M", () => {
    expect(() => createOfferSchema.parse({ ...valid, amountCents: 10_000_000_001 })).toThrow();
  });

  it("requires conditionText when conditionType is OTHER", () => {
    expect(() =>
      createOfferSchema.parse({ ...valid, conditionType: "OTHER" })
    ).toThrow();
  });

  it("accepts OTHER with conditionText", () => {
    expect(
      createOfferSchema.parse({ ...valid, conditionType: "OTHER", conditionText: "Subject to council" })
    ).toBeTruthy();
  });

  it("accepts valid settlement day values", () => {
    for (const days of [14, 21, 30, 45, 60, 90, 120]) {
      expect(createOfferSchema.parse({ ...valid, settlementDays: days })).toBeTruthy();
    }
  });
});

// ── increaseOfferSchema ──────────────────────────────────────────────────────

describe("increaseOfferSchema", () => {
  it("accepts valid increase", () => {
    expect(increaseOfferSchema.parse({ amountCents: 90_000_000 })).toBeTruthy();
  });

  it("rejects negative amount", () => {
    expect(() => increaseOfferSchema.parse({ amountCents: -1 })).toThrow();
  });

  it("allows optional fields", () => {
    expect(increaseOfferSchema.parse({ amountCents: 90_000_000, conditionType: "SUBJECT_TO_FINANCE" })).toBeTruthy();
  });
});

// ── createListingSchema ──────────────────────────────────────────────────────

describe("createListingSchema", () => {
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const valid = {
    streetAddress: "123 Main St",
    suburb: "Perth",
    state: "WA" as const,
    postcode: "6000",
    propertyType: "HOUSE" as const,
    bedrooms: 3,
    bathrooms: 2,
    carSpaces: 1,
    description: "A beautiful family home in a great location with plenty of space.",
    saleMethod: "OPEN_OFFERS" as const,
    closingDate: futureDate,
  };

  it("accepts valid listing", () => {
    expect(createListingSchema.parse(valid)).toBeTruthy();
  });

  it("rejects invalid postcode", () => {
    expect(() => createListingSchema.parse({ ...valid, postcode: "60" })).toThrow();
  });

  it("rejects description under 50 chars", () => {
    expect(() => createListingSchema.parse({ ...valid, description: "Too short" })).toThrow();
  });

  it("rejects OPEN_OFFERS without closing date", () => {
    expect(() => createListingSchema.parse({ ...valid, closingDate: undefined })).toThrow();
  });

  it("allows no closing date for FIXED_PRICE", () => {
    expect(createListingSchema.parse({ ...valid, saleMethod: "FIXED_PRICE", closingDate: undefined })).toBeTruthy();
  });

  it("rejects guideRangeMaxCents <= guidePriceCents", () => {
    expect(() =>
      createListingSchema.parse({ ...valid, guidePriceCents: 500_000_00, guideRangeMaxCents: 400_000_00 })
    ).toThrow();
  });
});

// ── updateListingSchema ──────────────────────────────────────────────────────

describe("updateListingSchema", () => {
  it("accepts partial update", () => {
    expect(updateListingSchema.parse({ bedrooms: 4 })).toMatchObject({ bedrooms: 4 });
  });

  it("accepts empty object", () => {
    expect(updateListingSchema.parse({})).toMatchObject({});
  });

  it("rejects invalid state", () => {
    expect(() => updateListingSchema.parse({ state: "XX" })).toThrow();
  });
});

// ── createMessageSchema ──────────────────────────────────────────────────────

describe("createMessageSchema", () => {
  it("accepts valid message", () => {
    expect(
      createMessageSchema.parse({
        recipientId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        content: "Hello!",
      })
    ).toBeTruthy();
  });

  it("rejects empty content", () => {
    expect(() =>
      createMessageSchema.parse({
        recipientId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        listingId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        content: "",
      })
    ).toThrow();
  });
});

// ── reorderImagesSchema ──────────────────────────────────────────────────────

describe("reorderImagesSchema", () => {
  it("accepts array of CUIDs", () => {
    expect(
      reorderImagesSchema.parse({
        imageIds: ["clxxxxxxxxxxxxxxxxxxxxxxxxx"],
      })
    ).toBeTruthy();
  });

  it("rejects empty array", () => {
    expect(() => reorderImagesSchema.parse({ imageIds: [] })).toThrow();
  });
});

// ── updateProfileSchema ──────────────────────────────────────────────────────

describe("updateProfileSchema", () => {
  it("accepts valid profile update", () => {
    expect(updateProfileSchema.parse({ firstName: "Jane", lastName: "Doe" })).toBeTruthy();
  });

  it("rejects empty firstName", () => {
    expect(() => updateProfileSchema.parse({ firstName: "", lastName: "Doe" })).toThrow();
  });
});

// ── changePasswordSchema ─────────────────────────────────────────────────────

describe("changePasswordSchema", () => {
  it("accepts matching passwords", () => {
    expect(
      changePasswordSchema.parse({
        currentPassword: "OldPass1",
        newPassword: "NewPass1",
        confirmPassword: "NewPass1",
      })
    ).toBeTruthy();
  });

  it("rejects non-matching passwords", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "OldPass1",
        newPassword: "NewPass1",
        confirmPassword: "Different1",
      })
    ).toThrow();
  });
});

// ── notificationPrefsSchema ──────────────────────────────────────────────────

describe("notificationPrefsSchema", () => {
  it("accepts valid prefs", () => {
    expect(
      notificationPrefsSchema.parse({
        newOffers: true,
        offerUpdates: false,
        messages: true,
        listingActivity: true,
      })
    ).toBeTruthy();
  });

  it("rejects missing fields", () => {
    expect(() => notificationPrefsSchema.parse({ newOffers: true })).toThrow();
  });
});

// ── deleteAccountSchema ──────────────────────────────────────────────────────

describe("deleteAccountSchema", () => {
  it("accepts DELETE confirmation", () => {
    expect(deleteAccountSchema.parse({ confirmation: "DELETE" })).toBeTruthy();
  });

  it("rejects wrong confirmation", () => {
    expect(() => deleteAccountSchema.parse({ confirmation: "delete" })).toThrow();
  });
});

// ── paginationSchema ─────────────────────────────────────────────────────────

describe("paginationSchema", () => {
  it("provides defaults", () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it("coerces string values", () => {
    const result = paginationSchema.parse({ page: "3", limit: "10" });
    expect(result).toEqual({ page: 3, limit: 10 });
  });

  it("rejects limit over 50", () => {
    expect(() => paginationSchema.parse({ limit: 100 })).toThrow();
  });
});

// ── listingSearchSchema ──────────────────────────────────────────────────────

describe("listingSearchSchema", () => {
  it("accepts empty params with defaults", () => {
    const result = listingSearchSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.sort).toBe("newest");
  });

  it("accepts all filter params", () => {
    const result = listingSearchSchema.parse({
      suburb: "Perth",
      state: "WA",
      propertyType: "HOUSE",
      saleMethod: "OPEN_OFFERS",
      minPrice: "500000",
      minBeds: "3",
      sort: "price_asc",
    });
    expect(result.suburb).toBe("Perth");
    expect(result.minPrice).toBe(500000);
  });
});

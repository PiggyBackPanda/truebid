/**
 * Unit tests for offer-utils.ts
 *
 * Run with: npx vitest (requires: npm install -D vitest)
 */

import { describe, it, expect } from "vitest";
import { offerStrengthScore, rankOffers } from "./offer-utils";
import type { PublicOffer } from "./offer-utils";

// ── offerStrengthScore ────────────────────────────────────────────────────────

describe("offerStrengthScore", () => {
  it("returns 60 for unconditional with 30-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "UNCONDITIONAL", settlementDays: 30 })).toBe(60);
  });

  it("returns 40+20=60 for unconditional 14-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "UNCONDITIONAL", settlementDays: 14 })).toBe(60);
  });

  it("returns 40+15=55 for unconditional 45-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "UNCONDITIONAL", settlementDays: 45 })).toBe(55);
  });

  it("returns 40+10=50 for unconditional 60-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "UNCONDITIONAL", settlementDays: 60 })).toBe(50);
  });

  it("returns 40+5=45 for unconditional 90-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "UNCONDITIONAL", settlementDays: 90 })).toBe(45);
  });

  it("returns 30+20=50 for building/pest + 30-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "SUBJECT_TO_BUILDING_PEST", settlementDays: 30 })).toBe(50);
  });

  it("returns 20+20=40 for finance + 30-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "SUBJECT_TO_FINANCE", settlementDays: 30 })).toBe(40);
  });

  it("returns 10+20=30 for both conditions + 30-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "SUBJECT_TO_BOTH", settlementDays: 30 })).toBe(30);
  });

  it("returns 5+20=25 for subject to sale + 30-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "SUBJECT_TO_SALE", settlementDays: 30 })).toBe(25);
  });

  it("returns 0+20=20 for OTHER + 30-day settlement", () => {
    expect(offerStrengthScore({ conditionType: "OTHER", settlementDays: 30 })).toBe(20);
  });
});

// ── rankOffers ────────────────────────────────────────────────────────────────

function makeOffer(
  partial: Partial<PublicOffer> & { amountCents: number; status: string; createdAt: string }
): PublicOffer {
  return {
    id: partial.id ?? "id",
    publicAlias: "Buyer_test",
    conditionType: "UNCONDITIONAL",
    conditionText: null,
    settlementDays: 30,
    updatedAt: partial.createdAt,
    ...partial,
  };
}

describe("rankOffers", () => {
  it("sorts active offers by amount descending", () => {
    const offers = [
      makeOffer({ id: "a", amountCents: 800_000_00, status: "ACTIVE", createdAt: "2024-01-01T00:00:00Z" }),
      makeOffer({ id: "b", amountCents: 900_000_00, status: "ACTIVE", createdAt: "2024-01-02T00:00:00Z" }),
      makeOffer({ id: "c", amountCents: 820_000_00, status: "ACTIVE", createdAt: "2024-01-03T00:00:00Z" }),
    ];

    const ranked = rankOffers(offers);
    expect(ranked.map((o) => o.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by createdAt ascending (first-in advantage)", () => {
    const offers = [
      makeOffer({ id: "late",  amountCents: 800_000_00, status: "ACTIVE", createdAt: "2024-01-02T00:00:00Z" }),
      makeOffer({ id: "early", amountCents: 800_000_00, status: "ACTIVE", createdAt: "2024-01-01T00:00:00Z" }),
    ];

    const ranked = rankOffers(offers);
    expect(ranked[0].id).toBe("early");
  });

  it("places withdrawn offers below active offers", () => {
    const offers = [
      makeOffer({ id: "w", amountCents: 900_000_00, status: "WITHDRAWN", createdAt: "2024-01-01T00:00:00Z" }),
      makeOffer({ id: "a", amountCents: 800_000_00, status: "ACTIVE",    createdAt: "2024-01-02T00:00:00Z" }),
    ];

    const ranked = rankOffers(offers);
    expect(ranked[0].id).toBe("a");
    expect(ranked[1].id).toBe("w");
  });

  it("returns empty array for empty input", () => {
    expect(rankOffers([])).toEqual([]);
  });

  it("handles a mix of active, withdrawn, and other statuses", () => {
    const offers = [
      makeOffer({ id: "accepted", amountCents: 900_000_00, status: "ACCEPTED",  createdAt: "2024-01-01T00:00:00Z" }),
      makeOffer({ id: "active",   amountCents: 800_000_00, status: "ACTIVE",    createdAt: "2024-01-02T00:00:00Z" }),
      makeOffer({ id: "withdrawn",amountCents: 850_000_00, status: "WITHDRAWN", createdAt: "2024-01-03T00:00:00Z" }),
    ];

    const ranked = rankOffers(offers);
    // active first, then withdrawn, then accepted
    expect(ranked[0].id).toBe("active");
    expect(ranked[1].id).toBe("withdrawn");
    expect(ranked[2].id).toBe("accepted");
  });
});

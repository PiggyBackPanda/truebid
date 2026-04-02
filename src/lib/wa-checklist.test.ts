import { describe, it, expect } from "vitest";
import { WA_CHECKLIST } from "./wa-checklist";

describe("WA_CHECKLIST", () => {
  it("has at least one mandatory item", () => {
    const mandatory = WA_CHECKLIST.filter((item) => item.mandatory);
    expect(mandatory.length).toBeGreaterThan(0);
  });

  it("has unique keys", () => {
    const keys = WA_CHECKLIST.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every item has required fields populated", () => {
    for (const item of WA_CHECKLIST) {
      expect(item.key).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.helpText).toBeTruthy();
    }
  });

  it("settlement agent is mandatory", () => {
    const sa = WA_CHECKLIST.find((i) => i.key === "wa_settlement_agent");
    expect(sa).toBeDefined();
    expect(sa!.mandatory).toBe(true);
  });

  it("does not contain em dashes in user-facing text", () => {
    for (const item of WA_CHECKLIST) {
      expect(item.title).not.toContain("\u2014");
      expect(item.description).not.toContain("\u2014");
      expect(item.helpText).not.toContain("\u2014");
    }
  });

  it("does not contain banned auction language in user-facing text", () => {
    const banned = /\b(bid|bidding|bidder|auction|auctioneer)\b/i;
    for (const item of WA_CHECKLIST) {
      expect(item.title).not.toMatch(banned);
      expect(item.description).not.toMatch(banned);
      expect(item.helpText).not.toMatch(banned);
    }
  });

  it("referral partner items have ctaLabel and partnerBusinessType", () => {
    const referralItems = WA_CHECKLIST.filter((i) => i.ctaType === "referral_partner");
    for (const item of referralItems) {
      expect(item.ctaLabel).toBeTruthy();
      expect(item.partnerBusinessType).toBeTruthy();
    }
  });
});

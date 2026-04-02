import { describe, it, expect } from "vitest";
import {
  getAllGuides,
  getGuideBySlug,
  getGuidesByCategory,
  getGuidesGroupedByCategory,
  CATEGORIES,
  CATEGORY_ORDER,
} from "./guides";

describe("guides", () => {
  it("getAllGuides returns a non-empty array", () => {
    const guides = getAllGuides();
    expect(guides.length).toBeGreaterThan(0);
  });

  it("every guide has required fields", () => {
    for (const guide of getAllGuides()) {
      expect(guide.slug).toBeTruthy();
      expect(guide.title).toBeTruthy();
      expect(guide.category).toBeTruthy();
      expect(guide.summary).toBeTruthy();
      expect(guide.readTime).toBeTruthy();
      expect(guide.content).toBeTruthy();
    }
  });

  it("every guide has a unique slug", () => {
    const slugs = getAllGuides().map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("getGuideBySlug returns a guide for a known slug", () => {
    const guides = getAllGuides();
    const first = guides[0];
    const found = getGuideBySlug(first.slug);
    expect(found).toBeDefined();
    expect(found!.slug).toBe(first.slug);
  });

  it("getGuideBySlug returns undefined for an unknown slug", () => {
    expect(getGuideBySlug("nonexistent-slug-12345")).toBeUndefined();
  });

  it("getGuidesByCategory returns guides matching the category", () => {
    const guides = getAllGuides();
    const firstCategory = guides[0].category;
    const filtered = getGuidesByCategory(firstCategory);
    expect(filtered.length).toBeGreaterThan(0);
    for (const g of filtered) {
      expect(g.category).toBe(firstCategory);
    }
  });

  it("getGuidesGroupedByCategory returns groups in CATEGORY_ORDER", () => {
    const groups = getGuidesGroupedByCategory();
    const categorySlugs = groups.map((g) => g.category);

    // All known categories with guides should appear in order
    const expectedOrder = CATEGORY_ORDER.filter((cat) =>
      getAllGuides().some((g) => g.category === cat)
    );
    for (let i = 0; i < expectedOrder.length; i++) {
      expect(categorySlugs[i]).toBe(expectedOrder[i]);
    }
  });

  it("CATEGORIES has a label for each CATEGORY_ORDER entry", () => {
    for (const cat of CATEGORY_ORDER) {
      expect(CATEGORIES[cat]).toBeTruthy();
    }
  });

  it("no guide content contains em dashes", () => {
    for (const guide of getAllGuides()) {
      expect(guide.content).not.toContain("\u2014");
      expect(guide.title).not.toContain("\u2014");
      expect(guide.summary).not.toContain("\u2014");
    }
  });

  it("no guide content contains banned auction language (outside legal contrast)", () => {
    const banned = /\bbidding\b|\bbidder\b|\bauctioneer(?!\.)\b/i;
    for (const guide of getAllGuides()) {
      // Skip "how-open-offers-works" which uses legal contrast language
      if (guide.slug === "how-open-offers-works") continue;
      expect(guide.title).not.toMatch(banned);
      expect(guide.summary).not.toMatch(banned);
    }
  });
});

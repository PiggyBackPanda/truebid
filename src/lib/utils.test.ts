import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateTime, generatePublicAlias, clamp, cn } from "./utils";

describe("formatCurrency", () => {
  it("formats cents to AUD dollar string", () => {
    expect(formatCurrency(82_000_000)).toBe("$820,000");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats small amounts without decimal", () => {
    expect(formatCurrency(100)).toBe("$1");
  });

  it("formats large amounts with commas", () => {
    expect(formatCurrency(150_000_000)).toBe("$1,500,000");
  });
});

describe("formatDate", () => {
  it("formats a UTC ISO string to Perth timezone", () => {
    const result = formatDate("2024-06-15T00:00:00Z");
    expect(result).toContain("Jun");
    expect(result).toContain("2024");
  });

  it("accepts a Date object", () => {
    const result = formatDate(new Date("2024-01-01T12:00:00Z"));
    expect(result).toContain("2024");
  });
});

describe("formatDateTime", () => {
  it("includes time components", () => {
    const result = formatDateTime("2024-06-15T14:30:00Z");
    expect(result).toContain("Jun");
    expect(result).toContain("2024");
  });
});

describe("generatePublicAlias", () => {
  it("starts with 'Buyer_'", () => {
    const alias = generatePublicAlias();
    expect(alias).toMatch(/^Buyer_[a-z0-9]{4}$/);
  });

  it("generates different aliases on successive calls", () => {
    const aliases = new Set(Array.from({ length: 20 }, () => generatePublicAlias()));
    expect(aliases.size).toBeGreaterThan(1);
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles min === max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe("cn", () => {
  it("joins class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("returns empty string for all falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

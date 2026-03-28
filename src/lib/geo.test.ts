import { describe, it, expect } from "vitest";
import { fuzzCoordinates } from "./geo";

describe("fuzzCoordinates", () => {
  it("returns the same offset for the same seed", () => {
    const a = fuzzCoordinates(-31.9505, 115.8605, "listing_abc");
    const b = fuzzCoordinates(-31.9505, 115.8605, "listing_abc");
    expect(a.lat).toBe(b.lat);
    expect(a.lng).toBe(b.lng);
  });

  it("offset is within ±0.002 degrees for lat and lng", () => {
    const seeds = ["abc", "xyz", "listing_99", "cl123abc", "test-listing"];
    const lat = -31.9505;
    const lng = 115.8605;
    for (const seed of seeds) {
      const result = fuzzCoordinates(lat, lng, seed);
      expect(Math.abs(result.lat - lat)).toBeLessThanOrEqual(0.002 + 1e-9);
      expect(Math.abs(result.lng - lng)).toBeLessThanOrEqual(0.002 + 1e-9);
    }
  });

  it("different seeds produce different offsets", () => {
    const lat = -31.9505;
    const lng = 115.8605;
    const a = fuzzCoordinates(lat, lng, "seed_one");
    const b = fuzzCoordinates(lat, lng, "seed_two");
    // Astronomically unlikely to collide, treat as always different
    expect(a.lat !== b.lat || a.lng !== b.lng).toBe(true);
  });

  it("does not return the original coordinates when offset is non-zero", () => {
    // This test is probabilistic: the hash of this specific seed is non-zero
    const result = fuzzCoordinates(-31.9505, 115.8605, "truebid_listing");
    expect(result.lat).not.toBe(-31.9505);
  });
});

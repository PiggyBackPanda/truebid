/**
 * Geographic utilities for coordinate manipulation.
 */

/**
 * Produces a deterministic ±0.002-degree offset from a seed string.
 * Same seed always yields the same offset — map pin won't drift on reload.
 */
export function fuzzCoordinates(
  lat: number,
  lng: number,
  seed: string
): { lat: number; lng: number } {
  const h1 = numericHash(seed);
  // Derive a second independent hash by mixing with a fixed constant
  const h2 = numericHash(seed + "\x01");

  // Scale unsigned 32-bit int to [-0.002, 0.002)
  // h / 0x100000000 is in [0, 1), so * 0.004 - 0.002 is in [-0.002, 0.002)
  const latOffset = (h1 / 0x100000000) * 0.004 - 0.002;
  const lngOffset = (h2 / 0x100000000) * 0.004 - 0.002;

  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}

/**
 * FNV-1a 32-bit hash. Returns a positive 32-bit unsigned integer.
 */
function numericHash(str: string): number {
  let h = 2166136261; // FNV-1a 32-bit offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619); // FNV prime
  }
  return h >>> 0; // force unsigned
}

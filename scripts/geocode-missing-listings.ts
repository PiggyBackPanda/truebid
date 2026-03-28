/**
 * Backfills latitude/longitude for listings that are missing coordinates.
 *
 * Uses the OpenStreetMap Nominatim API (free, no API key required).
 * Geocodes to suburb centroid level — never street level — consistent with
 * the platform's address privacy model.
 *
 * Run with:
 *   npx tsx scripts/geocode-missing-listings.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TrueBid/1.0 (hello@truebid.com.au)";

// Nominatim rate limit: 1 request per second
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeSuburb(
  suburb: string,
  state: string,
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const query = `${suburb} ${state} ${postcode} Australia`;
  const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      console.error(`  Nominatim HTTP ${res.status} for "${query}"`);
      return null;
    }

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;

    if (!results.length) {
      // Retry without postcode
      const fallbackUrl = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(`${suburb} ${state} Australia`)}&limit=1`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      const fallbackResults = (await fallbackRes.json()) as Array<{ lat: string; lon: string }>;
      if (!fallbackResults.length) return null;
      return {
        lat: parseFloat(fallbackResults[0].lat),
        lng: parseFloat(fallbackResults[0].lon),
      };
    }

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch (err) {
    console.error(`  Fetch error for "${query}":`, err);
    return null;
  }
}

async function main() {
  const listings = await prisma.listing.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
    select: {
      id: true,
      streetAddress: true,
      suburb: true,
      state: true,
      postcode: true,
      status: true,
    },
  });

  if (listings.length === 0) {
    console.log("All listings already have coordinates. Nothing to do.");
    return;
  }

  console.log(`Found ${listings.length} listing(s) missing coordinates.\n`);

  let updated = 0;
  let failed = 0;

  for (const listing of listings) {
    const label = `${listing.streetAddress}, ${listing.suburb} ${listing.state} (${listing.status})`;
    process.stdout.write(`Geocoding: ${label} ... `);

    const coords = await geocodeSuburb(listing.suburb, listing.state, listing.postcode);

    if (coords) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      });
      console.log(`lat ${coords.lat.toFixed(4)}, lng ${coords.lng.toFixed(4)}`);
      updated++;
    } else {
      console.log("FAILED — no result from Nominatim");
      failed++;
    }

    // Respect Nominatim's 1 req/sec rate limit
    await sleep(1100);
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main()
  .catch((err) => {
    console.error("Script error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

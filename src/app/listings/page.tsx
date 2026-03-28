import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeListingAddress } from "@/lib/listing-serializer";
import type { AddressVisibility } from "@/lib/listing-serializer";
import { ListingCard } from "@/components/listings/ListingCard";
import { SaveSearchButton } from "@/components/listings/SaveSearchButton";
import { ViewToggle } from "@/components/listings/ViewToggle";
import { MapViewClient } from "@/components/listings/MapViewClient";
import type { Metadata } from "next";
import type { Prisma, AustralianState, PropertyType, SaleMethod } from "@prisma/client";

// ── Metadata ─────────────────────────────────────────────────────────────────

interface SearchParams {
  q?: string;
  suburb?: string;
  propertyType?: string;
  saleMethod?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  minBaths?: string;
  sort?: string;
  page?: string;
  view?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const suburb = params.suburb ?? params.q;
  return {
    title: suburb
      ? `Properties for sale in ${suburb} | TrueBid`
      : "Properties for sale | TrueBid",
    description: suburb
      ? `Browse properties for sale in ${suburb}, Western Australia. Free listings, transparent offers, no agent commissions.`
      : "Browse properties for sale across Australia. Free listings, transparent offers, no agent commissions.",
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "HOUSE", label: "House" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "VILLA", label: "Villa" },
  { value: "LAND", label: "Land" },
  { value: "RURAL", label: "Rural" },
];

const PRICE_OPTIONS = [
  { value: "", label: "Any Price", min: "", max: "" },
  { value: "u400", label: "Under $400k", min: "", max: "40000000" },
  { value: "400-600", label: "$400k–$600k", min: "40000000", max: "60000000" },
  { value: "600-800", label: "$600k–$800k", min: "60000000", max: "80000000" },
  { value: "800-1m", label: "$800k–$1M", min: "80000000", max: "100000000" },
  { value: "1m-1.5m", label: "$1M–$1.5M", min: "100000000", max: "150000000" },
  { value: "1.5m+", label: "$1.5M+", min: "150000000", max: "" },
];

const BED_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

const BATH_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
];

const SALE_METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "OPEN_OFFERS", label: "Live Offers" },
  { value: "PRIVATE_OFFERS", label: "Private Offers" },
  { value: "FIXED_PRICE", label: "Fixed Price" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "closing_soon", label: "Closing Soon" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUrl(base: SearchParams, overrides: Partial<SearchParams> & { page?: string }): string {
  const merged = { ...base, ...overrides };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v && v !== "") params.set(k, v);
  }
  return `/listings?${params.toString()}`;
}

function removeParam(base: SearchParams, key: keyof SearchParams): string {
  const next = { ...base };
  delete next[key];
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v && v !== "") params.set(k, v as string);
  }
  const qs = params.toString();
  return qs ? `/listings?${qs}` : "/listings";
}

/** Derive a price range "key" from minPrice/maxPrice params for the select value */
function priceKey(minPrice?: string, maxPrice?: string): string {
  if (!minPrice && maxPrice === "40000000") return "u400";
  if (minPrice === "40000000" && maxPrice === "60000000") return "400-600";
  if (minPrice === "60000000" && maxPrice === "80000000") return "600-800";
  if (minPrice === "80000000" && maxPrice === "100000000") return "800-1m";
  if (minPrice === "100000000" && maxPrice === "150000000") return "1m-1.5m";
  if (minPrice === "150000000" && !maxPrice) return "1.5m+";
  return "";
}

function priceLabel(minPrice?: string, maxPrice?: string): string | null {
  const opt = PRICE_OPTIONS.find(
    (o) => o.min === (minPrice ?? "") && o.max === (maxPrice ?? "")
  );
  return opt && opt.value ? opt.label : null;
}

// ── Suburb fallback search ────────────────────────────────────────────────────

type FallbackLevel = 0 | 1 | 2 | 3 | 4;
// 0 = exact match found (no notice)
// 1 = same postcode
// 2 = 10 km radius
// 3 = same state
// 4 = no results anywhere

const STATE_DISPLAY: Record<string, string> = {
  WA: "Western Australia",
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  SA: "South Australia",
  TAS: "Tasmania",
  ACT: "Australian Capital Territory",
  NT: "Northern Territory",
};

const VALID_STATES = new Set<string>(["WA", "NSW", "VIC", "QLD", "SA", "TAS", "ACT", "NT"]);

// Shared select shape used for every listing query so the return type is consistent.
const LISTING_SELECT = {
  id: true,
  status: true,
  streetAddress: true,
  suburb: true,
  state: true,
  postcode: true,
  latitude: true,
  longitude: true,
  addressVisibility: true,
  propertyType: true,
  bedrooms: true,
  bathrooms: true,
  carSpaces: true,
  landSizeM2: true,
  guidePriceCents: true,
  saleMethod: true,
  closingDate: true,
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { url: true, thumbnailUrl: true },
  },
  _count: {
    select: {
      offers: { where: { status: "ACTIVE" } },
      inspectionSlots: true,
    },
  },
} as const;

type ListingRow = Prisma.ListingGetPayload<{ select: typeof LISTING_SELECT }>;

async function geocodeSuburbAU(suburb: string): Promise<{
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  stateCode: string | null;
} | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  try {
    const query = encodeURIComponent(`${suburb} Australia`);
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?types=place,postcode&limit=1&country=AU&access_token=${token}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      features?: Array<{
        center: [number, number];
        context?: Array<{ id: string; text: string; short_code?: string }>;
      }>;
    };
    const feature = data.features?.[0];
    if (!feature) return null;
    const [lng, lat] = feature.center;
    let postcode: string | null = null;
    let stateCode: string | null = null;
    for (const ctx of feature.context ?? []) {
      if (ctx.id.startsWith("postcode.")) postcode = ctx.text;
      if (ctx.id.startsWith("region.")) {
        const sc = ctx.short_code ?? "";
        stateCode = sc.startsWith("AU-") ? sc.slice(3) : (ctx.text || null);
      }
    }
    return { postcode, lat, lng, stateCode };
  } catch {
    return null;
  }
}

async function fetchNearbyListings(
  suburb: string,
  geo: Awaited<ReturnType<typeof geocodeSuburbAU>>,
  baseFilters: Prisma.ListingWhereInput,
  // Anchor derived from found listings (works even when Mapbox is unavailable)
  anchor?: { state: string; postcode: string } | null,
): Promise<ListingRow[]> {
  const notThisSuburb: Prisma.ListingWhereInput = {
    NOT: { suburb: { equals: suburb, mode: "insensitive" } },
  };

  // Resolve postcode + state: prefer Mapbox result, fall back to anchor from found listings
  const targetPostcode = geo?.postcode ?? anchor?.postcode ?? null;
  const targetState = geo?.stateCode?.toUpperCase() ?? anchor?.state ?? null;

  // A: Same postcode
  if (targetPostcode) {
    const results = await prisma.listing.findMany({
      where: { ...baseFilters, ...notThisSuburb, postcode: targetPostcode },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: LISTING_SELECT,
    });
    if (results.length > 0) return results;
  }

  // B: 10 km radius using listing coordinates (only works if listings have lat/lng stored)
  if (geo?.lat != null && geo?.lng != null) {
    const { lat, lng } = geo;
    const radiusRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Listing"
      WHERE status IN ('ACTIVE', 'COMING_SOON')
        AND latitude  IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(latitude))
            ))
          )
        ) <= 10
    `;
    if (radiusRows.length > 0) {
      const ids = radiusRows.map((r) => r.id);
      const results = await prisma.listing.findMany({
        where: { ...baseFilters, ...notThisSuburb, id: { in: ids } },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: LISTING_SELECT,
      });
      if (results.length > 0) return results;
    }
  }

  return [];
}

async function searchListingsWithSuburbFallback(
  suburb: string,
  baseFilters: Prisma.ListingWhereInput,
  orderBy: Prisma.ListingOrderByWithRelationInput,
  skip: number,
  take: number,
): Promise<{
  listings: ListingRow[];
  total: number;
  fallbackLevel: FallbackLevel;
  fallbackMeta: { searchedSuburb: string; postcode?: string; state?: string };
  nearbyListings: ListingRow[];
}> {
  // STEP 1: Exact suburb match (case-insensitive)
  // Geocoding runs in parallel: needed for nearby listings on a hit, or fallback steps on a miss.
  const step1Where: Prisma.ListingWhereInput = {
    ...baseFilters,
    suburb: { equals: suburb, mode: "insensitive" },
  };
  const [[step1Listings, step1Total], geo] = await Promise.all([
    Promise.all([
      prisma.listing.findMany({ where: step1Where, skip, take, orderBy, select: LISTING_SELECT }),
      prisma.listing.count({ where: step1Where }),
    ]),
    geocodeSuburbAU(suburb),
  ]);
  if (step1Total > 0) {
    const anchor = step1Listings[0]
      ? { state: step1Listings[0].state as string, postcode: step1Listings[0].postcode }
      : null;
    const nearbyListings = await fetchNearbyListings(suburb, geo, baseFilters, anchor);
    return { listings: step1Listings, total: step1Total, fallbackLevel: 0, fallbackMeta: { searchedSuburb: suburb }, nearbyListings };
  }

  // STEP 2: Same postcode
  if (geo?.postcode) {
    const step2Where: Prisma.ListingWhereInput = { ...baseFilters, postcode: geo.postcode };
    const [step2Listings, step2Total] = await Promise.all([
      prisma.listing.findMany({ where: step2Where, skip, take, orderBy, select: LISTING_SELECT }),
      prisma.listing.count({ where: step2Where }),
    ]);
    if (step2Total > 0) {
      return {
        listings: step2Listings, total: step2Total, fallbackLevel: 1,
        fallbackMeta: { searchedSuburb: suburb, postcode: geo.postcode },
        nearbyListings: [],
      };
    }
  }

  // STEP 3: 10 km radius (requires lat/lng on listings)
  if (geo?.lat != null && geo?.lng != null) {
    const { lat, lng } = geo;
    const radiusRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Listing"
      WHERE status IN ('ACTIVE', 'COMING_SOON')
        AND latitude  IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(latitude))
            ))
          )
        ) <= 10
    `;
    if (radiusRows.length > 0) {
      const ids = radiusRows.map((r) => r.id);
      const step3Where: Prisma.ListingWhereInput = { ...baseFilters, id: { in: ids } };
      const [step3Listings, step3Total] = await Promise.all([
        prisma.listing.findMany({ where: step3Where, skip, take, orderBy, select: LISTING_SELECT }),
        prisma.listing.count({ where: step3Where }),
      ]);
      if (step3Total > 0) {
        return {
          listings: step3Listings, total: step3Total, fallbackLevel: 2,
          fallbackMeta: { searchedSuburb: suburb },
          nearbyListings: [],
        };
      }
    }
  }

  // STEP 4: Same state
  const stateCode = geo?.stateCode?.toUpperCase() ?? null;
  const validState = stateCode && VALID_STATES.has(stateCode) ? stateCode as AustralianState : null;
  if (validState) {
    const step4Where: Prisma.ListingWhereInput = { ...baseFilters, state: validState };
    const [step4Listings, step4Total] = await Promise.all([
      prisma.listing.findMany({ where: step4Where, skip, take, orderBy, select: LISTING_SELECT }),
      prisma.listing.count({ where: step4Where }),
    ]);
    if (step4Total > 0) {
      return {
        listings: step4Listings, total: step4Total, fallbackLevel: 3,
        fallbackMeta: { searchedSuburb: suburb, state: validState },
        nearbyListings: [],
      };
    }
  }

  // STEP 5: Truly no results
  return { listings: [], total: 0, fallbackLevel: 4, fallbackMeta: { searchedSuburb: suburb }, nearbyListings: [] };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [params, session] = await Promise.all([
    searchParams,
    getServerSession(authOptions),
  ]);
  const viewerId = (session?.user as unknown as Record<string, unknown> | undefined)?.id as string | undefined;

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const minPrice = params.minPrice;
  const maxPrice = params.maxPrice;
  const minBeds = params.minBeds ? parseInt(params.minBeds, 10) : undefined;
  const minBaths = params.minBaths ? parseInt(params.minBaths, 10) : undefined;
  const sort = params.sort ?? "newest";

  // Attribute filters (price, beds, type etc.) are safe to apply to nearby listings too
  const attributeFilters: Prisma.ListingWhereInput = {
    status: { in: ["ACTIVE", "COMING_SOON"] },
    ...(params.propertyType ? { propertyType: params.propertyType as PropertyType } : {}),
    ...(params.saleMethod ? { saleMethod: params.saleMethod as SaleMethod } : {}),
    ...(minBeds ? { bedrooms: { gte: minBeds } } : {}),
    ...(minBaths ? { bathrooms: { gte: minBaths } } : {}),
    ...(minPrice ? { guidePriceCents: { gte: parseInt(minPrice, 10) } } : {}),
    ...(maxPrice ? { guidePriceCents: { lte: parseInt(maxPrice, 10) } } : {}),
  };

  // Full filters including free-text search, used for the main results query only.
  // The q OR clause must NOT be passed to fetchNearbyListings: a Karrinyup listing
  // won't mention "Scarborough" in any field, so it would be incorrectly excluded.
  const baseFilters: Prisma.ListingWhereInput = {
    ...attributeFilters,
    ...(params.q
      ? {
          OR: [
            { suburb: { contains: params.q, mode: "insensitive" as const } },
            { streetAddress: { contains: params.q, mode: "insensitive" as const } },
            { description: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sort === "price_asc"
      ? { guidePriceCents: "asc" }
      : sort === "price_desc"
      ? { guidePriceCents: "desc" }
      : sort === "closing_soon"
      ? { closingDate: "asc" }
      : { createdAt: "desc" };

  let listings: ListingRow[];
  let total: number;
  let fallbackLevel: FallbackLevel = 0;
  let fallbackMeta: { searchedSuburb: string; postcode?: string; state?: string } = { searchedSuburb: "" };
  let nearbyListings: ListingRow[] = [];

  if (params.suburb) {
    // Suburb search: run progressive fallback logic
    const result = await searchListingsWithSuburbFallback(
      params.suburb, baseFilters, orderBy, skip, PAGE_SIZE
    );
    listings = result.listings;
    total = result.total;
    fallbackLevel = result.fallbackLevel;
    fallbackMeta = result.fallbackMeta;
    nearbyListings = result.nearbyListings;
  } else {
    // No suburb filter: standard query
    const where = baseFilters;
    const fetched = await Promise.all([
      prisma.listing.findMany({ where, skip, take: PAGE_SIZE, orderBy, select: LISTING_SELECT }),
      prisma.listing.count({ where }),
    ]);
    listings = fetched[0];
    total = fetched[1];

    // When q looks like a suburb name and returned results, also surface nearby listings
    if (params.q && total > 0 && page === 1) {
      const geo = await geocodeSuburbAU(params.q);
      const anchor = listings[0]
        ? { state: listings[0].state as string, postcode: listings[0].postcode }
        : null;
      nearbyListings = await fetchNearbyListings(params.q, geo, attributeFilters, anchor);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(
    params.q ||
    params.suburb ||
    params.propertyType ||
    params.saleMethod ||
    params.minPrice ||
    params.maxPrice ||
    params.minBeds ||
    params.minBaths
  );

  const currentPriceKey = priceKey(minPrice, maxPrice);
  const currentPriceLabel = priceLabel(minPrice, maxPrice);

  return (
    <div className="min-h-screen bg-bg">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Search bar */}
        <form method="GET" action="/listings" className="mb-6">
          {/* Preserve non-search filters when submitting */}
          {params.propertyType && <input type="hidden" name="propertyType" value={params.propertyType} />}
          {params.saleMethod && <input type="hidden" name="saleMethod" value={params.saleMethod} />}
          {params.minPrice && <input type="hidden" name="minPrice" value={params.minPrice} />}
          {params.maxPrice && <input type="hidden" name="maxPrice" value={params.maxPrice} />}
          {params.minBeds && <input type="hidden" name="minBeds" value={params.minBeds} />}
          {params.minBaths && <input type="hidden" name="minBaths" value={params.minBaths} />}
          {params.sort && params.sort !== "newest" && <input type="hidden" name="sort" value={params.sort} />}

          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search suburb, postcode, or address..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-border rounded-[12px] text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/10"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-navy text-white text-xs font-semibold px-4 py-2 rounded-[8px] hover:bg-navy/90 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filters */}
        <form method="GET" action="/listings" className="mb-4">
          {params.q && <input type="hidden" name="q" value={params.q} />}

          <div className="flex flex-wrap gap-2">
            {/* Property Type */}
            <select
              name="propertyType"
              defaultValue={params.propertyType ?? ""}
              onChange={undefined}
              className="px-3 py-2 bg-white border border-border rounded-[10px] text-sm text-text focus:outline-none focus:border-navy/40 cursor-pointer"
            >
              {PROPERTY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Price Range: encoded as minPrice/maxPrice */}
            <select
              name="_price"
              defaultValue={currentPriceKey}
              className="px-3 py-2 bg-white border border-border rounded-[10px] text-sm text-text focus:outline-none focus:border-navy/40 cursor-pointer"
            >
              {PRICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {/* Price hidden fields are handled by JS-free fallback below */}

            {/* Bedrooms */}
            <select
              name="minBeds"
              defaultValue={params.minBeds ?? ""}
              className="px-3 py-2 bg-white border border-border rounded-[10px] text-sm text-text focus:outline-none focus:border-navy/40 cursor-pointer"
            >
              <option value="">Beds: Any</option>
              {BED_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} bed
                </option>
              ))}
            </select>

            {/* Bathrooms */}
            <select
              name="minBaths"
              defaultValue={params.minBaths ?? ""}
              className="px-3 py-2 bg-white border border-border rounded-[10px] text-sm text-text focus:outline-none focus:border-navy/40 cursor-pointer"
            >
              <option value="">Baths: Any</option>
              {BATH_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} bath
                </option>
              ))}
            </select>

            {/* Sale Method */}
            <select
              name="saleMethod"
              defaultValue={params.saleMethod ?? ""}
              className="px-3 py-2 bg-white border border-border rounded-[10px] text-sm text-text focus:outline-none focus:border-navy/40 cursor-pointer"
            >
              {SALE_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              name="sort"
              defaultValue={sort}
              className="px-3 py-2 bg-white border border-border rounded-[10px] text-sm text-text focus:outline-none focus:border-navy/40 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-amber text-navy text-sm font-semibold rounded-[10px] hover:bg-amber/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </form>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {params.q && (
              <a
                href={removeParam(params, "q")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/8 text-navy text-xs font-medium rounded-full hover:bg-navy/15 transition-colors"
              >
                &ldquo;{params.q}&rdquo; <span aria-hidden>×</span>
              </a>
            )}
            {params.suburb && (
              <a
                href={removeParam(params, "suburb")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/8 text-navy text-xs font-medium rounded-full hover:bg-navy/15 transition-colors"
              >
                {params.suburb} <span aria-hidden>×</span>
              </a>
            )}
            {params.propertyType && (
              <a
                href={removeParam(params, "propertyType")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/8 text-navy text-xs font-medium rounded-full hover:bg-navy/15 transition-colors"
              >
                {PROPERTY_TYPE_OPTIONS.find((o) => o.value === params.propertyType)?.label ?? params.propertyType}{" "}
                <span aria-hidden>×</span>
              </a>
            )}
            {currentPriceLabel && (
              <a
                href={(() => {
                  const next = { ...params };
                  delete next.minPrice;
                  delete next.maxPrice;
                  const p = new URLSearchParams();
                  for (const [k, v] of Object.entries(next)) {
                    if (v) p.set(k, v as string);
                  }
                  return `/listings?${p.toString()}`;
                })()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/8 text-navy text-xs font-medium rounded-full hover:bg-navy/15 transition-colors"
              >
                {currentPriceLabel} <span aria-hidden>×</span>
              </a>
            )}
            {params.minBeds && (
              <a
                href={removeParam(params, "minBeds")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/8 text-navy text-xs font-medium rounded-full hover:bg-navy/15 transition-colors"
              >
                {params.minBeds}+ beds <span aria-hidden>×</span>
              </a>
            )}
            {params.minBaths && (
              <a
                href={removeParam(params, "minBaths")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/8 text-navy text-xs font-medium rounded-full hover:bg-navy/15 transition-colors"
              >
                {params.minBaths}+ baths <span aria-hidden>×</span>
              </a>
            )}
            {params.saleMethod && (
              <a
                href={removeParam(params, "saleMethod")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy/8 text-navy text-xs font-medium rounded-full hover:bg-navy/15 transition-colors"
              >
                {SALE_METHOD_OPTIONS.find((o) => o.value === params.saleMethod)?.label ?? params.saleMethod}{" "}
                <span aria-hidden>×</span>
              </a>
            )}
            <Link
              href="/listings"
              className="text-xs text-text-muted underline hover:text-text transition-colors ml-1"
            >
              Clear all
            </Link>
          </div>
        )}

        {/* Suburb fallback notice */}
        {params.suburb && fallbackLevel > 0 && fallbackLevel < 4 && (
          <div
            className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-[10px] text-sm"
            style={{
              background: "rgba(59,130,246,0.05)",
              border: "1px solid rgba(59,130,246,0.18)",
              color: "#1d4ed8",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>
              {fallbackLevel === 1 &&
                `No listings found in ${fallbackMeta.searchedSuburb}. Showing properties in the surrounding area (${fallbackMeta.postcode}).`}
              {fallbackLevel === 2 &&
                `No listings found in ${fallbackMeta.searchedSuburb}. Showing nearby properties within 10km.`}
              {fallbackLevel === 3 &&
                `No listings found in ${fallbackMeta.searchedSuburb}. Showing properties in ${STATE_DISPLAY[fallbackMeta.state ?? ""] ?? fallbackMeta.state}.`}
            </span>
          </div>
        )}

        {/* Results count + view toggle + save search */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <p className="text-sm text-text-muted">
            {total === 0
              ? "No properties found"
              : `Showing ${skip + 1}\u2013${Math.min(skip + PAGE_SIZE, total)} of ${total.toLocaleString()} ${total === 1 ? "property" : "properties"}`}
          </p>
          <div className="flex items-center gap-3">
            <ViewToggle currentView={params.view === "map" ? "map" : "list"} />
            <SaveSearchButton
              suburb={params.suburb}
              propertyType={params.propertyType}
              saleMethod={params.saleMethod}
              minPrice={params.minPrice}
              maxPrice={params.maxPrice}
              minBeds={params.minBeds}
              minBaths={params.minBaths}
              isLoggedIn={!!viewerId}
            />
          </div>
        </div>

        {/* Results grid / map */}
        {listings.length === 0 ? (
          (() => {
            const hasActiveFilters = !!(
              params.q || params.suburb || params.propertyType || params.saleMethod ||
              params.minPrice || params.maxPrice || params.minBeds || params.minBaths
            );
            return hasActiveFilters ? (
              <div className="text-center py-20">
                <p className="text-text-muted text-sm mb-4">
                  {params.suburb && fallbackLevel === 4
                    ? `No listings found near ${fallbackMeta.searchedSuburb}. New properties are added regularly.`
                    : "No properties match your search. Try adjusting your filters or broadening your search area."}
                </p>
                <Link
                  href="/listings"
                  className="inline-block bg-amber text-navy text-sm font-semibold px-5 py-2.5 rounded-[10px] hover:bg-amber/90 transition-colors"
                >
                  Clear all filters
                </Link>
              </div>
            ) : (
              <div className="text-center py-20 max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3
                  className="text-navy mb-2"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 22, fontWeight: 400 }}
                >
                  New listings coming soon
                </h3>
                <p className="text-text-muted text-sm mb-2 leading-relaxed">
                  TrueBid is launching in Western Australia. Properties will appear here as sellers go live.
                </p>
                <p className="text-text-muted text-sm mb-6 leading-relaxed">
                  Selling? List your property for free and be among the first on the platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/register"
                    className="inline-block bg-amber text-navy text-sm font-semibold px-5 py-2.5 rounded-[10px] hover:bg-amber/90 transition-colors"
                  >
                    List Your Property Free
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="inline-block border border-border text-text text-sm font-medium px-5 py-2.5 rounded-[10px] hover:bg-white transition-colors"
                  >
                    How it works
                  </Link>
                </div>
              </div>
            );
          })()
        ) : params.view === "map" ? (
          <MapViewClient
            listings={listings.map((listing) => ({
              id: listing.id,
              streetAddress: listing.streetAddress,
              suburb: listing.suburb,
              state: listing.state,
              status: listing.status,
              closingDate: listing.closingDate ? listing.closingDate.toISOString() : null,
              guidePriceCents: listing.guidePriceCents,
              latitude: listing.latitude,
              longitude: listing.longitude,
              bedrooms: listing.bedrooms,
              bathrooms: listing.bathrooms,
              coverImage: listing.images[0]
                ? { thumbnailUrl: listing.images[0].thumbnailUrl }
                : null,
            }))}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {listings.map((listing, index) => {
              const serialized = serializeListingAddress(
                {
                  id: listing.id,
                  streetAddress: listing.streetAddress,
                  suburb: listing.suburb,
                  state: listing.state,
                  postcode: listing.postcode,
                  latitude: listing.latitude,
                  longitude: listing.longitude,
                  addressVisibility: listing.addressVisibility as AddressVisibility,
                  hasInspectionSlots: listing._count.inspectionSlots > 0,
                },
                { userId: viewerId }
              );
              return (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  streetAddress={listing.streetAddress}
                  suburb={listing.suburb}
                  state={listing.state}
                  postcode={listing.postcode}
                  displayAddress={serialized.displayAddress}
                  addressRevealed={serialized.addressRevealed}
                  propertyType={listing.propertyType}
                  bedrooms={listing.bedrooms}
                  bathrooms={listing.bathrooms}
                  carSpaces={listing.carSpaces}
                  landSizeM2={listing.landSizeM2}
                  guidePriceCents={listing.guidePriceCents}
                  status={listing.status}
                  saleMethod={listing.saleMethod}
                  closingDate={listing.closingDate}
                  activeOfferCount={listing._count.offers}
                  coverImage={listing.images[0] ?? null}
                  priority={index === 0}
                />
              );
            })}
          </div>
        )}

        {/* Nearby listings: shown when exact suburb results exist and there are properties just outside */}
        {nearbyListings.length > 0 && page === 1 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-border" />
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                Also nearby: outside {params.suburb ?? params.q}
              </p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {nearbyListings.map((listing) => {
                const serialized = serializeListingAddress(
                  {
                    id: listing.id,
                    streetAddress: listing.streetAddress,
                    suburb: listing.suburb,
                    state: listing.state,
                    postcode: listing.postcode,
                    latitude: listing.latitude,
                    longitude: listing.longitude,
                    addressVisibility: listing.addressVisibility as AddressVisibility,
                    hasInspectionSlots: listing._count.inspectionSlots > 0,
                  },
                  { userId: viewerId }
                );
                return (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    streetAddress={listing.streetAddress}
                    suburb={listing.suburb}
                    state={listing.state}
                    postcode={listing.postcode}
                    displayAddress={serialized.displayAddress}
                    addressRevealed={serialized.addressRevealed}
                    propertyType={listing.propertyType}
                    bedrooms={listing.bedrooms}
                    bathrooms={listing.bathrooms}
                    carSpaces={listing.carSpaces}
                    landSizeM2={listing.landSizeM2}
                    guidePriceCents={listing.guidePriceCents}
                    saleMethod={listing.saleMethod}
                    closingDate={listing.closingDate}
                    activeOfferCount={listing._count.offers}
                    coverImage={listing.images[0] ?? null}
                    priority={false}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-1">
              {page > 1 && (
                <a
                  href={buildUrl(params, { page: String(page - 1) })}
                  className="px-4 py-2 text-sm font-medium text-text border border-border bg-white rounded-[10px] hover:bg-bg transition-colors"
                >
                  ← Previous
                </a>
              )}

              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const p = i + 1;
                return (
                  <a
                    key={p}
                    href={buildUrl(params, { page: String(p) })}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-[10px] transition-colors ${
                      p === page
                        ? "bg-navy text-white"
                        : "border border-border bg-white text-text hover:bg-bg"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}

              {page < totalPages && (
                <a
                  href={buildUrl(params, { page: String(page + 1) })}
                  className="px-4 py-2 text-sm font-medium text-text border border-border bg-white rounded-[10px] hover:bg-bg transition-colors"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

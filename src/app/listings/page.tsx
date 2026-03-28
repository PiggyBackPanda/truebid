import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Metadata } from "next";
import type { PropertyType, SaleMethod } from "@prisma/client";

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
  { value: "OPEN_OFFERS", label: "Open Offers" },
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const minPrice = params.minPrice;
  const maxPrice = params.maxPrice;
  const minBeds = params.minBeds ? parseInt(params.minBeds, 10) : undefined;
  const minBaths = params.minBaths ? parseInt(params.minBaths, 10) : undefined;
  const sort = params.sort ?? "newest";

  // Build Prisma where clause
  const where = {
    status: "ACTIVE" as const,
    ...(params.suburb ? { suburb: { contains: params.suburb, mode: "insensitive" as const } } : {}),
    ...(params.propertyType ? { propertyType: params.propertyType as PropertyType } : {}),
    ...(params.saleMethod ? { saleMethod: params.saleMethod as SaleMethod } : {}),
    ...(minBeds ? { bedrooms: { gte: minBeds } } : {}),
    ...(minBaths ? { bathrooms: { gte: minBaths } } : {}),
    ...(minPrice ? { guidePriceCents: { gte: parseInt(minPrice, 10) } } : {}),
    ...(maxPrice ? { guidePriceCents: { lte: parseInt(maxPrice, 10) } } : {}),
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

  const orderBy =
    sort === "price_asc"
      ? { guidePriceCents: "asc" as const }
      : sort === "price_desc"
      ? { guidePriceCents: "desc" as const }
      : sort === "closing_soon"
      ? { closingDate: "asc" as const }
      : { createdAt: "desc" as const };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy,
      select: {
        id: true,
        streetAddress: true,
        suburb: true,
        state: true,
        postcode: true,
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
          select: { offers: { where: { status: "ACTIVE" } } },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

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

            {/* Price Range — encode as minPrice/maxPrice */}
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

        {/* Results count */}
        <p className="text-sm text-text-muted mb-4">
          {total === 0
            ? "No properties found"
            : `Showing ${skip + 1}–${Math.min(skip + PAGE_SIZE, total)} of ${total.toLocaleString()} ${total === 1 ? "property" : "properties"}`}
        </p>

        {/* Results grid */}
        {listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm mb-4">
              No properties match your search. Try adjusting your filters or broadening your search area.
            </p>
            <Link
              href="/listings"
              className="inline-block bg-amber text-navy text-sm font-semibold px-5 py-2.5 rounded-[10px] hover:bg-amber/90 transition-colors"
            >
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {listings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                streetAddress={listing.streetAddress}
                suburb={listing.suburb}
                state={listing.state}
                postcode={listing.postcode}
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
                priority={index === 0}
              />
            ))}
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
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { PropertyImage } from "@/components/listings/PropertyImage";
import { getListingFallbackImage } from "@/lib/listing-images";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rankOffers } from "@/lib/offer-utils";
import { OfferBoard } from "@/components/listings/OfferBoard";
import { FavouriteButton } from "@/components/FavouriteButton";
import { WatchButton } from "@/components/listings/WatchButton";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ published?: string }>;
}

const PROPERTY_TYPE_LABELS_META: Record<string, string> = {
  HOUSE: "House", APARTMENT: "Apartment", TOWNHOUSE: "Townhouse",
  VILLA: "Villa", LAND: "Land", RURAL: "Rural property", OTHER: "Property",
};

const SALE_METHOD_LABELS_META: Record<string, string> = {
  OPEN_OFFERS: "Open Offers", PRIVATE_OFFERS: "Private Offers", FIXED_PRICE: "Fixed Price",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://truebid.com.au";

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      streetAddress: true,
      suburb: true,
      state: true,
      postcode: true,
      bedrooms: true,
      bathrooms: true,
      description: true,
      propertyType: true,
      saleMethod: true,
      guidePriceCents: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  });

  if (!listing) return { title: "Listing not found" };

  const address = `${listing.streetAddress}, ${listing.suburb} ${listing.state} ${listing.postcode}`;
  const title = `${address}`;
  const typeLabel = PROPERTY_TYPE_LABELS_META[listing.propertyType] ?? "Property";
  const methodLabel = SALE_METHOD_LABELS_META[listing.saleMethod] ?? "";
  const specs = [
    listing.bedrooms > 0 ? `${listing.bedrooms} bed` : null,
    listing.bathrooms > 0 ? `${listing.bathrooms} bath` : null,
  ].filter(Boolean).join(", ");

  const description = listing.description
    ? listing.description.slice(0, 155) + (listing.description.length > 155 ? "…" : "")
    : `${specs ? `${specs} ` : ""}${typeLabel} for sale via ${methodLabel} at ${address}. Listed on TrueBid — free, transparent property sales. No agent commissions.`;

  const url = `${baseUrl}/listings/${id}`;
  const ogImage = listing.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 800,
                alt: address,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

// ── Mapbox suburb centroid geocoding ─────────────────────────────────────────
// Always geocodes at suburb level — never uses the street address — to protect
// seller privacy on the public listing page.
async function getSuburbCentroid(
  suburb: string,
  state: string,
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  const query = encodeURIComponent(`${suburb} ${state} ${postcode} Australia`);
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?types=place,postcode&limit=1&country=AU&access_token=${token}`,
      { next: { revalidate: 86400 } } // cache suburb centroid for 24 h
    );
    if (!res.ok) return null;
    const data = await res.json() as { features?: Array<{ center: [number, number] }> };
    const center = data.features?.[0]?.center;
    if (!center) return null;
    return { lng: center[0], lat: center[1] };
  } catch {
    return null;
  }
}

// ── Nearby amenities ─────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

interface AmenityItem { name: string; distanceKm: number }
interface NearbyAmenities {
  schools: AmenityItem[];
  shops: AmenityItem[];
  transport: AmenityItem[];
}

async function searchNearbyPOI(
  query: string,
  lat: number,
  lng: number,
  token: string,
  limit = 3,
): Promise<AmenityItem[]> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
        `?proximity=${lng},${lat}&types=poi&limit=${limit}&country=AU&language=en&access_token=${token}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      features?: Array<{ text: string; center: [number, number] }>;
    };
    return (data.features ?? []).map((f) => ({
      name: f.text,
      distanceKm: haversineKm(lat, lng, f.center[1], f.center[0]),
    }));
  } catch {
    return [];
  }
}

async function getNearbyAmenities(
  lat: number,
  lng: number,
  token: string,
): Promise<NearbyAmenities> {
  const [schools, shops, trainStations, busStops] = await Promise.all([
    searchNearbyPOI("school", lat, lng, token),
    searchNearbyPOI("supermarket", lat, lng, token),
    searchNearbyPOI("train station", lat, lng, token),
    searchNearbyPOI("bus stop", lat, lng, token),
  ]);

  // Merge train + bus, deduplicate by name, sort by distance, take 3
  const seen = new Set<string>();
  const transport = [...trainStations, ...busStops]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .filter((item) => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    })
    .slice(0, 3);

  return { schools, shops, transport };
}

// ─────────────────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "House", APARTMENT: "Apartment", TOWNHOUSE: "Townhouse",
  VILLA: "Villa", LAND: "Land", RURAL: "Rural", OTHER: "Other",
};

const SALE_METHOD_LABELS: Record<string, string> = {
  OPEN_OFFERS: "Open Offers", PRIVATE_OFFERS: "Private Offers", FIXED_PRICE: "Fixed Price",
};

const SCHEMA_PROPERTY_TYPE: Record<string, string> = {
  HOUSE: "House", APARTMENT: "Apartment", TOWNHOUSE: "Townhouse",
  VILLA: "House", LAND: "LandForm", RURAL: "Residence", OTHER: "Residence",
};

export default async function ListingDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { published } = await searchParams;

  const session = await getServerSession(authOptions);
  const currentUser = session?.user as unknown as Record<string, unknown> | undefined;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
          displayOrder: true,
          mediaType: true,
        },
      },
      seller: {
        select: {
          id: true,
          firstName: true,
          publicAlias: true,
          verificationStatus: true,
        },
      },
      offers: {
        where: { isPublic: true },
        orderBy: [{ amountCents: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          amountCents: true,
          conditionType: true,
          conditionText: true,
          settlementDays: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          buyer: { select: { publicAlias: true } },
        },
      },
      _count: {
        select: { offers: { where: { status: "ACTIVE" } } },
      },
    },
  });

  if (!listing) notFound();

  const isOwner = currentUser?.id === listing.sellerId;
  if (listing.status === "DRAFT" && !isOwner) notFound();

  // Fetch initial favourite state for the logged-in user
  let initialFavourited = false;
  if (currentUser?.id) {
    try {
      const fav = await prisma.favourite.findUnique({
        where: {
          userId_listingId: {
            userId: currentUser.id as string,
            listingId: id,
          },
        },
        select: { id: true },
      });
      initialFavourited = !!fav;
    } catch {
      // Table may not exist yet — migration pending
    }
  }

  const features = (listing.features as string[] | null) ?? [];
  const photos = listing.images.filter((img) => img.mediaType === "photo");
  const floorplan = listing.images.find((img) => img.mediaType === "floorplan") ?? null;

  // Shape offers into PublicOffer format for the board
  const publicOffers = listing.saleMethod === "OPEN_OFFERS"
    ? rankOffers(
        listing.offers.map((o) => ({
          id: o.id,
          publicAlias: o.buyer.publicAlias,
          amountCents: o.amountCents,
          conditionType: o.conditionType,
          conditionText: o.conditionText,
          settlementDays: o.settlementDays,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        }))
      )
    : [];

  const isClosed =
    listing.status !== "ACTIVE" ||
    (listing.closingDate !== null && listing.closingDate < new Date());

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;
  const mapCentroid = await getSuburbCentroid(listing.suburb, listing.state, listing.postcode);
  const staticMapUrl =
    mapCentroid && mapboxToken
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+e8a838(${mapCentroid.lng},${mapCentroid.lat})/${mapCentroid.lng},${mapCentroid.lat},13,0/800x360@2x?access_token=${mapboxToken}`
      : null;
  const nearbyAmenities =
    mapCentroid && mapboxToken
      ? await getNearbyAmenities(mapCentroid.lat, mapCentroid.lng, mapboxToken)
      : null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://truebid.com.au";
  const canonicalUrl = `${baseUrl}/listings/${id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `${listing.streetAddress}, ${listing.suburb} ${listing.state}`,
    description: listing.description ?? undefined,
    url: canonicalUrl,
    ...(photos.length > 0
      ? { image: photos.slice(0, 6).map((p) => p.url) }
      : {}),
    ...(listing.guidePriceCents
      ? {
          offers: {
            "@type": "Offer",
            price: (listing.guidePriceCents / 100).toFixed(0),
            priceCurrency: "AUD",
            availability:
              listing.status === "ACTIVE"
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
          },
        }
      : {}),
    item: {
      "@type": SCHEMA_PROPERTY_TYPE[listing.propertyType] ?? "Residence",
      name: listing.streetAddress,
      address: {
        "@type": "PostalAddress",
        streetAddress: listing.streetAddress,
        addressLocality: listing.suburb,
        addressRegion: listing.state,
        postalCode: listing.postcode,
        addressCountry: "AU",
      },
      ...(listing.bedrooms > 0 ? { numberOfRooms: listing.bedrooms } : {}),
      ...(listing.bathrooms > 0
        ? { numberOfBathroomsTotal: listing.bathrooms }
        : {}),
      ...(listing.landSizeM2
        ? {
            floorSize: {
              "@type": "QuantitativeValue",
              value: listing.landSizeM2,
              unitCode: "MTK",
            },
          }
        : {}),
    },
  };

  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Published banner */}
      {published && (
        <div className="bg-green text-white text-sm font-medium text-center py-3 px-4">
          Your listing is now live! Buyers can view it and place offers.
        </div>
      )}

      {/* Draft banner */}
      {listing.status === "DRAFT" && isOwner && (
        <div className="bg-amber/10 border-b border-amber/30 text-sm font-medium text-amber-900 text-center py-3 px-4">
          This listing is a draft — only you can see it.{" "}
          <a href={`/listings/create/review?id=${id}`} className="underline hover:no-underline">
            Continue editing
          </a>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 120px" }}>
        {/* Photo gallery */}
        {photos.length > 0 ? (
          <>
            {/* Mobile: single hero image */}
            <div
              className="relative block md:hidden mt-4 rounded-lg overflow-hidden"
              style={{ height: 240 }}
            >
              <PropertyImage
                src={photos[0].url}
                alt={`${listing.streetAddress} — cover photo`}
                className="object-cover"
                priority
              />
            </div>

            {/* Desktop: multi-photo grid */}
            <div
              className="hidden md:grid grid-cols-4 gap-2 mt-6 rounded-[16px] overflow-hidden"
              style={{ height: 420 }}
            >
              <div className="relative col-span-2 row-span-2">
                <PropertyImage
                  src={photos[0].url}
                  alt={`${listing.streetAddress} — cover photo`}
                  className="object-cover"
                  priority
                />
              </div>
              {photos.slice(1, 5).map((img, i) => (
                <div key={img.id} className="relative overflow-hidden">
                  <PropertyImage
                    src={img.thumbnailUrl || img.url}
                    alt={`${listing.streetAddress} — photo ${i + 2}`}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div
            className="relative mt-4 md:mt-6 rounded-lg md:rounded-[16px] overflow-hidden"
            style={{ height: 240 }}
          >
            <PropertyImage
              src={getListingFallbackImage(id)}
              alt={`${listing.streetAddress} — cover photo`}
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Floor Plan */}
        <div className="mt-6 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: "#334766", flexShrink: 0 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <h2 className="text-base font-semibold text-navy">Floor Plan</h2>
          </div>

          {floorplan ? (
            floorplan.url.endsWith(".pdf") ? (
              <a
                href={floorplan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white border border-border rounded-[12px] px-5 py-4 hover:border-slate transition-colors"
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#e05252" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">View floor plan</p>
                  <p className="text-xs text-text-muted">PDF — opens in new tab</p>
                </div>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: "#9ca3af", marginLeft: 4 }}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            ) : (
              <div className="rounded-[12px] overflow-hidden border border-border bg-white">
                <img
                  src={floorplan.url}
                  alt={`Floor plan — ${listing.streetAddress}`}
                  style={{ width: "100%", display: "block", maxHeight: 480, objectFit: "contain", background: "#f7f5f0" }}
                />
              </div>
            )
          ) : (
            <div
              className="bg-white border border-border rounded-[12px] flex items-center justify-center gap-3"
              style={{ height: 100 }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ color: "#9ca3af" }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <p className="text-sm text-text-muted">Floor plan not provided</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-amber uppercase tracking-wide">
                  {PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-xs font-semibold text-green uppercase tracking-wide">
                  {SALE_METHOD_LABELS[listing.saleMethod] ?? listing.saleMethod}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif text-2xl text-navy mb-1">
                  {listing.streetAddress}
                </h1>
                <FavouriteButton listingId={id} initialFavourited={initialFavourited} />
              </div>
              <p className="text-base text-text-muted">
                {listing.suburb} {listing.state} {listing.postcode}
              </p>

              <div className="flex items-center gap-5 mt-4">
                {listing.bedrooms > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-text">
                    <span className="text-text-muted">🛏</span>
                    <strong>{listing.bedrooms}</strong> bed
                  </span>
                )}
                {listing.bathrooms > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-text">
                    <span className="text-text-muted">🚿</span>
                    <strong>{listing.bathrooms}</strong> bath
                  </span>
                )}
                {listing.carSpaces > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-text">
                    <span className="text-text-muted">🚗</span>
                    <strong>{listing.carSpaces}</strong> car
                  </span>
                )}
                {listing.landSizeM2 && (
                  <span className="flex items-center gap-1.5 text-sm text-text">
                    <span className="text-text-muted">📐</span>
                    <strong>{listing.landSizeM2.toLocaleString()}</strong> m²
                  </span>
                )}
              </div>
            </div>

            {/* Primary CTA — inline, visible without scrolling */}
            {!isOwner && (
              <div className="mb-8 flex gap-3">
                {listing.status === "ACTIVE" && !isClosed && (
                  <a
                    href={`/listings/${id}/offer`}
                    className="flex-1 block text-center bg-amber text-navy font-bold text-base py-4 rounded-[12px] hover:bg-amber-light transition-colors shadow-sm"
                  >
                    Place an Offer — Free
                  </a>
                )}
                <WatchButton
                  listingId={id}
                  isLoggedIn={!!currentUser}
                  initialWatched={initialFavourited}
                />
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-navy mb-3">About this property</h2>
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Location map */}
            {staticMapUrl && (
              <div className="mb-8">
                <h2 className="text-base font-semibold text-navy mb-3">Location</h2>
                <div
                  className="rounded-[12px] overflow-hidden border border-border"
                  style={{ height: 240 }}
                >
                  <img
                    src={staticMapUrl}
                    alt={`Map showing the approximate location of ${listing.suburb} ${listing.state}`}
                    className="w-full h-full object-cover block"
                  />
                </div>
                <p className="text-sm text-text-muted mt-2">
                  {listing.suburb} {listing.state} {listing.postcode}
                  <span className="text-text-light"> · Approximate location shown</span>
                </p>
              </div>
            )}

            {/* Nearby Amenities */}
            {nearbyAmenities &&
              (nearbyAmenities.schools.length > 0 ||
                nearbyAmenities.shops.length > 0 ||
                nearbyAmenities.transport.length > 0) && (
              <div className="mb-8">
                <h2 className="text-base font-semibold text-navy mb-3">Nearby Amenities</h2>
                <div className="bg-white border border-border rounded-[12px] overflow-hidden divide-y divide-border">

                  {nearbyAmenities.schools.length > 0 && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span>🎓</span> Schools
                      </p>
                      <ul className="space-y-2">
                        {nearbyAmenities.schools.map((item) => (
                          <li key={item.name} className="flex items-center justify-between gap-4">
                            <span className="text-sm text-text truncate">{item.name}</span>
                            <span className="text-xs text-text-muted shrink-0">{formatDistance(item.distanceKm)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nearbyAmenities.shops.length > 0 && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span>🛒</span> Shops & Supermarkets
                      </p>
                      <ul className="space-y-2">
                        {nearbyAmenities.shops.map((item) => (
                          <li key={item.name} className="flex items-center justify-between gap-4">
                            <span className="text-sm text-text truncate">{item.name}</span>
                            <span className="text-xs text-text-muted shrink-0">{formatDistance(item.distanceKm)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nearbyAmenities.transport.length > 0 && (
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span>🚆</span> Transport
                      </p>
                      <ul className="space-y-2">
                        {nearbyAmenities.transport.map((item) => (
                          <li key={item.name} className="flex items-center justify-between gap-4">
                            <span className="text-sm text-text truncate">{item.name}</span>
                            <span className="text-xs text-text-muted shrink-0">{formatDistance(item.distanceKm)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-semibold text-navy mb-3">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span key={f} className="px-3 py-1.5 bg-white border border-border rounded-full text-xs text-text">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Property facts */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-navy mb-3">Property facts</h2>
              <div className="bg-white border border-border rounded-[12px] divide-y divide-border">
                {([
                  { label: "Property type", value: PROPERTY_TYPE_LABELS[listing.propertyType] },
                  listing.buildingSizeM2 ? { label: "Building size", value: `${listing.buildingSizeM2.toLocaleString()} m²` } : null,
                  listing.landSizeM2 ? { label: "Land size", value: `${listing.landSizeM2.toLocaleString()} m²` } : null,
                  listing.yearBuilt ? { label: "Year built", value: String(listing.yearBuilt) } : null,
                  listing.publishedAt ? { label: "Listed", value: formatDate(listing.publishedAt) } : null,
                ] as Array<{ label: string; value: string } | null>).filter(Boolean).map((row) => (
                  <div key={row!.label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-text-muted">{row!.label}</span>
                    <span className="text-sm font-medium text-text">{row!.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Private Offers notice */}
            {listing.saleMethod === "PRIVATE_OFFERS" && !isOwner && listing.status === "ACTIVE" && (
              <div className="bg-white border border-border rounded-[12px] p-5 mb-8">
                <h2 className="text-base font-semibold text-navy mb-2">Private Offers</h2>
                <p className="text-sm text-text-muted mb-4">
                  This property is accepting private offers. Your offer will only be visible to the seller.
                </p>
                <a
                  href={`/listings/${id}/offer`}
                  className="inline-block bg-amber text-navy font-semibold text-sm px-5 py-2.5 rounded-[10px] hover:bg-amber-light transition-colors"
                >
                  Place a Private Offer
                </a>
              </div>
            )}

            {/* Fixed Price notice */}
            {listing.saleMethod === "FIXED_PRICE" && !isOwner && listing.status === "ACTIVE" && (
              <div className="bg-white border border-border rounded-[12px] p-5 mb-8">
                <p className="text-xs text-text-muted mb-1">Fixed Price</p>
                <p className="font-serif text-2xl text-navy mb-4">
                  {listing.guidePriceCents ? formatCurrency(listing.guidePriceCents) : "Contact for price"}
                </p>
                <a
                  href={`/listings/${id}/offer`}
                  className="inline-block bg-amber text-navy font-semibold text-sm px-5 py-2.5 rounded-[10px] hover:bg-amber-light transition-colors"
                >
                  Express Interest
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Open Offers board */}
              {listing.saleMethod === "OPEN_OFFERS" && (
                <OfferBoard
                  listingId={id}
                  initialOffers={publicOffers}
                  initialClosingDate={listing.closingDate?.toISOString() ?? null}
                  guidePriceCents={listing.guidePriceCents}
                  isOwner={isOwner}
                  isClosed={isClosed}
                />
              )}

              {/* Price card for non-OPEN_OFFERS or owner view */}
              {listing.saleMethod !== "OPEN_OFFERS" && (
                <div className="bg-white border border-border rounded-[16px] p-5 shadow-sm">
                  {listing.guidePriceCents ? (
                    <div className="mb-4">
                      <p className="text-xs text-text-muted mb-1">
                        {listing.saleMethod === "FIXED_PRICE" ? "Fixed price" : "Guide price"}
                      </p>
                      <p className="font-serif text-2xl text-navy">
                        {formatCurrency(listing.guidePriceCents)}
                        {listing.guideRangeMaxCents
                          ? ` – ${formatCurrency(listing.guideRangeMaxCents)}`
                          : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-xs text-text-muted mb-1">Offers invited</p>
                      <p className="font-serif text-xl text-navy">Contact for price</p>
                    </div>
                  )}

                  {listing.status === "ACTIVE" && !isOwner && listing.saleMethod !== "FIXED_PRICE" && (
                    <a
                      href={`/listings/${id}/offer`}
                      className="block w-full text-center bg-amber text-navy font-semibold text-sm py-3 rounded-[10px] hover:bg-amber/90 transition-colors"
                    >
                      Place an Offer
                    </a>
                  )}

                  {isOwner && (
                    <a
                      href="/dashboard"
                      className="block w-full text-center border border-border text-text-muted font-medium text-sm py-3 rounded-[10px] hover:bg-bg transition-colors"
                    >
                      View in dashboard
                    </a>
                  )}
                </div>
              )}

              {/* Owner tools */}
              {isOwner && listing.saleMethod === "OPEN_OFFERS" && (
                <a
                  href="/dashboard"
                  className="block w-full text-center border border-border text-text-muted font-medium text-sm py-3 rounded-[10px] hover:bg-bg transition-colors bg-white"
                >
                  View in dashboard
                </a>
              )}

              {/* Seller */}
              <div className="bg-white border border-border rounded-[16px] p-5">
                <p className="text-xs text-text-muted mb-3">Sold by owner</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy font-semibold text-sm">
                    {listing.seller.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{listing.seller.firstName}</p>
                    {listing.seller.verificationStatus === "VERIFIED" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#dcfce7",
                          color: "#15803d",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          marginTop: 2,
                        }}
                      >
                        ✓ Verified Seller
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA bar */}
      {!isOwner && listing.status === "ACTIVE" && !isClosed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-lg">
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px" }}>
            <a
              href={`/listings/${id}/offer`}
              className="block w-full text-center bg-amber text-navy font-bold text-base py-4 rounded-[12px] hover:bg-amber-light transition-colors"
            >
              Place an Offer — Free
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

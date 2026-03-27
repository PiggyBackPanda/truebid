import Image from "next/image";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { rankOffers } from "@/lib/offer-utils";
import { OfferBoard } from "@/components/listings/OfferBoard";
import { FavouriteButton } from "@/components/FavouriteButton";
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
              className="block md:hidden mt-4 rounded-lg overflow-hidden"
              style={{ height: 240 }}
            >
              <Image
                src={photos[0].url}
                alt={`${listing.streetAddress} — cover photo`}
                fill
                className="object-cover"
              />
            </div>

            {/* Desktop: multi-photo grid */}
            <div
              className="hidden md:grid grid-cols-4 gap-2 mt-6 rounded-[16px] overflow-hidden"
              style={{ height: 420 }}
            >
              <div className="col-span-2 row-span-2">
                <Image
                  src={photos[0].url}
                  alt={`${listing.streetAddress} — cover photo`}
                  fill
                  className="object-cover"
                />
              </div>
              {photos.slice(1, 5).map((img, i) => (
                <div key={img.id} className="overflow-hidden">
                  <Image
                    src={img.thumbnailUrl}
                    alt={`${listing.streetAddress} — photo ${i + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 md:mt-6 rounded-lg md:rounded-[16px] bg-border h-48 md:h-64 flex items-center justify-center">
            <span className="text-text-muted text-sm">No photos</span>
          </div>
        )}

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

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-navy mb-3">About this property</h2>
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

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
    </div>
  );
}

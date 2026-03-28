import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeListingAddress } from "@/lib/listing-serializer";
import type { AddressVisibility } from "@/lib/listing-serializer";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favourites | TrueBid",
};

type FavouritedListing = {
  id: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  addressVisibility: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  landSizeM2: number | null;
  guidePriceCents: number | null;
  saleMethod: string;
  closingDate: Date | null;
  status: string;
  images: { url: string; thumbnailUrl: string }[];
  _count: { offers: number; inspectionSlots: number };
};

export default async function FavouritesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/favourites");
  }

  const userId = (session.user as unknown as Record<string, unknown>).id as string;

  let listings: FavouritedListing[] = [];
  try {
    const favourites = await prisma.favourite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        listing: {
          select: {
            id: true,
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
            status: true,
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
          },
        },
      },
    });
    listings = favourites.map((f) => f.listing as FavouritedListing);
  } catch {
    // Table may not exist yet. Run: npm run db:migrate
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 28,
          color: "#0f1623",
          marginBottom: 8,
        }}
      >
        My Favourites
      </h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32, fontFamily: "var(--font-sans)" }}>
        {listings.length} saved {listings.length === 1 ? "listing" : "listings"}
      </p>

      {listings.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1.5"
            style={{ marginBottom: 16 }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p
            style={{
              fontSize: 18,
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "#0f1623",
              marginBottom: 8,
            }}
          >
            No saved listings yet
          </p>
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              fontFamily: "var(--font-sans)",
              marginBottom: 24,
            }}
          >
            Tap the heart on any listing to save it here.
          </p>
          <Link
            href="/listings"
            style={{
              background: "#f59e0b",
              color: "#1a0f00",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              padding: "10px 24px",
              borderRadius: 10,
            }}
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
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
              { userId }
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
                initialFavourited={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

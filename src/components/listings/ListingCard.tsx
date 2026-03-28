import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FavouriteButton } from "@/components/FavouriteButton";
import { PropertyImage } from "@/components/listings/PropertyImage";
import { getListingFallbackImage } from "@/lib/listing-images";
import { OfferWindowBadge } from "@/components/listings/OfferWindowBadge";

const SALE_METHOD_LABELS: Record<string, string> = {
  OPEN_OFFERS: "Live Offers",
  PRIVATE_OFFERS: "Private Offers",
  FIXED_PRICE: "Fixed Price",
};

interface ListingCardProps {
  id: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  /** Pre-serialised display address, used when address privacy rules apply */
  displayAddress?: string;
  /** Whether the full street address has been revealed to this viewer */
  addressRevealed?: boolean;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  landSizeM2: number | null;
  guidePriceCents: number | null;
  saleMethod: string;
  closingDate: Date | string | null;
  status?: string;
  activeOfferCount?: number;
  coverImage?: { url: string; thumbnailUrl: string } | null;
  initialFavourited?: boolean;
  priority?: boolean;
}

export function ListingCard({
  id,
  streetAddress,
  suburb,
  state,
  postcode,
  propertyType: _propertyType,
  bedrooms,
  bathrooms,
  carSpaces,
  landSizeM2,
  guidePriceCents,
  saleMethod,
  closingDate,
  status,
  activeOfferCount = 0,
  coverImage,
  initialFavourited = false,
  priority = false,
  displayAddress,
  addressRevealed,
}: ListingCardProps) {
  const isOpenOffers = saleMethod === "OPEN_OFFERS";
  const isComingSoon = status === "COMING_SOON";

  return (
    <Link
      href={`/listings/${id}`}
      className="block bg-white border border-border rounded-[16px] overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
    >
      {/* Photo */}
      <div className="relative" style={{ aspectRatio: "16/10" }}>
        <PropertyImage
          src={coverImage?.thumbnailUrl || coverImage?.url || getListingFallbackImage(id)}
          alt={`${streetAddress}, ${suburb}`}
          className="object-cover"
          priority={priority}
        />

        {/* Coming Soon banner */}
        {isComingSoon && (
          <div className="absolute inset-x-0 top-0 bg-navy/80 backdrop-blur-sm text-white text-xs font-semibold text-center py-1.5 tracking-wide">
            COMING SOON
          </div>
        )}

        {/* Open Offers live badge */}
        {isOpenOffers && !isComingSoon && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-navy">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {activeOfferCount} {activeOfferCount === 1 ? "offer" : "offers"}
            {closingDate && (
              <span className="text-text-muted font-normal">
                {" · "}Closes {formatDate(closingDate, { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        )}

        {/* Sale method badge */}
        <div className="absolute top-3 right-3 bg-navy/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {SALE_METHOD_LABELS[saleMethod] ?? saleMethod}
        </div>

        {/* Favourite button */}
        <div className="absolute bottom-3 right-3">
          <FavouriteButton listingId={id} initialFavourited={initialFavourited} />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        {/* Offer window status */}
        {status && (status === "ACTIVE" || status === "UNDER_OFFER" || status === "SOLD" || status === "COMING_SOON") && (
          <div className="mb-2">
            <OfferWindowBadge status={status} closingDate={closingDate ?? null} />
          </div>
        )}

        {guidePriceCents ? (
          <p className="font-serif text-lg text-navy leading-tight">
            {formatCurrency(guidePriceCents)}
          </p>
        ) : (
          <p className="font-serif text-base text-text-muted leading-tight">Contact for price</p>
        )}
        {addressRevealed === false ? (
          <p className="text-sm text-text-muted mt-0.5 truncate">{displayAddress}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-text mt-0.5 truncate">{streetAddress}</p>
            <p className="text-xs text-text-muted truncate">
              {suburb} {state} {postcode}
            </p>
          </>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          {bedrooms > 0 && (
            <span>
              <strong className="text-text">{bedrooms}</strong> bed
            </span>
          )}
          {bathrooms > 0 && (
            <span>
              <strong className="text-text">{bathrooms}</strong> bath
            </span>
          )}
          {carSpaces > 0 && (
            <span>
              <strong className="text-text">{carSpaces}</strong> car
            </span>
          )}
          {landSizeM2 && (
            <span>
              <strong className="text-text">{landSizeM2.toLocaleString()}</strong> m²
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Address serialisation — determines how much of a listing address to expose
 * based on the addressVisibility setting and who is viewing it.
 *
 * Address visibility rules:
 *
 * | Viewer                                 | PUBLIC | LOGGED_IN | BOOKED_ONLY |
 * |----------------------------------------|--------|-----------|-------------|
 * | Anonymous                              | full   | suburb    | suburb      |
 * | Logged in (any)                        | full   | full      | suburb      |
 * | Logged in (verified, booking/attended) | full   | full      | full        |
 * | Listing's own seller                   | full   | full      | full        |
 *
 * "suburb" means: suburb, state, postcode only — no street address.
 * Coordinates are fuzzed when the full address is hidden.
 */

import { fuzzCoordinates } from "./geo";

export type AddressVisibility = "PUBLIC" | "LOGGED_IN" | "BOOKED_ONLY";

export interface ListingAddressInput {
  id: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  addressVisibility: AddressVisibility;
  /** Whether this listing has any inspection slots configured */
  hasInspectionSlots?: boolean;
}

export interface ViewerContext {
  /** The viewer's user ID, if logged in */
  userId?: string;
  /** Whether the viewer is the listing's seller */
  isSeller?: boolean;
  /** Whether the viewer is identity-verified */
  isVerified?: boolean;
  /** Whether the viewer has an active booking (CONFIRMED or ATTENDED) for this listing */
  hasBooking?: boolean;
}

export interface SerializedAddress {
  /** Full street address, or null when hidden */
  streetAddress: string | null;
  suburb: string;
  state: string;
  postcode: string;
  /** The display-ready address string */
  displayAddress: string;
  /** Exact or fuzzed latitude */
  latitude: number | null;
  /** Exact or fuzzed longitude */
  longitude: number | null;
  /** Whether the full address has been revealed to this viewer */
  addressRevealed: boolean;
  /** The reason the address is locked (for UI messaging), or null if revealed */
  lockReason: "LOGIN_REQUIRED" | "BOOKING_REQUIRED" | null;
  addressVisibility: AddressVisibility;
}

export function serializeListingAddress(
  listing: ListingAddressInput,
  viewer: ViewerContext
): SerializedAddress {
  const canSeeFullAddress = resolveVisibility(listing, viewer);

  if (canSeeFullAddress) {
    return {
      streetAddress: listing.streetAddress,
      suburb: listing.suburb,
      state: listing.state,
      postcode: listing.postcode,
      displayAddress: `${listing.streetAddress}, ${listing.suburb} ${listing.state} ${listing.postcode}`,
      latitude: listing.latitude,
      longitude: listing.longitude,
      addressRevealed: true,
      lockReason: null,
      addressVisibility: listing.addressVisibility,
    };
  }

  // Suburb-only: fuzz the map pin
  const fuzzed =
    listing.latitude !== null && listing.longitude !== null
      ? fuzzCoordinates(listing.latitude, listing.longitude, listing.id)
      : null;

  const lockReason: "LOGIN_REQUIRED" | "BOOKING_REQUIRED" =
    !viewer.userId ? "LOGIN_REQUIRED" : "BOOKING_REQUIRED";

  return {
    streetAddress: null,
    suburb: listing.suburb,
    state: listing.state,
    postcode: listing.postcode,
    displayAddress: `${listing.suburb}, ${listing.state} ${listing.postcode}`,
    latitude: fuzzed?.lat ?? null,
    longitude: fuzzed?.lng ?? null,
    addressRevealed: false,
    lockReason,
    addressVisibility: listing.addressVisibility,
  };
}

function resolveVisibility(
  listing: ListingAddressInput,
  viewer: ViewerContext
): boolean {
  // Seller always sees full address
  if (viewer.isSeller) return true;

  const { addressVisibility, hasInspectionSlots } = listing;

  switch (addressVisibility) {
    case "PUBLIC":
      return true;

    case "LOGGED_IN":
      return !!viewer.userId;

    case "BOOKED_ONLY": {
      // If no slots are configured, fall back to LOGGED_IN behaviour
      if (!hasInspectionSlots) return !!viewer.userId;
      // Otherwise: require an active/attended booking
      return !!(viewer.userId && viewer.hasBooking);
    }
  }
}

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OfferForm } from "@/components/listings/OfferForm";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { streetAddress: true, suburb: true, state: true },
  });
  if (!listing) return { title: "Listing not found | TrueBid" };
  return {
    title: `Place an Offer: ${listing.streetAddress}, ${listing.suburb} | TrueBid`,
  };
}

export default async function PlaceOfferPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=/listings/${id}/offer`);
  }

  const user = session.user as {
    id: string;
    verificationStatus?: string;
  };

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      sellerId: true,
      status: true,
      saleMethod: true,
      closingDate: true,
      streetAddress: true,
      suburb: true,
      state: true,
      postcode: true,
      guidePriceCents: true,
      minOfferCents: true,
    },
  });

  if (!listing) notFound();

  // Owners can't place offers on their own listings
  if (listing.sellerId === user.id) {
    redirect(`/listings/${id}`);
  }

  if (listing.status !== "ACTIVE") {
    redirect(`/listings/${id}`);
  }

  if (listing.closingDate && listing.closingDate < new Date()) {
    redirect(`/listings/${id}`);
  }

  // Only OPEN_OFFERS and PRIVATE_OFFERS use this form
  if (listing.saleMethod === "FIXED_PRICE") {
    redirect(`/listings/${id}`);
  }

  const listingAddress = `${listing.streetAddress}, ${listing.suburb} ${listing.state} ${listing.postcode}`;

  return (
    <div className="min-h-screen bg-bg py-10">
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div className="mb-8">
          <a
            href={`/listings/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-navy transition-colors mb-4"
          >
            ← Back to listing
          </a>
          <h1 className="font-serif text-2xl text-navy mb-1">Place an Offer</h1>
          <p className="text-sm text-text-muted">
            {listing.saleMethod === "OPEN_OFFERS"
              ? "Your offer will appear publicly on the board (with a pseudonymous ID). You can increase or withdraw it at any time before closing."
              : "Your offer will be submitted privately. Only the seller can see it."}
          </p>
        </div>

        {/* Verification warning */}
        {user.verificationStatus !== "VERIFIED" && (
          <div className="bg-amber/10 border border-amber/30 rounded-lg px-4 py-3 mb-6">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              Identity verification required
            </p>
            <p className="text-xs text-text-muted mb-2">
              You must verify your identity before placing an offer.
            </p>
            <a
              href="/verify-identity"
              className="text-xs font-semibold text-amber underline hover:no-underline"
            >
              Verify Now
            </a>
          </div>
        )}

        {/* Platform disclaimer */}
        <p className="text-xs text-text-muted mb-6">
          TrueBid is a technology platform, not a licensed real estate agency. We recommend engaging a licensed conveyancer or settlement agent to manage your transaction.
        </p>

        <OfferForm
          listingId={id}
          listingAddress={listingAddress}
          guidePriceCents={listing.guidePriceCents}
          minOfferCents={listing.minOfferCents}
        />
      </div>
    </div>
  );
}

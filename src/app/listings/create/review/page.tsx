"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CreateListingProgress } from "@/components/listings/CreateListingProgress";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ListingData {
  id: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  landSizeM2: number | null;
  buildingSizeM2: number | null;
  yearBuilt: number | null;
  description: string;
  features: string[] | null;
  guidePriceCents: number | null;
  guideRangeMaxCents: number | null;
  saleMethod: string;
  closingDate: string | null;
  minOfferCents: number | null;
  requireDeposit: boolean;
  depositAmountCents: number | null;
  status: string;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    displayOrder: number;
    mediaType: string;
  }>;
  seller: {
    id: string;
    firstName: string;
    verificationStatus: string;
  };
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  TOWNHOUSE: "Townhouse",
  VILLA: "Villa",
  LAND: "Land",
  RURAL: "Rural",
  OTHER: "Other",
};

const SALE_METHOD_LABELS: Record<string, string> = {
  OPEN_OFFERS: "Live Offers",
  PRIVATE_OFFERS: "Private Offers",
  FIXED_PRICE: "Fixed Price",
};

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-[12px] overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-border bg-bg">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-text-muted w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-text font-medium flex-1">{value || "Not set"}</span>
    </div>
  );
}

function ReviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("id");

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dec1, setDec1] = useState(false);
  const [dec2, setDec2] = useState(false);
  const [dec3, setDec3] = useState(false);
  const [dec4, setDec4] = useState(false);
  const allDeclarationsChecked = dec1 && dec2 && dec3 && dec4;
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishError, setPublishError] = useState("");

  useEffect(() => {
    if (!listingId) {
      router.replace("/listings/create/details");
      return;
    }
    fetch(`/api/listings/${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.listing) setListing(data.listing);
        else setLoadError("Could not load listing details.");
      })
      .catch(() => setLoadError("Failed to load listing."))
      .finally(() => setLoading(false));
  }, [listingId, router]);

  async function handlePublish(mode: "coming_soon" | "active") {
    if (!agreed) return;
    setSubmitting(true);
    setPublishError("");

    try {
      const now = new Date().toISOString();
      const res = await fetch(`/api/listings/${listingId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ownerDeclarationAt: now,
          ownerDeclarationData: {
            checkbox1AcceptedAt: now,
            checkbox2AcceptedAt: now,
            checkbox3AcceptedAt: now,
            checkbox4AcceptedAt: now,
          },
        }),
      });
      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setPublishError(data.error ?? "Failed to publish listing.");
        return;
      }

      router.push(`/listings/${listingId}?published=true`);
    } catch {
      setPublishError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const features = Array.isArray(listing?.features) ? listing.features : [];

  return (
    <div>
      <CreateListingProgress listingId={listingId ?? undefined} />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 className="font-serif text-2xl text-navy mb-1">Review & publish</h1>
        <p className="text-sm text-text-muted mb-8">
          Check everything looks right before publishing. Once live, buyers can view and place offers.
        </p>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {loadError && (
          <div className="bg-red/10 border border-red/30 rounded-[10px] px-4 py-3 text-sm text-red">
            {loadError}
          </div>
        )}

        {listing && !loading && (
          <>
            {/* Verification warning */}
            {listing.seller.verificationStatus !== "VERIFIED" && (
              <div className="bg-amber/10 border border-amber/40 rounded-[12px] px-5 py-4 mb-6">
                <div className="flex gap-3 items-start">
                  <span className="text-amber text-xl mt-0.5">⚠</span>
                  <div>
                    <p className="text-sm font-semibold text-navy mb-1">Identity verification required</p>
                    <p className="text-sm text-text-muted mb-3">
                      You need to verify your identity before you can publish a listing. This protects buyers and ensures TrueBid remains trustworthy.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/verify-identity?returnTo=${encodeURIComponent(`/listings/create/review?id=${listingId}`)}`)}
                    >
                      Verify my identity
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Photo preview */}
            {listing.images.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-2 rounded-[12px] overflow-hidden">
                  {listing.images
                    .filter((img) => img.mediaType === "photo")
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .slice(0, 4)
                    .map((img, i) => (
                      <div key={img.id} className={`relative aspect-square bg-bg ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                        <Image
                          src={img.url}
                          alt={`Photo ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                </div>
                <p className="text-xs text-text-muted mt-2 text-right">
                  {listing.images.filter((i) => i.mediaType === "photo").length} photo
                  {listing.images.filter((i) => i.mediaType === "photo").length !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {listing.images.length === 0 && (
              <div className="bg-red/10 border border-red/30 rounded-[10px] px-4 py-3 text-sm text-red mb-4">
                No photos uploaded. At least one photo is required to publish.{" "}
                <button
                  type="button"
                  onClick={() => router.push(`/listings/create/photos?id=${listingId}`)}
                  className="underline hover:no-underline"
                >
                  Add photos
                </button>
              </div>
            )}

            {/* Property details */}
            <ReviewSection title="Property details">
              <ReviewRow label="Address" value={`${listing.streetAddress}, ${listing.suburb} ${listing.state} ${listing.postcode}`} />
              <ReviewRow label="Type" value={PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType} />
              <ReviewRow label="Bedrooms / Baths / Cars" value={`${listing.bedrooms} bed · ${listing.bathrooms} bath · ${listing.carSpaces} car`} />
              {listing.landSizeM2 && <ReviewRow label="Land size" value={`${listing.landSizeM2.toLocaleString()} m²`} />}
              {listing.buildingSizeM2 && <ReviewRow label="Building size" value={`${listing.buildingSizeM2.toLocaleString()} m²`} />}
              {listing.yearBuilt && <ReviewRow label="Year built" value={String(listing.yearBuilt)} />}
              {features.length > 0 && (
                <ReviewRow
                  label="Features"
                  value={
                    <div className="flex flex-wrap gap-1.5">
                      {features.map((f: string) => (
                        <span key={f} className="px-2 py-0.5 bg-bg text-text rounded-full text-xs border border-border">
                          {f}
                        </span>
                      ))}
                    </div>
                  }
                />
              )}
            </ReviewSection>

            {/* Description */}
            <ReviewSection title="Description">
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{listing.description}</p>
            </ReviewSection>

            {/* Sale method */}
            <ReviewSection title="Sale method">
              <ReviewRow label="Method" value={SALE_METHOD_LABELS[listing.saleMethod] ?? listing.saleMethod} />
              {listing.closingDate && (
                <ReviewRow label="Closing date" value={formatDate(new Date(listing.closingDate))} />
              )}
              {listing.guidePriceCents && (
                <ReviewRow
                  label="Guide price"
                  value={
                    listing.guideRangeMaxCents
                      ? `${formatCurrency(listing.guidePriceCents)} – ${formatCurrency(listing.guideRangeMaxCents)}`
                      : formatCurrency(listing.guidePriceCents)
                  }
                />
              )}
              {listing.minOfferCents && (
                <ReviewRow label="Min offer threshold" value={formatCurrency(listing.minOfferCents)} />
              )}
              {listing.requireDeposit && (
                <ReviewRow
                  label="Holding deposit"
                  value={listing.depositAmountCents ? formatCurrency(listing.depositAmountCents) : "Required"}
                />
              )}
            </ReviewSection>

            {listing.status === "ACTIVE" ? (
              /* Active listing: confirm changes before going live */
              <>
                <div className="bg-navy/5 border border-navy/15 rounded-[12px] p-5 mb-6">
                  <h3 className="text-sm font-semibold text-navy mb-2">Confirm your changes</h3>
                  <p className="text-sm text-text-muted mb-4">
                    Your listing is currently live and accepting offers. Changes confirmed here will go live immediately and be visible to all buyers.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 accent-amber mt-0.5 flex-shrink-0"
                    />
                    <span className="text-sm text-text font-medium">
                      I confirm these changes are accurate and I&apos;m happy for them to go live immediately.
                    </span>
                  </label>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      onClick={() => handlePublish("active")}
                      disabled={!agreed}
                      loading={submitting}
                      className="flex-1"
                    >
                      Confirm &amp; Update Listing
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => router.push(`/listings/create/method?id=${listingId}`)}
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/listings/${listingId}`)}
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      Discard Changes
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Draft / Coming Soon: publish flow */
              <>
                {/* Portal reach notice */}
                <div className="bg-bg border border-border rounded-[10px] px-4 py-3 text-sm text-text-muted mb-6">
                  Your listing will appear on TrueBid only. It will not be listed on realestate.com.au or Domain. Make sure you are comfortable with your marketing reach before publishing.
                </div>

                {/* Seller ownership declaration */}
                <div className="bg-navy/5 border border-navy/15 rounded-[12px] p-5 mb-4">
                  <h3 className="text-sm font-semibold text-navy mb-3">Before you publish</h3>

                  {/* Information panel */}
                  <div className="bg-amber/8 border border-amber/25 rounded-[10px] px-4 py-3 mb-4 text-sm text-navy leading-relaxed">
                    <p>
                      Before listing your property, please confirm the following.
                      TrueBid is not a licensed real estate agency and does not provide legal, financial, or conveyancing advice.
                      As a private seller, you are responsible for complying with all applicable laws.
                      We recommend engaging a licensed settlement agent or conveyancer before proceeding with any offer.
                    </p>
                    <p className="mt-2">
                      Find a licensed settlement agent at the Settlement Agents Supervisory Board:{" "}
                      <a
                        href="https://www.sasb.wa.gov.au"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline text-amber-900"
                      >
                        www.sasb.wa.gov.au
                      </a>
                    </p>
                  </div>

                  {/* Individual declarations */}
                  <div className="space-y-3">
                    {[
                      {
                        checked: dec1,
                        setter: setDec1,
                        label: "I am the registered proprietor of this property, or I have written authority from the registered proprietor to list this property for sale.",
                      },
                      {
                        checked: dec2,
                        setter: setDec2,
                        label: "I understand that TrueBid is a marketplace platform only. TrueBid does not provide legal advice, act as my agent, prepare contracts of sale, or handle deposits or settlement.",
                      },
                      {
                        checked: dec3,
                        setter: setDec3,
                        label: "I confirm that all information I provide in this listing is accurate and not misleading, and I am solely responsible for its accuracy.",
                      },
                      {
                        checked: dec4,
                        setter: setDec4,
                        label: "I understand that as a private seller, I am responsible for my own legal obligations in relation to this sale, including disclosing material facts about the property to potential buyers.",
                      },
                    ].map(({ checked, setter, label }, i) => (
                      <label key={i} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setter(e.target.checked)}
                          className="w-4 h-4 accent-amber mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-text leading-relaxed">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Free period disclaimer */}
                <div className="bg-bg border border-border rounded-[10px] px-4 py-3 text-sm text-text-muted mb-6">
                  <strong className="text-navy">Listing fees:</strong>{" "}
                  Listing is free during TrueBid&apos;s launch period. Fees will be introduced in the future with advance notice.
                  Any listings active at the time of the fee change will complete their current listing period at no charge.
                </div>

                {/* Confirmation checkbox — only enabled once declarations are all checked */}
                <div className="bg-navy/5 border border-navy/15 rounded-[12px] p-5 mb-6">
                  <label className={`flex items-start gap-3 ${allDeclarationsChecked ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      disabled={!allDeclarationsChecked}
                      className="w-4 h-4 accent-amber mt-0.5 flex-shrink-0"
                    />
                    <span className="text-sm text-text font-medium">
                      I have read and confirmed all declarations above and I am ready to publish.
                    </span>
                  </label>
                  {!allDeclarationsChecked && (
                    <p className="text-xs text-text-muted mt-2 ml-7">
                      Please check all four declarations before confirming.
                    </p>
                  )}
                </div>

                {publishError && (
                  <div className="bg-red/10 border border-red/30 rounded-[10px] px-4 py-3 text-sm text-red mb-4">
                    {publishError}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {listing.status === "DRAFT" && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handlePublish("coming_soon")}
                        disabled={!agreed || listing.seller.verificationStatus !== "VERIFIED" || listing.images.length === 0}
                        loading={submitting}
                        className="flex-1"
                      >
                        Publish as Coming Soon
                      </Button>
                    )}
                    <Button
                      size="lg"
                      onClick={() => handlePublish("active")}
                      disabled={!agreed || listing.seller.verificationStatus !== "VERIFIED" || listing.images.length === 0 || submitting}
                      loading={listing.status !== "DRAFT" ? submitting : false}
                      className="flex-1"
                    >
                      {listing.status === "COMING_SOON" ? "Go Live: Open for Offers Now" : "Publish as Active (Open for Offers Now)"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => router.push(`/listings/create/method?id=${listingId}`)}
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="text-sm text-text-muted hover:text-text transition-colors"
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewForm />
    </Suspense>
  );
}

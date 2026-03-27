"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CreateListingProgress } from "@/components/listings/CreateListingProgress";

type SaleMethod = "OPEN_OFFERS" | "PRIVATE_OFFERS" | "FIXED_PRICE";

function formatDateForInput(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function dollarsToCents(dollars: string): number | undefined {
  const n = parseFloat(dollars.replace(/,/g, ""));
  return isNaN(n) ? undefined : Math.round(n * 100);
}

function MethodCard({
  title,
  badge,
  description,
  selected,
  onClick,
}: {
  title: string;
  badge?: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[12px] border-2 p-5 transition-all ${
        selected
          ? "border-amber bg-amber/5"
          : "border-border bg-white hover:border-slate"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base font-semibold text-navy">{title}</span>
        {badge && (
          <span className="bg-amber text-navy text-xs font-semibold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {selected && (
          <span className="ml-auto text-amber">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" stroke="none"/>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
    </button>
  );
}

function MethodForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("id");

  const [method, setMethod] = useState<SaleMethod>("OPEN_OFFERS");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Open Offers fields
  const [closingDate, setClosingDate] = useState(formatDateForInput(28));
  const [guidePriceFrom, setGuidePriceFrom] = useState("");
  const [guidePriceTo, setGuidePriceTo] = useState("");
  const [minOffer, setMinOffer] = useState("");
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  // Private Offers fields
  const [privateGuidePrice, setPrivateGuidePrice] = useState("");
  const [privateClosingDate, setPrivateClosingDate] = useState("");

  // Fixed Price fields
  const [fixedPrice, setFixedPrice] = useState("");

  useEffect(() => {
    if (!listingId) router.replace("/listings/create/details");
  }, [listingId, router]);

  async function handleSubmit() {
    setErrors({});
    const newErrors: Record<string, string> = {};
    const minDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    if (method === "OPEN_OFFERS") {
      if (!closingDate) {
        newErrors.closingDate = "Closing date is required for Open Offers";
      } else if (new Date(closingDate) < minDate) {
        newErrors.closingDate = "Closing date must be at least 14 days from today";
      }
    }

    if (method === "FIXED_PRICE" && !fixedPrice) {
      newErrors.fixedPrice = "Price is required for Fixed Price listings";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    const body: Record<string, unknown> = { saleMethod: method };

    if (method === "OPEN_OFFERS") {
      body.closingDate = new Date(closingDate).toISOString();
      const fromCents = dollarsToCents(guidePriceFrom);
      const toCents = dollarsToCents(guidePriceTo);
      if (fromCents) body.guidePriceCents = fromCents;
      if (toCents) body.guideRangeMaxCents = toCents;
      const minCents = dollarsToCents(minOffer);
      if (minCents) body.minOfferCents = minCents;
      body.requireDeposit = requireDeposit;
      if (requireDeposit) {
        const depCents = dollarsToCents(depositAmount);
        if (depCents) body.depositAmountCents = depCents;
      }
    } else if (method === "PRIVATE_OFFERS") {
      const guideCents = dollarsToCents(privateGuidePrice);
      if (guideCents) body.guidePriceCents = guideCents;
      if (privateClosingDate) body.closingDate = new Date(privateClosingDate).toISOString();
    } else if (method === "FIXED_PRICE") {
      const priceCents = dollarsToCents(fixedPrice);
      if (priceCents) body.guidePriceCents = priceCents;
    }

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ form: data.error ?? "Failed to save" });
        return;
      }

      router.push(`/listings/create/review?id=${listingId}`);
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <CreateListingProgress listingId={listingId ?? undefined} />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 className="font-serif text-2xl text-navy mb-1">Sale method</h1>
        <p className="text-sm text-text-muted mb-8">Choose how you want to receive offers from buyers.</p>

        {errors.form && (
          <div className="bg-red/10 border border-red/30 rounded-[10px] px-4 py-3 text-sm text-red mb-6">
            {errors.form}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-8">
          <MethodCard
            title="Open Offers"
            badge="Recommended"
            description="Transparent public bidding with a closing date. All buyers see every offer — price, conditions, and timing. Creates competitive tension and typically achieves the best price."
            selected={method === "OPEN_OFFERS"}
            onClick={() => setMethod("OPEN_OFFERS")}
          />

          <MethodCard
            title="Private Offers"
            description="Buyers submit offers privately. Only you see them. More traditional approach, suitable for sensitive sales or high-end properties."
            selected={method === "PRIVATE_OFFERS"}
            onClick={() => setMethod("PRIVATE_OFFERS")}
          />

          <MethodCard
            title="Fixed Price"
            description="Set a firm price. Interested buyers express interest at your asking price. Simple and fast."
            selected={method === "FIXED_PRICE"}
            onClick={() => setMethod("FIXED_PRICE")}
          />
        </div>

        {/* Open Offers fields */}
        {method === "OPEN_OFFERS" && (
          <div className="bg-white border border-border rounded-[12px] p-6 flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-navy">Open Offers settings</h3>

            <div>
              <label className="text-sm font-medium text-text block mb-1.5">
                Closing date <span className="text-red ml-1" aria-hidden>*</span>
              </label>
              <input
                type="date"
                value={closingDate}
                min={formatDateForInput(14)}
                onChange={(e) => setClosingDate(e.target.value)}
                className={`w-full bg-white border rounded-[10px] px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 transition-colors ${
                  errors.closingDate
                    ? "border-red focus:border-red focus:ring-red/20"
                    : "border-border focus:ring-sky/20 focus:border-sky"
                }`}
              />
              {errors.closingDate ? (
                <p className="text-xs text-red mt-1">{errors.closingDate}</p>
              ) : (
                <p className="text-xs text-text-muted mt-1">
                  We recommend 28 days to give buyers time to arrange finance and inspections.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Guide price (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="From $ e.g. 800,000"
                  value={guidePriceFrom}
                  onChange={(e) => setGuidePriceFrom(e.target.value)}
                />
                <Input
                  placeholder="To $ e.g. 900,000"
                  value={guidePriceTo}
                  onChange={(e) => setGuidePriceTo(e.target.value)}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">Leave blank to hide guide price from buyers.</p>
            </div>

            <div>
              <Input
                label="Minimum offer threshold (optional)"
                placeholder="e.g. 750,000"
                value={minOffer}
                onChange={(e) => setMinOffer(e.target.value)}
                hint="Offers below this amount won't appear on the public board, but you'll still see them in your dashboard."
              />
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireDeposit}
                  onChange={(e) => setRequireDeposit(e.target.checked)}
                  className="w-4 h-4 accent-amber"
                />
                <span className="text-sm font-medium text-text">Require holding deposit</span>
              </label>
              {requireDeposit && (
                <div className="mt-3">
                  <Input
                    label="Deposit amount ($)"
                    placeholder="e.g. 10,000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    hint="Buyers placing offers will be asked to provide a deposit receipt."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Private Offers fields */}
        {method === "PRIVATE_OFFERS" && (
          <div className="bg-white border border-border rounded-[12px] p-6 flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-navy">Private Offers settings</h3>

            <Input
              label="Guide price (optional)"
              placeholder="e.g. 850,000"
              value={privateGuidePrice}
              onChange={(e) => setPrivateGuidePrice(e.target.value)}
            />

            <div>
              <label className="text-sm font-medium text-text block mb-1.5">
                Deadline (optional)
              </label>
              <input
                type="date"
                value={privateClosingDate}
                onChange={(e) => setPrivateClosingDate(e.target.value)}
                className="w-full bg-white border border-border rounded-[10px] px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
              />
              <p className="text-xs text-text-muted mt-1">Set a deadline for yourself, or leave open.</p>
            </div>
          </div>
        )}

        {/* Fixed Price fields */}
        {method === "FIXED_PRICE" && (
          <div className="bg-white border border-border rounded-[12px] p-6">
            <h3 className="text-sm font-semibold text-navy mb-4">Fixed Price settings</h3>
            <Input
              label="Asking price ($)"
              placeholder="e.g. 895,000"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              error={errors.fixedPrice}
              hint="Buyers will be able to express interest at this price through the messaging system."
              required
            />
          </div>
        )}

        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => router.push(`/listings/create/photos?id=${listingId}`)}
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            ← Back
          </button>
          <Button size="lg" onClick={handleSubmit} loading={submitting}>
            Continue to Review →
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MethodPage() {
  return (
    <Suspense>
      <MethodForm />
    </Suspense>
  );
}

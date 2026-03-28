"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

const CONDITION_OPTIONS = [
  { value: "UNCONDITIONAL",            label: "Unconditional" },
  { value: "SUBJECT_TO_FINANCE",       label: "Subject to finance" },
  { value: "SUBJECT_TO_BUILDING_PEST", label: "Subject to building & pest inspection" },
  { value: "SUBJECT_TO_BOTH",          label: "Subject to finance and building & pest" },
  { value: "SUBJECT_TO_SALE",          label: "Subject to sale of another property" },
  { value: "OTHER",                    label: "Other (describe below)" },
] as const;

const SETTLEMENT_OPTIONS = [14, 21, 30, 45, 60, 90, 120] as const;

interface UpcomingSlot {
  id: string;
  startTime: string;
  endTime: string;
  spotsRemaining: number;
}

interface ViewerInspectionStatus {
  hasInspected: boolean;
  hasUpcomingBooking: boolean;
  upcomingBookingSlot: { id: string; startTime: string; endTime: string } | null;
}

interface OfferFormProps {
  listingId: string;
  listingAddress: string;
  guidePriceCents?: number | null;
  minOfferCents?: number | null;
  requireInspection?: boolean;
  viewerInspectionStatus?: ViewerInspectionStatus | null;
  upcomingSlots?: UpcomingSlot[];
}

function formatSlotTimeShort(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end   = new Date(endIso);
  const date  = start.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Perth" });
  const startT = start.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  const endT   = end.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  return `${date} · ${startT} – ${endT}`;
}

export function OfferForm({
  listingId,
  listingAddress,
  guidePriceCents,
  minOfferCents,
  requireInspection = false,
  viewerInspectionStatus = null,
  upcomingSlots = [],
}: OfferFormProps) {
  const router = useRouter();

  const [amountDollars, setAmountDollars] = useState("");
  const [conditionType, setConditionType] = useState("UNCONDITIONAL");
  const [conditionText, setConditionText] = useState("");
  const [settlementDays, setSettlementDays] = useState(30);
  const [personalNote, setPersonalNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amountCents = Math.round(parseFloat(amountDollars.replace(/,/g, "")) * 100) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (amountCents <= 0) {
      setError("Please enter a valid offer amount.");
      return;
    }

    if (conditionType === "OTHER" && !conditionText.trim()) {
      setError("Please describe the conditions for your offer.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          amountCents,
          conditionType,
          conditionText: conditionType === "OTHER" ? conditionText : undefined,
          settlementDays,
          personalNote: personalNote.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.code === "OFFER_EXISTS") {
          setError("You already have an active offer on this listing. To increase your offer, visit the listing page.");
        } else if (json.code === "BELOW_MINIMUM") {
          setError(
            `Your offer is below the minimum of ${
              json.details?.minOfferCents
                ? formatCurrency(json.details.minOfferCents)
                : "the required amount"
            }.`
          );
        } else if (json.code === "LISTING_CLOSED") {
          setError("The offer period for this listing has closed.");
        } else if (json.code === "VERIFICATION_REQUIRED") {
          setError("You must verify your identity before placing an offer.");
        } else {
          setError(json.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setSuccess(true);
      // Redirect to the listing page after a short delay
      setTimeout(() => {
        router.push(`/listings/${listingId}`);
        router.refresh();
      }, 1500);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-bg border border-green/20 rounded-lg p-6 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h2 className="font-serif text-navy text-xl mb-2">Offer placed!</h2>
        <p className="text-text-muted text-sm">
          Your offer of <strong>{formatCurrency(amountCents)}</strong> has been submitted.
          Redirecting you back to the listing…
        </p>
      </div>
    );
  }

  // Inspection gate — show locked state if seller requires inspection and buyer hasn't attended
  if (requireInspection && viewerInspectionStatus && !viewerInspectionStatus.hasInspected) {
    const { hasUpcomingBooking, upcomingBookingSlot } = viewerInspectionStatus;

    return (
      <div className="border border-amber/30 rounded-lg overflow-hidden">
        <div className="bg-amber/8 px-4 py-3 border-b border-amber/20 flex items-center gap-2">
          <span className="text-amber text-base" aria-hidden="true">🔒</span>
          <span className="text-sm font-semibold text-navy">Inspection Required</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-text-muted">
            The seller requires you to attend an inspection before placing an offer.
          </p>

          {hasUpcomingBooking && upcomingBookingSlot ? (
            <div className="bg-green-bg border border-green/20 rounded-lg px-3 py-2.5">
              <p className="text-xs text-green font-medium mb-0.5">Inspection booked</p>
              <p className="text-sm text-navy">
                {formatSlotTimeShort(upcomingBookingSlot.startTime, upcomingBookingSlot.endTime)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Your offer form will unlock once you have attended.
              </p>
            </div>
          ) : upcomingSlots.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                Next available inspections
              </p>
              {upcomingSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-navy">
                    {formatSlotTimeShort(slot.startTime, slot.endTime)}
                  </span>
                  <span className="text-text-muted text-xs">
                    {slot.spotsRemaining} spot{slot.spotsRemaining !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              No upcoming inspections are scheduled. Save this listing to be notified when new inspections are added.
            </p>
          )}

          {!hasUpcomingBooking && (
            <a
              href={`/listings/${listingId}#inspections`}
              className="block w-full text-center bg-navy text-white font-semibold text-sm py-3 rounded-[10px] hover:bg-navy/90 transition-colors mt-2"
            >
              Book an Inspection
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address context */}
      <div className="bg-white border border-border rounded-lg px-4 py-3">
        <p className="text-xs text-text-muted mb-0.5">Placing offer on</p>
        <p className="text-sm font-semibold text-navy">{listingAddress}</p>
        {guidePriceCents && (
          <p className="text-xs text-text-muted mt-0.5">
            Guide price: {formatCurrency(guidePriceCents)}
          </p>
        )}
        {minOfferCents && (
          <p className="text-xs text-amber mt-0.5">
            Minimum offer: {formatCurrency(minOfferCents)}
          </p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-semibold text-navy mb-1.5"
        >
          Offer amount (AUD)
          <span className="text-red ml-1">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">
            $
          </span>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            required
            value={amountDollars}
            onChange={(e) => {
              // Allow digits and commas only
              const v = e.target.value.replace(/[^\d,]/g, "");
              setAmountDollars(v);
            }}
            placeholder="e.g. 820,000"
            className="w-full pl-7 pr-3 py-2.5 border border-border rounded-[10px] text-sm text-navy focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent"
          />
        </div>
        {amountCents > 0 && (
          <p className="text-xs text-text-muted mt-1">
            {formatCurrency(amountCents)}
          </p>
        )}
      </div>

      {/* Conditions */}
      <div>
        <label
          htmlFor="conditionType"
          className="block text-sm font-semibold text-navy mb-1.5"
        >
          Offer conditions
          <span className="text-red ml-1">*</span>
        </label>
        <select
          id="conditionType"
          value={conditionType}
          onChange={(e) => setConditionType(e.target.value)}
          className="w-full px-3 py-2.5 border border-border rounded-[10px] text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-amber"
        >
          {CONDITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {conditionType === "OTHER" && (
          <textarea
            value={conditionText}
            onChange={(e) => setConditionText(e.target.value)}
            placeholder="Describe your conditions (max 500 characters)"
            maxLength={500}
            rows={3}
            className="mt-2 w-full px-3 py-2.5 border border-border rounded-[10px] text-sm text-navy focus:outline-none focus:ring-2 focus:ring-amber resize-none"
          />
        )}
      </div>

      {/* Settlement */}
      <div>
        <label
          htmlFor="settlement"
          className="block text-sm font-semibold text-navy mb-1.5"
        >
          Settlement period
          <span className="text-red ml-1">*</span>
        </label>
        <select
          id="settlement"
          value={settlementDays}
          onChange={(e) => setSettlementDays(Number(e.target.value))}
          className="w-full px-3 py-2.5 border border-border rounded-[10px] text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-amber"
        >
          {SETTLEMENT_OPTIONS.map((days) => (
            <option key={days} value={days}>
              {days} days
            </option>
          ))}
        </select>
        <p className="text-[11px] text-text-muted mt-1">
          Shorter settlement periods are often preferred by sellers.
        </p>
      </div>

      {/* Personal note */}
      <div>
        <label
          htmlFor="note"
          className="block text-sm font-semibold text-navy mb-1.5"
        >
          Personal note to seller{" "}
          <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="note"
          value={personalNote}
          onChange={(e) => setPersonalNote(e.target.value)}
          placeholder="Tell the seller something about yourself or why you love this property…"
          maxLength={1000}
          rows={4}
          className="w-full px-3 py-2.5 border border-border rounded-[10px] text-sm text-navy focus:outline-none focus:ring-2 focus:ring-amber resize-none"
        />
        <p className="text-[11px] text-text-muted mt-1 text-right">
          {personalNote.length} / 1000
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red/10 border border-red/20 text-red text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-amber text-navy font-semibold text-sm py-3.5 rounded-[10px] hover:bg-amber-light transition-colors focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting…" : `Submit Offer${amountCents > 0 ? `: ${formatCurrency(amountCents)}` : ""}`}
      </button>

      <p className="text-[11px] text-text-muted text-center">
        By placing an offer you agree to our{" "}
        <a href="/terms" className="underline hover:no-underline">Terms of Service</a>.
        {" "}Offers can be increased or withdrawn at any time before the closing date.
      </p>
    </form>
  );
}

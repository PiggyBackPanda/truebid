"use client";

import { useState } from "react";
import { useOfferBoard } from "@/hooks/useOfferBoard";
import { CountdownTimer } from "./CountdownTimer";
import { offerStrengthScore } from "@/lib/offer-utils";
import type { PublicOffer } from "@/lib/offer-utils";
import { formatCurrency } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────────────────────

const CONDITION_LABELS: Record<string, string> = {
  UNCONDITIONAL: "Unconditional",
  SUBJECT_TO_FINANCE: "Subject to finance",
  SUBJECT_TO_BUILDING_PEST: "Building & pest",
  SUBJECT_TO_BOTH: "Finance + B&P",
  SUBJECT_TO_SALE: "Subject to sale",
  OTHER: "Other conditions",
};

const CONDITION_BADGE: Record<string, string> = {
  UNCONDITIONAL: "bg-green-bg text-green",
  SUBJECT_TO_FINANCE: "bg-amber/10 text-amber-900",
  SUBJECT_TO_BUILDING_PEST: "bg-sky/10 text-sky",
  SUBJECT_TO_BOTH: "bg-amber/10 text-amber-900",
  SUBJECT_TO_SALE: "bg-border text-text-muted",
  OTHER: "bg-border text-text-muted",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function strengthDots(score: number) {
  const filled = Math.round((score / 60) * 3);
  return (
    <span
      className="flex items-center gap-0.5 ml-1"
      title={`Offer strength: ${score}/60. Based on conditions and settlement speed.`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < filled ? "bg-green" : "bg-border"
          }`}
        />
      ))}
    </span>
  );
}

// ── Offer row ────────────────────────────────────────────────────────────────

function OfferRow({
  offer,
  rank,
  isNew,
}: {
  offer: PublicOffer;
  rank: number | null;
  isNew: boolean;
}) {
  const isWithdrawn = offer.status === "WITHDRAWN";
  const isAccepted = offer.status === "ACCEPTED";
  const score = offerStrengthScore(offer);

  const dollars = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(offer.amountCents / 100);

  const ariaLabel = `${
    Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
      offer.amountCents / 100
    )
  } ${isWithdrawn ? "withdrawn" : ""}`;

  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors ${
        isNew ? "animate-highlight-new" : ""
      } ${rank === 1 ? "bg-amber-glow" : rank && rank % 2 === 0 ? "bg-bg" : ""} ${
        isWithdrawn ? "opacity-50" : ""
      }`}
    >
      {/* Rank badge */}
      {rank !== null && (
        <span
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
            rank === 1
              ? "bg-amber text-navy"
              : "bg-border text-text-muted"
          }`}
        >
          {rank}
        </span>
      )}

      <div className="flex-1 min-w-0">
        {/* Amount */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            aria-label={ariaLabel}
            className={`font-semibold text-navy text-sm ${
              isWithdrawn ? "line-through" : ""
            } ${isAccepted ? "text-green" : ""}`}
          >
            {dollars}
          </span>

          {isAccepted && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-green bg-green-bg px-1.5 py-0.5 rounded-full">
              ACCEPTED
            </span>
          )}

          {/* Condition badge */}
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              CONDITION_BADGE[offer.conditionType] ?? "bg-border text-text-muted"
            } ${isWithdrawn ? "line-through" : ""}`}
            title={offer.conditionText ?? undefined}
          >
            {CONDITION_LABELS[offer.conditionType] ?? offer.conditionType}
          </span>

          {!isWithdrawn && strengthDots(score)}
        </div>

        {/* Meta */}
        <p className="text-[11px] text-text-muted mt-0.5">
          <span className="font-medium text-text-light">{offer.publicAlias}</span>
          {" · "}
          {offer.settlementDays} day settlement
          {" · "}
          {isWithdrawn ? (
            <span className="text-red font-medium">WITHDRAWN</span>
          ) : (
            timeAgo(offer.updatedAt)
          )}
        </p>
      </div>
    </li>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface OfferBoardProps {
  listingId: string;
  initialOffers: PublicOffer[];
  initialClosingDate: string | null;
  guidePriceCents?: number | null;
  isOwner?: boolean;
  isClosed?: boolean;
}

export function OfferBoard({
  listingId,
  initialOffers,
  initialClosingDate,
  guidePriceCents,
  isOwner = false,
  isClosed = false,
}: OfferBoardProps) {
  const { offers, closingDate, viewerCount } = useOfferBoard(
    listingId,
    initialOffers,
    initialClosingDate
  );

  const [expired, setExpired] = useState(isClosed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeOffers = offers.filter((o) => o.status === "ACTIVE");
  const highestOffer = activeOffers[0];
  const effectiveClosed = expired || isClosed;

  const board = (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-navy px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse-dot" />
            <span className="text-white text-xs font-semibold uppercase tracking-wide">
              Open Offers — Live
            </span>
          </div>
          {viewerCount > 0 && (
            <p className="text-text-light text-[11px] mt-0.5">
              {viewerCount} {viewerCount === 1 ? "person" : "people"} viewing
            </p>
          )}
        </div>
        {guidePriceCents && (
          <div className="text-right">
            <p className="text-[10px] text-text-light uppercase tracking-wide">Guide</p>
            <p className="text-white text-xs font-semibold">
              {formatCurrency(guidePriceCents)}
            </p>
          </div>
        )}
      </div>

      {/* Countdown */}
      {closingDate && (
        <div className="bg-navy-mid px-4 py-3">
          {effectiveClosed ? (
            <div className="text-center">
              <p className="text-red font-bold text-sm uppercase tracking-wider">
                CLOSED
              </p>
              <p className="text-text-muted text-[11px] mt-1">
                Closing period ended — awaiting seller decision
              </p>
            </div>
          ) : (
            <CountdownTimer
              closingDate={closingDate}
              onExpired={() => setExpired(true)}
            />
          )}
        </div>
      )}

      {/* Offer list */}
      <div>
        {offers.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-text-muted text-sm">No offers yet.</p>
            <p className="text-text-light text-xs mt-1">Be the first to place an offer.</p>
          </div>
        ) : (
          <ol>
            {offers.map((offer, idx) => {
              const rank =
                offer.status === "ACTIVE"
                  ? activeOffers.indexOf(offer) + 1
                  : null;
              return (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  rank={rank}
                  isNew={idx === 0 && offers.length > initialOffers.length}
                />
              );
            })}
          </ol>
        )}
      </div>

      {/* CTA */}
      {!isOwner && (
        <div className="px-4 py-3 border-t border-border">
          {effectiveClosed ? (
            <button
              disabled
              className="w-full bg-border text-text-muted font-semibold text-sm py-3 rounded-[10px] cursor-not-allowed"
            >
              Offer period closed
            </button>
          ) : (
            <a
              href={`/listings/${listingId}/offer`}
              className="block w-full text-center bg-amber text-navy font-semibold text-sm py-3 rounded-[10px] hover:bg-amber-light transition-colors focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2"
            >
              Place an Offer
            </a>
          )}
        </div>
      )}
    </div>
  );

  const mobileSummary = (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy border-t border-navy-light shadow-lg">
      <button
        onClick={() => setMobileOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3"
        aria-label="View offer board"
      >
        <span className="text-white text-sm font-medium">
          {activeOffers.length} offer{activeOffers.length !== 1 ? "s" : ""}
          {highestOffer
            ? ` · Highest: ${formatCurrency(highestOffer.amountCents)}`
            : ""}
        </span>
        <span className="text-amber text-sm font-semibold">View Board ↑</span>
      </button>
    </div>
  );

  const mobileModal = mobileOpen && (
    <div
      className="lg:hidden fixed inset-0 z-50 flex flex-col bg-bg"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border">
        <span className="text-navy font-semibold text-sm">Open Offers</span>
        <button
          onClick={() => setMobileOpen(false)}
          className="text-text-muted text-sm p-1"
          aria-label="Close offer board"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{board}</div>
    </div>
  );

  return (
    <>
      {/* Desktop — rendered inline in sidebar */}
      <div className="hidden lg:block">{board}</div>

      {/* Mobile — sticky bar + modal */}
      {mobileSummary}
      {mobileModal}
    </>
  );
}

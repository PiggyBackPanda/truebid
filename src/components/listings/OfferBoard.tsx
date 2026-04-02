"use client";

import { useState } from "react";
import { useOfferBoard } from "@/hooks/useOfferBoard";
import { CountdownTimer } from "./CountdownTimer";
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
              SELECTED
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
  requireInspection?: boolean;
}

export function OfferBoard({
  listingId,
  initialOffers,
  initialClosingDate,
  guidePriceCents,
  isOwner = false,
  isClosed = false,
  requireInspection = false,
}: OfferBoardProps) {
  const { offers, closingDate, viewerCount } = useOfferBoard(
    listingId,
    initialOffers,
    initialClosingDate
  );

  const [expired, setExpired] = useState(isClosed);
  const [isOpen, setIsOpen] = useState(true);

  const activeOffers = offers.filter((o) => o.status === "ACTIVE");
  const effectiveClosed = expired || isClosed;

  const board = (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full bg-navy px-4 py-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber"
        aria-expanded={isOpen}
        aria-controls="offer-board-body"
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse-dot" />
            <span className="text-white text-xs font-semibold uppercase tracking-wide">
              Live Offers
            </span>
          </div>
          {viewerCount > 0 && (
            <p className="text-text-light text-[11px] mt-0.5">
              {viewerCount} {viewerCount === 1 ? "person" : "people"} viewing
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {guidePriceCents && (
            <div className="text-right">
              <p className="text-[10px] text-text-light uppercase tracking-wide">Guide</p>
              <p className="text-white text-xs font-semibold">
                {formatCurrency(guidePriceCents)}
              </p>
            </div>
          )}
          <span
            className="text-text-light text-xs transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden="true"
          >
            ▲
          </span>
        </div>
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div id="offer-board-body">
          {/* Countdown */}
          {closingDate && (
            <div className="bg-navy-mid px-4 py-3">
              {effectiveClosed ? (
                <div className="text-center">
                  <p className="text-red font-bold text-sm uppercase tracking-wider">
                    CLOSED
                  </p>
                  <p className="text-text-muted text-[11px] mt-1">
                    Closing period ended. Awaiting seller decision.
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

          {/* Live Offers info panel */}
          <div className="bg-amber/5 border-b border-amber/15 px-4 py-3">
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Live Offers is a transparent offer process, not an auction.</strong>{" "}
              No offer submitted here creates a legally binding contract. The seller is not obligated to proceed with any offer.
              All final negotiations and contracts happen separately, off this platform.
            </p>
          </div>

          {/* Inspection required notice */}
          {requireInspection && (
            <div className="bg-amber/5 border-b border-amber/20 px-4 py-2">
              <p className="text-[11px] text-amber-900 flex items-center gap-1.5">
                <span aria-hidden="true">ℹ</span>
                Inspection required to offer on this property
              </p>
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

          {/* Seller control notice + anti-snipe note */}
          <div className="px-4 py-3 border-t border-border bg-bg space-y-1.5">
            <p className="text-[10px] text-text-muted text-center leading-relaxed">
              The seller reviews all offers and makes the final decision. They are not obligated to proceed with any offer, including the highest.
            </p>
            <p className="text-[10px] text-text-muted text-center leading-relaxed">
              Anti-snipe protection is active: offers placed in the final 10 minutes automatically extend the offer period by 10 minutes.
            </p>
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
      )}
    </div>
  );

  return board;
}

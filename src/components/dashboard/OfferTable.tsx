"use client";

import { Fragment, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { AcceptOfferModal } from "./AcceptOfferModal";
import type { SellerOffer } from "@/hooks/useSellerDashboard";

const CONDITION_LABELS: Record<string, string> = {
  UNCONDITIONAL: "Unconditional",
  SUBJECT_TO_FINANCE: "Finance",
  SUBJECT_TO_BUILDING_PEST: "B&P",
  SUBJECT_TO_BOTH: "Finance + B&P",
  SUBJECT_TO_SALE: "Subject to sale",
  OTHER: "Other",
};

const CONDITION_COLORS: Record<string, { bg: string; color: string }> = {
  UNCONDITIONAL: { bg: "#dcfce7", color: "#15803d" },
  SUBJECT_TO_FINANCE: { bg: "#fef3c7", color: "#b45309" },
  SUBJECT_TO_BUILDING_PEST: { bg: "#fef9c3", color: "#a16207" },
  SUBJECT_TO_BOTH: { bg: "#fef3c7", color: "#d97706" },
  SUBJECT_TO_SALE: { bg: "#fce7f3", color: "#be185d" },
  OTHER: { bg: "#f3f4f6", color: "#374151" },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Props = {
  offers: SellerOffer[];
  checklistIncomplete: boolean;
  listingStatus: string;
  acceptedOffer: SellerOffer | null;
  onAccepted: (offerId: string) => void;
  onMessageBuyer: (buyerId: string, buyerName: string) => void;
};

export function OfferTable({
  offers,
  checklistIncomplete,
  listingStatus,
  acceptedOffer,
  onAccepted,
  onMessageBuyer,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptingOffer, setAcceptingOffer] = useState<SellerOffer | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [openingConversation, setOpeningConversation] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);

  const activeOffers = offers.filter((o) => o.status === "ACTIVE");

  async function handleReject(offer: SellerOffer) {
    if (
      !confirm(
        `Reject ${offer.buyer.firstName} ${offer.buyer.lastName}'s offer of ${formatCurrency(offer.amountCents)}?`
      )
    )
      return;

    setRejectingId(offer.id);
    try {
      await fetch(`/api/offers/${offer.id}/reject`, { method: "POST" });
    } finally {
      setRejectingId(null);
    }
  }

  // Post-selection handoff screen
  if (acceptedOffer) {
    async function handleOpenConversation() {
      if (!acceptedOffer) return;
      setOpeningConversation(true);
      setConversationError(null);
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerId: acceptedOffer.id }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error: string };
          setConversationError(data.error ?? "Could not open conversation. Please try again.");
          return;
        }
        onMessageBuyer(
          acceptedOffer.buyer.id,
          `${acceptedOffer.buyer.firstName} ${acceptedOffer.buyer.lastName}`
        );
      } catch {
        setConversationError("Network error. Please try again.");
      } finally {
        setOpeningConversation(false);
      }
    }

    return (
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 16,
          padding: "40px",
          maxWidth: 580,
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 16 }}>→</div>
        <h2
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 24,
            color: "#0f1623",
            marginBottom: 8,
          }}
        >
          You&apos;ve selected a buyer
        </h2>
        <p style={{ color: "#334766", fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
          You have indicated you want to proceed with{" "}
          <strong>
            {acceptedOffer.buyer.firstName} {acceptedOffer.buyer.lastName}&apos;s
          </strong>{" "}
          offer of{" "}
          <strong>{formatCurrency(acceptedOffer.amountCents)}</strong> (
          {CONDITION_LABELS[acceptedOffer.conditionType] ?? acceptedOffer.conditionType},{" "}
          {acceptedOffer.settlementDays}-day settlement).{" "}
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            Proposed terms (indicative only, to be confirmed in formal contract of sale)
          </span>
        </p>

        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
            fontSize: 14,
            color: "#334766",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#0f1623" }}>No binding agreement exists yet.</strong>{" "}
          No formal contract of sale has been signed. What happens next is between you, the buyer, and your respective legal representatives. TrueBid is a marketplace only.
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e2db",
            borderRadius: 12,
            padding: "20px 24px",
            textAlign: "left",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontWeight: 600,
              color: "#0f1623",
              marginBottom: 12,
              fontFamily: "var(--font-sans)",
            }}
          >
            What happens next:
          </p>
          {[
            "Engage a licensed settlement agent or solicitor to prepare the formal contract of sale. Find one at the Settlement Agents Supervisory Board: www.sasb.wa.gov.au",
            "Share your contact details with the buyer so your respective representatives can coordinate.",
            "Do not agree to any terms verbally or in writing until your settlement agent has reviewed everything.",
            "Provide the buyer with the contract for review once your settlement agent has prepared it.",
            "Arrange for the buyer's deposit to be held in your settlement agent's trust account.",
            "The buyer may arrange building and pest inspections (if conditional).",
            "Both parties sign the contract.",
          ].map((step, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#e5e2db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#334766",
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <p style={{ color: "#334766", fontSize: 14, lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>

        {conversationError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: "#dc2626",
            }}
          >
            {conversationError}
          </div>
        )}

        <button
          onClick={handleOpenConversation}
          disabled={openingConversation}
          style={{
            background: openingConversation ? "#e5e2db" : "#0f1623",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            cursor: openingConversation ? "not-allowed" : "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {openingConversation ? "Opening…" : "Open conversation to share contact details"}
        </button>
      </div>
    );
  }

  // Empty state
  if (offers.length === 0) {
    return (
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "48px 32px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 20,
            color: "#0f1623",
            marginBottom: 8,
          }}
        >
          No offers yet
        </p>
        <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
          Your listing hasn&apos;t received any offers yet. Ensure your photos
          are high quality, your description is detailed, and your price is
          competitive.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Seller autonomy notice */}
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 16,
          fontSize: 13,
          color: "#334766",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#0f1623" }}>The decision is yours.</strong> You are not obligated to proceed with any offer. TrueBid does not recommend or rank offers on your behalf. Review each offer on its own merits and choose what is right for you.
      </div>

      {acceptingOffer && (
        <AcceptOfferModal
          offer={acceptingOffer}
          checklistIncomplete={checklistIncomplete}
          onCancel={() => setAcceptingOffer(null)}
          onAccepted={(id) => {
            setAcceptingOffer(null);
            onAccepted(id);
          }}
        />
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e2db" }}>
              {["#", "Buyer", "Offer", "Conditions", "Settlement", "Time", "Actions"].map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6b7280",
                      fontFamily: "var(--font-sans)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {offers.map((offer, idx) => {
              const rank = activeOffers.indexOf(offer) + 1;
              const isExpanded = expandedId === offer.id;
              const prevAmount = offer.history[0]?.previousAmountCents ?? null;
              const conditionStyle =
                CONDITION_COLORS[offer.conditionType] ?? CONDITION_COLORS.OTHER;
              const isActive = offer.status === "ACTIVE";

              return (
                <Fragment key={offer.id}>
                  <tr
                    style={{
                      borderBottom: "1px solid #e5e2db",
                      background: isExpanded ? "#f9f8f6" : undefined,
                      opacity: !isActive ? 0.55 : 1,
                      cursor: "pointer",
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : offer.id)}
                  >
                    {/* Rank */}
                    <td style={{ padding: "14px 12px", whiteSpace: "nowrap" }}>
                      {isActive && rank > 0 ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: rank === 1 ? "#f59e0b" : "#f3f4f6",
                            color: rank === 1 ? "#0f1623" : "#6b7280",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {rank}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>
                          {offer.status === "WITHDRAWN"
                            ? "W/D"
                            : offer.status === "REJECTED"
                            ? "REJ"
                            : offer.status === "ACCEPTED"
                            ? "ACC"
                            : `${idx + 1}`}
                        </span>
                      )}
                    </td>

                    {/* Buyer */}
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <p style={{ fontWeight: 600, color: "#0f1623" }}>
                          {offer.buyer.firstName} {offer.buyer.lastName}
                        </p>
                        {offer.buyer.verificationStatus === "VERIFIED" && (
                          <span
                            title="Identity verified"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              background: "#dcfce7",
                              color: "#15803d",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 5,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p style={{ color: "#6b7280", fontSize: 12 }}>{offer.buyer.phone ?? offer.buyer.email}</p>
                    </td>

                    {/* Offer amount */}
                    <td style={{ padding: "14px 12px", whiteSpace: "nowrap" }}>
                      <p style={{ fontWeight: 700, color: "#0f1623" }}>
                        {formatCurrency(offer.amountCents)}
                      </p>
                      {prevAmount !== null && (
                        <p style={{ color: "#9ca3af", fontSize: 12 }}>
                          ↑ was {formatCurrency(prevAmount)}
                        </p>
                      )}
                    </td>

                    {/* Conditions */}
                    <td style={{ padding: "14px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: conditionStyle.bg,
                          color: conditionStyle.color,
                          borderRadius: 6,
                          padding: "3px 8px",
                          fontSize: 12,
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {CONDITION_LABELS[offer.conditionType] ?? offer.conditionType}
                      </span>
                    </td>

                    {/* Settlement */}
                    <td style={{ padding: "14px 12px", color: "#334766" }}>
                      {offer.settlementDays} days
                    </td>

                    {/* Time */}
                    <td style={{ padding: "14px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {timeAgo(offer.createdAt)}
                    </td>

                    {/* Actions */}
                    <td
                      style={{ padding: "14px 12px", whiteSpace: "nowrap" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isActive && listingStatus === "ACTIVE" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => setAcceptingOffer(offer)}
                            style={{
                              background: "#0f1623",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: 6,
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Proceed →
                          </button>
                          <button
                            onClick={() => handleReject(offer)}
                            disabled={rejectingId === offer.id}
                            style={{
                              background: "transparent",
                              color: "#dc2626",
                              border: "1px solid #fca5a5",
                              borderRadius: 6,
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() =>
                              onMessageBuyer(
                                offer.buyer.id,
                                `${offer.buyer.firstName} ${offer.buyer.lastName}`
                              )
                            }
                            style={{
                              background: "transparent",
                              color: "#334766",
                              border: "1px solid #e5e2db",
                              borderRadius: 6,
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            Message
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <tr key={`${offer.id}-detail`} style={{ background: "#f9f8f6" }}>
                      <td colSpan={7} style={{ padding: "0 12px 20px 60px" }}>
                        {offer.personalNote && (
                          <blockquote
                            style={{
                              borderLeft: "3px solid #f59e0b",
                              paddingLeft: 16,
                              margin: "12px 0",
                              color: "#334766",
                              fontStyle: "italic",
                              fontSize: 14,
                              lineHeight: 1.6,
                            }}
                          >
                            &ldquo;{offer.personalNote}&rdquo;
                          </blockquote>
                        )}

                        {offer.history.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#6b7280",
                                marginBottom: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              Offer history
                            </p>
                            {offer.history.map((h, i) => (
                              <p key={i} style={{ fontSize: 13, color: "#334766", marginBottom: 2 }}>
                                {timeAgo(h.createdAt)}: increased from{" "}
                                {formatCurrency(h.previousAmountCents)} to{" "}
                                {formatCurrency(h.newAmountCents)}
                              </p>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
                          <strong style={{ color: "#334766" }}>Verification:</strong>{" "}
                          {offer.buyer.verificationStatus === "VERIFIED" ? (
                            <span style={{ color: "#16a34a" }}>✓ Identity verified</span>
                          ) : (
                            <span style={{ color: "#dc2626" }}>Not verified</span>
                          )}
                          {" · "}
                          <strong style={{ color: "#334766" }}>Email:</strong>{" "}
                          {offer.buyer.email}
                          {offer.buyer.phone && (
                            <>
                              {" · "}
                              <strong style={{ color: "#334766" }}>Phone:</strong>{" "}
                              {offer.buyer.phone}
                            </>
                          )}
                        </div>

                        {isActive && listingStatus === "ACTIVE" && (
                          <button
                            onClick={() => setAcceptingOffer(offer)}
                            style={{
                              marginTop: 16,
                              background: "#0f1623",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: 8,
                              padding: "10px 20px",
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            Proceed with This Offer
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

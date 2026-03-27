"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { SellerOffer } from "@/hooks/useSellerDashboard";

type Props = {
  offer: SellerOffer;
  checklistIncomplete: boolean;
  onCancel: () => void;
  onAccepted: (offerId: string) => void;
};

const CONDITION_LABELS: Record<string, string> = {
  UNCONDITIONAL: "Unconditional",
  SUBJECT_TO_FINANCE: "Subject to finance",
  SUBJECT_TO_BUILDING_PEST: "Subject to building & pest",
  SUBJECT_TO_BOTH: "Subject to finance & B&P",
  SUBJECT_TO_SALE: "Subject to sale",
  OTHER: "Other conditions",
};

export function AcceptOfferModal({
  offer,
  checklistIncomplete,
  onCancel,
  onAccepted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offer.id}/accept`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        setError(data.error ?? "Something went wrong");
        return;
      }
      onAccepted(offer.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const conditionLabel = CONDITION_LABELS[offer.conditionType] ?? offer.conditionType;

  return (
    // Backdrop
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,26,46,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: "32px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: 22,
            color: "#0f1a2e",
            marginBottom: 8,
          }}
        >
          Accept this offer?
        </h2>

        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          You are about to accept{" "}
          <strong style={{ color: "#0f1a2e" }}>
            {offer.buyer.firstName} {offer.buyer.lastName}&apos;s
          </strong>{" "}
          offer of{" "}
          <strong style={{ color: "#0f1a2e" }}>{formatCurrency(offer.amountCents)}</strong>{" "}
          ({conditionLabel}, {offer.settlementDays}-day settlement). All other
          offers will be rejected and buyers will be notified.
        </p>

        {checklistIncomplete && (
          <div
            style={{
              background: "#fff3e0",
              border: "1px solid #ffcc80",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#e65100",
              lineHeight: 1.5,
            }}
          >
            You haven&apos;t completed all legal checklist items. Make sure
            you&apos;ve engaged a settlement agent before proceeding.
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              background: "transparent",
              border: "1px solid #e5e2db",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
              fontSize: 14,
              color: "#334766",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            style={{
              background: loading ? "#d1fae5" : "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Outfit, sans-serif",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {loading ? "Accepting…" : "Accept Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}

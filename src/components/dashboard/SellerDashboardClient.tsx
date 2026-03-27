"use client";

import { useState, useCallback } from "react";
import { StatsRow } from "./StatsRow";
import { OfferTable } from "./OfferTable";
import { MessagesTab } from "./MessagesTab";
import { LegalChecklist } from "./LegalChecklist";
import { useSellerDashboard, type SellerOffer } from "@/hooks/useSellerDashboard";
import { WA_CHECKLIST } from "@/lib/wa-checklist";

type Stats = {
  totalViews: number;
  totalViewsToday: number;
  totalSaves: number;
  totalSavesToday: number;
  activeOffers: number;
  highestOfferCents: number | null;
  unreadMessages: number;
  activeListings: number;
};

type Conversation = {
  listingId: string;
  listingAddress: string;
  counterparty: {
    id: string;
    firstName: string;
    lastName: string;
    publicAlias: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
};

type ChecklistEntry = {
  itemKey: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
};

type Props = {
  listingId: string;
  listingStatus: string;
  listingAddress: string;
  currentUserId: string;
  initialOffers: SellerOffer[];
  initialStats: Stats;
  initialConversations: Conversation[];
  initialChecklist: ChecklistEntry[];
};

type Tab = "offers" | "messages" | "checklist" | "settings";

type Toast = {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
};

export function SellerDashboardClient({
  listingId,
  listingStatus,
  listingAddress,
  currentUserId,
  initialOffers,
  initialStats,
  initialConversations,
  initialChecklist,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("offers");
  const [messageBuyerId, setMessageBuyerId] = useState<string | null>(null);
  const [acceptedOfferId, setAcceptedOfferId] = useState<string | null>(null);

  const { offers, toasts, dismissToast, refreshOffers } = useSellerDashboard(
    listingId,
    initialOffers
  );

  // Check if mandatory checklist items are incomplete
  const checklistIncomplete = WA_CHECKLIST.filter((item) => item.mandatory).some(
    (item) => !initialChecklist.find((p) => p.itemKey === item.key && p.status === "COMPLETED")
  );

  const activeOfferCount = offers.filter((o) => o.status === "ACTIVE").length;
  const unreadCount = initialConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const acceptedOffer = acceptedOfferId
    ? (offers.find((o) => o.id === acceptedOfferId) ?? null)
    : null;

  const handleAccepted = useCallback(
    (offerId: string) => {
      setAcceptedOfferId(offerId);
      refreshOffers();
    },
    [refreshOffers]
  );

  const handleMessageBuyer = useCallback((buyerId: string) => {
    setMessageBuyerId(buyerId);
    setActiveTab("messages");
  }, []);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "offers", label: "Offers", badge: activeOfferCount },
    { id: "messages", label: "Messages", badge: unreadCount || undefined },
    { id: "checklist", label: "Legal Checklist" },
    { id: "settings", label: "Listing Settings" },
  ];

  return (
    <div>
      {/* Toast notifications */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast: Toast) => (
          <div
            key={toast.id}
            style={{
              background: toast.type === "warning" ? "#fff3e0" : "#0f1a2e",
              color: toast.type === "warning" ? "#e65100" : "#ffffff",
              border: toast.type === "warning" ? "1px solid #ffcc80" : "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 14,
              fontFamily: "Outfit, sans-serif",
              maxWidth: 320,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              pointerEvents: "auto",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            onClick={() => dismissToast(toast.id)}
          >
            <span>{toast.type === "warning" ? "⚠️" : "🔔"}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: 28,
            fontWeight: 400,
            color: "#0f1a2e",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Seller Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "Outfit, sans-serif" }}>
          {listingAddress}
          {listingStatus !== "ACTIVE" && (
            <span
              style={{
                marginLeft: 10,
                background: listingStatus === "UNDER_OFFER" ? "#dbeafe" : "#f3f4f6",
                color: listingStatus === "UNDER_OFFER" ? "#1d4ed8" : "#374151",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {listingStatus.replace("_", " ")}
            </span>
          )}
        </p>
      </div>

      {/* Stats row */}
      <StatsRow initialStats={initialStats} />

      {/* Tab navigation */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "2px solid #e5e2db",
          marginBottom: 24,
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== "messages") setMessageBuyerId(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "12px 20px",
              minHeight: 44,
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? "#0f1a2e" : "transparent"}`,
              marginBottom: -2,
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? "#0f1a2e" : "#6b7280",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  background: tab.id === "messages" ? "#2563eb" : "#e8a838",
                  color: tab.id === "messages" ? "#ffffff" : "#0f1a2e",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "offers" && (
        <OfferTable
          offers={offers}
          checklistIncomplete={checklistIncomplete}
          listingStatus={listingStatus}
          acceptedOffer={acceptedOffer}
          onAccepted={handleAccepted}
          onMessageBuyer={handleMessageBuyer}
        />
      )}

      {activeTab === "messages" && (
        <MessagesTab
          listingId={listingId}
          currentUserId={currentUserId}
          initialConversations={initialConversations}
          openBuyerId={messageBuyerId}
        />
      )}

      {activeTab === "checklist" && (
        <LegalChecklist initialProgress={initialChecklist} />
      )}

      {activeTab === "settings" && (
        <ListingSettingsTab
          listingId={listingId}
          listingStatus={listingStatus}
        />
      )}
    </div>
  );
}

function ListingSettingsTab({
  listingId,
  listingStatus,
}: {
  listingId: string;
  listingStatus: string;
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [pausing, setPausing] = useState(false);

  async function handleWithdraw() {
    if (
      !confirm(
        "Are you sure you want to withdraw this listing? This will expire all active offers and remove the listing from the market."
      )
    )
      return;

    setWithdrawing(true);
    try {
      await fetch(`/api/listings/${listingId}/withdraw`, { method: "POST" });
      window.location.reload();
    } catch {
      setWithdrawing(false);
    }
  }

  async function handlePause() {
    setPausing(true);
    try {
      await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });
      window.location.reload();
    } catch {
      setPausing(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <h3
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: "#0f1a2e",
            marginBottom: 6,
          }}
        >
          Edit Listing
        </h3>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
          Update your listing details, photos, or pricing.
        </p>
        <a
          href={`/listings/${listingId}/edit`}
          style={{
            display: "inline-block",
            background: "#0f1a2e",
            color: "#ffffff",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          Edit listing →
        </a>
      </div>

      {listingStatus === "ACTIVE" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e2db",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <h3
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: 15,
              color: "#0f1a2e",
              marginBottom: 6,
            }}
          >
            Pause Listing
          </h3>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
            Temporarily hide your listing from search results. Existing offers
            are preserved.
          </p>
          <button
            onClick={handlePause}
            disabled={pausing}
            style={{
              background: "transparent",
              color: "#334766",
              border: "1px solid #e5e2db",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {pausing ? "Pausing…" : "Pause listing"}
          </button>
        </div>
      )}

      <div
        style={{
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <h3
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: "#dc2626",
            marginBottom: 6,
          }}
        >
          Withdraw Listing
        </h3>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
          Permanently remove your listing from the market. All active offers
          will be expired and buyers notified. This cannot be undone.
        </p>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          style={{
            background: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          {withdrawing ? "Withdrawing…" : "Withdraw listing"}
        </button>
      </div>
    </div>
  );
}

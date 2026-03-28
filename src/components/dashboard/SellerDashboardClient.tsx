"use client";

import { useState, useCallback } from "react";
import { StatsRow } from "./StatsRow";
import { OfferTable } from "./OfferTable";
import { MessagesTab } from "./MessagesTab";
import { LegalChecklist } from "./LegalChecklist";
import { ListingStatusBadge, ListingStatusProgress } from "./ListingStatusProgress";
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

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  COMING_SOON: "Coming Soon",
  ACTIVE: "Active",
  UNDER_OFFER: "Under Offer",
  SOLD: "Offer Accepted",
};

function EditListingTab({
  listingId,
  listingAddress,
  listingStatus,
}: {
  listingId: string;
  listingAddress: string;
  listingStatus: string;
}) {
  const steps = [
    {
      step: 1,
      title: "Property Details",
      description: "Address, property type, rooms, description, features, and additional information.",
      href: `/listings/create/details?id=${listingId}`,
    },
    {
      step: 2,
      title: "Photos",
      description: "Upload, reorder, or remove photos and floor plans.",
      href: `/listings/create/photos?id=${listingId}`,
    },
    {
      step: 3,
      title: "Sale Method",
      description: "Sale method, pricing, closing date, inspection requirements, and address privacy.",
      href: `/listings/create/method?id=${listingId}`,
    },
    {
      step: 4,
      title: "Review & Publish",
      description: "Preview your listing and publish it or change its status.",
      href: `/listings/create/review?id=${listingId}`,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: "#6b7280", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 8 }}>
          {listingAddress}
          <span style={{ background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
            {STATUS_LABELS[listingStatus] ?? listingStatus}
          </span>
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map(({ step, title, description, href }) => (
          <a
            key={step}
            href={href}
            style={{ display: "flex", alignItems: "center", gap: 16, background: "#ffffff", border: "1px solid #e5e2db", borderRadius: 12, padding: "20px 24px", textDecoration: "none", transition: "box-shadow 0.15s" }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f59e0b", color: "#0f1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, fontFamily: "var(--font-sans)" }}>
              {step}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: "#0f1623", fontFamily: "var(--font-sans)", marginBottom: 3 }}>{title}</p>
              <p style={{ color: "#6b7280", fontSize: 13, fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>{description}</p>
            </div>
            <span style={{ color: "#9ca3af", fontSize: 18, flexShrink: 0 }}>→</span>
          </a>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <a href={`/listings/${listingId}`} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
          View Listing Page
        </a>
      </div>
    </div>
  );
}

function GoLiveButton({ listingId }: { listingId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoLive() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to go live.");
        setConfirming(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        <p style={{ fontSize: 13, color: "#374151", fontFamily: "var(--font-sans)", maxWidth: 260, textAlign: "right" }}>
          This will open the property for offers. Are you sure?
        </p>
        {error && <p style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setConfirming(false)}
            style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleGoLive}
            disabled={loading}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1a0f00",
              background: "#f59e0b",
              border: "none",
              borderRadius: 8,
              padding: "6px 16px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "var(--font-sans)",
            }}
          >
            {loading ? "Going live…" : "Yes, go live"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#1a0f00",
        background: "#f59e0b",
        border: "none",
        borderRadius: 8,
        padding: "8px 20px",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        flexShrink: 0,
      }}
    >
      Go Live: Open for Offers
    </button>
  );
}

type Tab = "edit" | "offers" | "messages" | "checklist" | "settings";

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
    { id: "edit", label: "Edit Listing" },
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
              background: toast.type === "warning" ? "#fff3e0" : "#0f1623",
              color: toast.type === "warning" ? "#e65100" : "#ffffff",
              border: toast.type === "warning" ? "1px solid #ffcc80" : "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 14,
              fontFamily: "var(--font-sans)",
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 28,
                fontWeight: 400,
                color: "#0f1623",
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}
            >
              Seller Dashboard
            </h1>
            <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 8 }}>
              {listingAddress}
              <ListingStatusBadge status={listingStatus as Parameters<typeof ListingStatusBadge>[0]["status"]} />
            </p>
          </div>
          {(listingStatus === "COMING_SOON" || listingStatus === "INSPECTIONS_OPEN") && (
            <GoLiveButton listingId={listingId} />
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <ListingStatusProgress status={listingStatus as Parameters<typeof ListingStatusProgress>[0]["status"]} />
        </div>
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
              borderBottom: `2px solid ${activeTab === tab.id ? "#0f1623" : "transparent"}`,
              marginBottom: -2,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? "#0f1623" : "#6b7280",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  background: "#f59e0b",
                  color: "#1a0f00",
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
      {activeTab === "edit" && (
        <EditListingTab listingId={listingId} listingAddress={listingAddress} listingStatus={listingStatus} />
      )}

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
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 15,
              color: "#0f1623",
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
              fontFamily: "var(--font-sans)",
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
            fontFamily: "var(--font-sans)",
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
            fontFamily: "var(--font-sans)",
          }}
        >
          {withdrawing ? "Withdrawing…" : "Withdraw listing"}
        </button>
      </div>
    </div>
  );
}

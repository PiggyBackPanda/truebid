"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OfferWindowsTab } from "@/components/dashboard/OfferWindowsTab";

// ─── Types ────────────────────────────────────────────────────────────────────

type SavedListing = {
  savedAt: string;
  listing: {
    id: string;
    streetAddress: string;
    suburb: string;
    state: string;
    status: string;
    saleMethod: string;
    closingDate: string | null;
    activeOfferCount: number;
    thumbnail: string | null;
  };
};

type MyOffer = {
  id: string;
  amountCents: number;
  conditionType: string;
  conditionText: string | null;
  settlementDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  rank: number | null;
  totalOffers: number;
  listing: {
    id: string;
    streetAddress: string;
    suburb: string;
    state: string;
    status: string;
    saleMethod: string;
    closingDate: string | null;
  };
};

type Conversation = {
  listingId: string;
  listingAddress: string;
  counterparty: { id: string; firstName: string; lastName: string; publicAlias: string };
  lastMessage: { content: string; createdAt: string; isFromMe: boolean };
  unreadCount: number;
};

type ThreadMessage = {
  id: string;
  senderId: string;
  content: string;
  status: string;
  createdAt: string;
  isFromMe: boolean;
};

type SavedSearch = {
  id: string;
  name: string | null;
  suburb: string | null;
  propertyType: string | null;
  saleMethod: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  minBeds: number | null;
  minBaths: number | null;
  createdAt: string;
};

type Props = {
  currentUserId: string;
  savedListings: SavedListing[];
  myOffers: MyOffer[];
  initialConversations: Conversation[];
  savedSearches: SavedSearch[];
};

type Tab = "saved" | "offers" | "messages" | "searches" | "offer-windows";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#0f1a2e",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 600,
        flexShrink: 0,
        fontFamily: "Outfit, sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE: { bg: "#dcfce7", color: "#15803d", label: "Active" },
  WITHDRAWN: { bg: "#f3f4f6", color: "#374151", label: "Withdrawn" },
  ACCEPTED: { bg: "#fef3c7", color: "#b45309", label: "Selected by Seller" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626", label: "Rejected" },
  EXPIRED: { bg: "#f3f4f6", color: "#9ca3af", label: "Expired" },
};

const LISTING_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "#dcfce7", color: "#15803d" },
  DRAFT: { bg: "#f3f4f6", color: "#374151" },
  UNDER_OFFER: { bg: "#fef3c7", color: "#b45309" },
  SOLD: { bg: "#f0fdf4", color: "#15803d" },
  WITHDRAWN: { bg: "#f3f4f6", color: "#9ca3af" },
  EXPIRED: { bg: "#f3f4f6", color: "#9ca3af" },
};

const LISTING_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  COMING_SOON: "Coming Soon",
  DRAFT: "Draft",
  UNDER_OFFER: "Under Offer",
  SOLD: "Buyer Selected",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

// ─── Saved Tab ────────────────────────────────────────────────────────────────

function SavedTab({ initialItems }: { initialItems: SavedListing[] }) {
  const [items, setItems] = useState(initialItems);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleUnsave(listingId: string) {
    setRemoving(listingId);
    try {
      await fetch(`/api/saves/${listingId}`, { method: "POST" });
      setItems((prev) => prev.filter((s) => s.listing.id !== listingId));
    } finally {
      setRemoving(null);
    }
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "56px 32px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: 22,
            color: "#0f1a2e",
            marginBottom: 8,
          }}
        >
          No saved listings yet
        </p>
        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 360,
            margin: "0 auto 24px",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          Save listings you&apos;re interested in to keep track of them here.
        </p>
        <Link
          href="/listings"
          style={{
            background: "#f59e0b",
            color: "#0f1a2e",
            fontWeight: 600,
            padding: "11px 24px",
            borderRadius: 10,
            textDecoration: "none",
            fontFamily: "Outfit, sans-serif",
            fontSize: 14,
          }}
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((save) => {
        const listing = save.listing;
        const statusStyle = LISTING_STATUS_STYLE[listing.status] ?? { bg: "#f3f4f6", color: "#374151" };
        return (
          <div
            key={listing.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "#ffffff",
              border: "1px solid #e5e2db",
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: 72,
                height: 54,
                borderRadius: 8,
                background: listing.thumbnail
                  ? undefined
                  : "linear-gradient(135deg, #0f1a2e, #334766)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {listing.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.thumbnail}
                  alt={listing.streetAddress}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                href={`/listings/${listing.id}`}
                style={{ textDecoration: "none" }}
              >
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "#0f1a2e",
                    fontFamily: "Outfit, sans-serif",
                    marginBottom: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {listing.streetAddress}
                </p>
              </Link>
              <p style={{ color: "#6b7280", fontSize: 13, fontFamily: "Outfit, sans-serif" }}>
                {listing.suburb}, {listing.state}
                {listing.closingDate && (
                  <span style={{ marginLeft: 8, color: "#9ca3af" }}>
                    · Closes {formatDate(listing.closingDate)}
                  </span>
                )}
              </p>
            </div>

            {/* Badges + actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                {LISTING_STATUS_LABEL[listing.status] ?? listing.status.replace(/_/g, " ")}
              </span>
              {listing.activeOfferCount > 0 && (
                <span
                  style={{
                    background: "#fef9c3",
                    color: "#a16207",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {listing.activeOfferCount} offer{listing.activeOfferCount !== 1 ? "s" : ""}
                </span>
              )}
              <Link
                href={`/listings/${listing.id}`}
                style={{
                  color: "#334766",
                  fontSize: 13,
                  fontFamily: "Outfit, sans-serif",
                  textDecoration: "none",
                  fontWeight: 500,
                  padding: "5px 12px",
                  border: "1px solid #e5e2db",
                  borderRadius: 7,
                }}
              >
                View
              </Link>
              <button
                onClick={() => handleUnsave(listing.id)}
                disabled={removing === listing.id}
                style={{
                  color: "#9ca3af",
                  fontSize: 13,
                  fontFamily: "Outfit, sans-serif",
                  background: "none",
                  border: "none",
                  cursor: removing === listing.id ? "not-allowed" : "pointer",
                  padding: "5px 2px",
                }}
              >
                {removing === listing.id ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Offers Tab ───────────────────────────────────────────────────────────────

function OffersTab({ offers }: { offers: MyOffer[] }) {
  if (offers.length === 0) {
    return (
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "56px 32px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: 22,
            color: "#0f1a2e",
            marginBottom: 8,
          }}
        >
          No offers placed yet
        </p>
        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 360,
            margin: "0 auto 24px",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          Find a property you love and place your first offer. Identity verification
          is required before placing offers.
        </p>
        <Link
          href="/listings"
          style={{
            background: "#f59e0b",
            color: "#0f1a2e",
            fontWeight: 600,
            padding: "11px 24px",
            borderRadius: 10,
            textDecoration: "none",
            fontFamily: "Outfit, sans-serif",
            fontSize: 14,
          }}
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {offers.map((offer) => {
        const statusStyle = STATUS_STYLE[offer.status] ?? STATUS_STYLE.EXPIRED;
        const listingStatusStyle =
          LISTING_STATUS_STYLE[offer.listing.status] ?? { bg: "#f3f4f6", color: "#374151" };
        const conditionLabel =
          offer.conditionType === "UNCONDITIONAL"
            ? "Unconditional"
            : offer.conditionType === "FINANCE"
            ? "Subject to finance"
            : offer.conditionType === "BUILDING_PEST"
            ? "Subject to B&P"
            : offer.conditionType.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

        return (
          <div
            key={offer.id}
            style={{
              background: "#ffffff",
              border: "1px solid #e5e2db",
              borderRadius: 12,
              padding: "20px 24px",
            }}
          >
            {/* Top row: address + listing status */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <Link
                  href={`/listings/${offer.listing.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: 16,
                      color: "#0f1a2e",
                      fontFamily: "Outfit, sans-serif",
                      marginBottom: 3,
                    }}
                  >
                    {offer.listing.streetAddress}
                  </p>
                </Link>
                <p style={{ color: "#6b7280", fontSize: 13, fontFamily: "Outfit, sans-serif" }}>
                  {offer.listing.suburb}, {offer.listing.state}
                  {offer.listing.closingDate && offer.listing.status === "ACTIVE" && (
                    <span style={{ marginLeft: 8, color: "#9ca3af" }}>
                      · Closes {formatDate(offer.listing.closingDate)}
                    </span>
                  )}
                </p>
              </div>
              <span
                style={{
                  background: listingStatusStyle.bg,
                  color: listingStatusStyle.color,
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Outfit, sans-serif",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {LISTING_STATUS_LABEL[offer.listing.status] ?? offer.listing.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Offer details row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              {/* Amount */}
              <p
                style={{
                  fontFamily: "DM Serif Display, Georgia, serif",
                  fontSize: 26,
                  color: "#0f1a2e",
                  letterSpacing: "-0.02em",
                }}
              >
                {formatCurrency(offer.amountCents)}
              </p>

              {/* Rank badge */}
              {offer.rank !== null && (
                <span
                  style={{
                    background: offer.rank === 1 ? "#fef9c3" : "#f3f4f6",
                    color: offer.rank === 1 ? "#a16207" : "#374151",
                    borderRadius: 8,
                    padding: "4px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Outfit, sans-serif",
                    border: offer.rank === 1 ? "1px solid #fde68a" : "1px solid #e5e7eb",
                  }}
                >
                  #{offer.rank} of {offer.totalOffers}
                </span>
              )}

              {/* Offer status */}
              <span
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                {statusStyle.label}
              </span>

              {/* Conditions + settlement */}
              <span
                style={{
                  color: "#6b7280",
                  fontSize: 13,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                {conditionLabel} · {offer.settlementDays} day settlement
                {offer.status === "ACCEPTED" && (
                  <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>
                    (indicative only, to be confirmed in formal contract of sale)
                  </span>
                )}
              </span>

              {/* View listing link */}
              <Link
                href={`/listings/${offer.listing.id}`}
                style={{
                  marginLeft: "auto",
                  color: "#334766",
                  fontSize: 13,
                  fontFamily: "Outfit, sans-serif",
                  textDecoration: "none",
                  fontWeight: 500,
                  padding: "6px 14px",
                  border: "1px solid #e5e2db",
                  borderRadius: 7,
                  whiteSpace: "nowrap",
                }}
              >
                View Listing
              </Link>
            </div>

            {/* Buyer handoff panel, shown when seller has indicated intent to proceed */}
            {offer.status === "ACCEPTED" && (
              <div
                style={{
                  marginTop: 16,
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  padding: "16px 20px",
                  fontSize: 14,
                  color: "#334766",
                  lineHeight: 1.6,
                }}
              >
                <p style={{ fontWeight: 600, color: "#0f1623", marginBottom: 8 }}>
                  The seller wants to proceed with your offer. What to do next:
                </p>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li style={{ marginBottom: 6 }}>
                    Engage a licensed settlement agent or solicitor to act on your behalf. They will review and coordinate the formal contract of sale.
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    Use TrueBid&apos;s messaging to share your contact details with the seller so your representatives can coordinate.
                  </li>
                  <li>
                    Do not commit to any terms until your settlement agent has reviewed everything.
                  </li>
                </ol>
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    color: "#92400e",
                    fontWeight: 500,
                  }}
                >
                  No binding agreement exists until a formal contract of sale is signed by both parties.
                </p>
              </div>
            )}

            {/* Last updated */}
            <p
              style={{
                color: "#9ca3af",
                fontSize: 12,
                fontFamily: "Outfit, sans-serif",
                marginTop: 10,
              }}
            >
              Last updated {timeAgo(offer.updatedAt)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

function BuyerMessagesTab({
  currentUserId,
  initialConversations,
}: {
  currentUserId: string;
  initialConversations: Conversation[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    setLoadingThread(true);
    fetch(`/api/messages/conversations/${selected.listingId}/${selected.counterparty.id}`)
      .then((r) => r.json())
      .then((data: { messages: ThreadMessage[] }) => {
        setMessages(data.messages ?? []);
        // Mark as read in the list
        setConversations((prev) =>
          prev.map((c) =>
            c.listingId === selected.listingId && c.counterparty.id === selected.counterparty.id
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoadingThread(false));
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!draft.trim() || !selected || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selected.counterparty.id,
          listingId: selected.listingId,
          content,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        message: { id: string; createdAt: string; content: string };
      };
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          senderId: currentUserId,
          content,
          status: "SENT",
          createdAt: data.message.createdAt,
          isFromMe: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "56px 32px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "DM Serif Display, Georgia, serif",
            fontSize: 22,
            color: "#0f1a2e",
            marginBottom: 8,
          }}
        >
          No conversations yet
        </p>
        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 360,
            margin: "0 auto 24px",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          You can message sellers directly from any listing page once you&apos;ve
          placed an offer.
        </p>
        <Link
          href="/listings"
          style={{
            background: "#f59e0b",
            color: "#0f1a2e",
            fontWeight: 600,
            padding: "11px 24px",
            borderRadius: 10,
            textDecoration: "none",
            fontFamily: "Outfit, sans-serif",
            fontSize: 14,
          }}
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: selected ? "300px 1fr" : "1fr",
        border: "1px solid #e5e2db",
        borderRadius: 12,
        overflow: "hidden",
        height: 520,
      }}
    >
      {/* Conversation list */}
      <div style={{ borderRight: selected ? "1px solid #e5e2db" : "none", overflowY: "auto" }}>
        {totalUnread > 0 && (
          <div
            style={{
              padding: "8px 16px",
              background: "#fffbeb",
              borderBottom: "1px solid #fde68a",
              fontSize: 12,
              color: "#d97706",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 500,
            }}
          >
            {totalUnread} unread message{totalUnread !== 1 ? "s" : ""}
          </div>
        )}
        {conversations.map((convo) => {
          const isSelected =
            selected?.listingId === convo.listingId &&
            selected?.counterparty.id === convo.counterparty.id;
          const name = `${convo.counterparty.firstName} ${convo.counterparty.lastName}`;
          return (
            <button
              key={`${convo.listingId}:${convo.counterparty.id}`}
              onClick={() => setSelected(convo)}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                width: "100%",
                padding: "14px 16px",
                background: isSelected ? "#f0f4ff" : "#ffffff",
                borderBottom: "1px solid #e5e2db",
                cursor: "pointer",
                border: "none",
                borderLeft: isSelected ? "3px solid #0f1a2e" : "3px solid transparent",
                textAlign: "left",
              }}
            >
              <Avatar name={name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#0f1a2e",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    {name}
                  </p>
                  <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>
                    {timeAgo(convo.lastMessage.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    fontFamily: "Outfit, sans-serif",
                    marginBottom: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {convo.listingAddress}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 160,
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    {convo.lastMessage.isFromMe ? "You: " : ""}
                    {convo.lastMessage.content}
                  </p>
                  {convo.unreadCount > 0 && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#f59e0b",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Thread */}
      {selected && (
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #e5e2db",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Avatar
              name={`${selected.counterparty.firstName} ${selected.counterparty.lastName}`}
            />
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#0f1a2e",
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                {selected.counterparty.firstName} {selected.counterparty.lastName}
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", fontFamily: "Outfit, sans-serif" }}>
                {selected.listingAddress}
              </p>
            </div>
            <Link
              href={`/listings/${selected.listingId}`}
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "#334766",
                textDecoration: "none",
                fontFamily: "Outfit, sans-serif",
                border: "1px solid #e5e2db",
                borderRadius: 6,
                padding: "4px 10px",
              }}
            >
              View listing →
            </Link>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {loadingThread ? (
              <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>Loading…</p>
            ) : messages.length === 0 ? (
              <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>
                No messages yet. Say hello!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: msg.isFromMe ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      background: msg.isFromMe ? "#0f1a2e" : "#f3f4f6",
                      color: msg.isFromMe ? "#ffffff" : "#0f1a2e",
                      borderRadius: msg.isFromMe
                        ? "12px 12px 2px 12px"
                        : "12px 12px 12px 2px",
                      padding: "10px 14px",
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    <p>{msg.content}</p>
                    <p
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                        color: msg.isFromMe ? "rgba(255,255,255,0.6)" : "#9ca3af",
                      }}
                    >
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #e5e2db",
              display: "flex",
              gap: 8,
              background: "#ffffff",
            }}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message…"
              style={{
                flex: 1,
                border: "1px solid #e5e2db",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 14,
                fontFamily: "Outfit, sans-serif",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !draft.trim()}
              style={{
                background: draft.trim() ? "#0f1a2e" : "#e5e2db",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                cursor: draft.trim() ? "pointer" : "not-allowed",
                fontFamily: "Outfit, sans-serif",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function BuyerDashboardClient({
  currentUserId,
  savedListings,
  myOffers,
  initialConversations,
  savedSearches,
}: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const validTabs: Tab[] = ["offers", "saved", "messages", "searches", "offer-windows"];
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : "offers"
  );

  const activeOffers = myOffers.filter((o) => o.status === "ACTIVE");
  const totalUnread = initialConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "offers", label: "My Offers", badge: activeOffers.length || undefined },
    { id: "offer-windows", label: "Offer Windows" },
    { id: "saved", label: "Saved", badge: savedListings.length || undefined },
    { id: "messages", label: "Messages", badge: totalUnread || undefined },
    { id: "searches", label: "Saved Searches", badge: savedSearches.length || undefined },
  ];

  return (
    <div>
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
          Buyer Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "Outfit, sans-serif" }}>
          Track your offers, saved properties, and seller conversations.
        </p>
      </div>

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
            onClick={() => setActiveTab(tab.id)}
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
                  background: "#f59e0b",
                  color: tab.id === "messages" ? "#1a0f00" : "#0f1a2e",
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
      {activeTab === "offers" && <OffersTab offers={myOffers} />}
      {activeTab === "offer-windows" && <OfferWindowsTab userId={currentUserId} />}
      {activeTab === "saved" && <SavedTab initialItems={savedListings} />}
      {activeTab === "messages" && (
        <BuyerMessagesTab
          currentUserId={currentUserId}
          initialConversations={initialConversations}
        />
      )}
      {activeTab === "searches" && <SavedSearchesTab initialSearches={savedSearches} />}
    </div>
  );
}

// ─── Saved Searches Tab ───────────────────────────────────────────────────────

function buildSearchUrl(s: SavedSearch): string {
  const params = new URLSearchParams();
  if (s.suburb) params.set("suburb", s.suburb);
  if (s.propertyType) params.set("propertyType", s.propertyType);
  if (s.saleMethod) params.set("saleMethod", s.saleMethod);
  if (s.minPriceCents) params.set("minPrice", String(s.minPriceCents));
  if (s.maxPriceCents) params.set("maxPrice", String(s.maxPriceCents));
  if (s.minBeds) params.set("minBeds", String(s.minBeds));
  if (s.minBaths) params.set("minBaths", String(s.minBaths));
  return `/listings?${params.toString()}`;
}

function formatSearchLabel(s: SavedSearch): string {
  const parts: string[] = [];
  if (s.suburb) parts.push(s.suburb);
  if (s.propertyType) parts.push(s.propertyType.charAt(0) + s.propertyType.slice(1).toLowerCase());
  if (s.minBeds) parts.push(`${s.minBeds}+ bed`);
  if (s.minPriceCents || s.maxPriceCents) {
    const fmt = (c: number) => `$${(c / 100 / 1000).toFixed(0)}k`;
    if (s.minPriceCents && s.maxPriceCents) parts.push(`${fmt(s.minPriceCents)}-${fmt(s.maxPriceCents)}`);
    else if (s.minPriceCents) parts.push(`${fmt(s.minPriceCents)}+`);
    else if (s.maxPriceCents) parts.push(`under ${fmt(s.maxPriceCents)}`);
  }
  return parts.length > 0 ? parts.join(", ") : "All properties";
}

function SavedSearchesTab({ initialSearches }: { initialSearches: SavedSearch[] }) {
  const [searches, setSearches] = useState(initialSearches);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (searches.length === 0) {
    return (
      <div className="text-center py-16">
        <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "Outfit, sans-serif", marginBottom: 12 }}>
          No saved searches yet.
        </p>
        <Link
          href="/listings"
          style={{
            display: "inline-block",
            background: "#f59e0b",
            color: "#1a0f00",
            fontFamily: "Outfit, sans-serif",
            fontWeight: 600,
            fontSize: 14,
            padding: "10px 20px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {searches.map((s) => (
        <div
          key={s.id}
          style={{
            background: "#ffffff",
            border: "1px solid #e5e2db",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <a
              href={buildSearchUrl(s)}
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: "#0f1a2e",
                textDecoration: "none",
              }}
            >
              {s.name ?? formatSearchLabel(s)}
            </a>
            <p style={{ fontFamily: "Outfit, sans-serif", fontSize: 12, color: "#9ca3af" }}>
              {formatSearchLabel(s)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <a
              href={buildSearchUrl(s)}
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "#334766",
                textDecoration: "underline",
                whiteSpace: "nowrap",
              }}
            >
              View results
            </a>
            <button
              onClick={() => handleDelete(s.id)}
              disabled={deleting === s.id}
              style={{
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                opacity: deleting === s.id ? 0.4 : 1,
              }}
              aria-label="Remove saved search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

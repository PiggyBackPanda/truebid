"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type OfferWindowEntry = {
  listingId: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  status: string;
  closingDate: string | null;
  guidePriceCents: number | null;
  thumbnailUrl: string | null;
  myOffer: { id: string; amountCents: number; status: string } | null;
  highestOfferCents: number | null;
  isHighest: boolean;
};

type Group = {
  label: string;
  entries: OfferWindowEntry[];
};

// ─── AWST timezone helpers ────────────────────────────────────────────────────

const PERTH_TZ = "Australia/Perth";

function toAWSTDate(isoString: string): Date {
  // Create a date that reflects the calendar date in AWST
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: PERTH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(isoString));
  const y = parts.find((p) => p.type === "year")?.value ?? "2000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return new Date(`${y}-${m}-${d}T00:00:00`);
}

function todayAWST(): Date {
  return toAWSTDate(new Date().toISOString());
}

function daysDiff(aDate: Date, bDate: Date): number {
  return Math.round((aDate.getTime() - bDate.getTime()) / 86_400_000);
}

function formatClosingTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: PERTH_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(isoString));
}

function formatClosingDateFull(isoString: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: PERTH_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(isoString));
}

function isUrgent(isoString: string): boolean {
  const ms = new Date(isoString).getTime() - Date.now();
  return ms > 0 && ms <= 2 * 60 * 60 * 1000; // within 2 hours
}

function groupEntries(entries: OfferWindowEntry[]): Group[] {
  const today = todayAWST();
  const in7Days = new Date(today.getTime() + 7 * 86_400_000);

  const groups: Record<string, OfferWindowEntry[]> = {
    TODAY: [],
    TOMORROW: [],
    THIS_WEEK: [],
    LATER: [],
    NO_DATE: [],
  };

  for (const entry of entries) {
    if (!entry.closingDate) {
      groups.NO_DATE.push(entry);
      continue;
    }
    const entryDay = toAWSTDate(entry.closingDate);
    const diff = daysDiff(entryDay, today);

    if (diff === 0) {
      groups.TODAY.push(entry);
    } else if (diff === 1) {
      groups.TOMORROW.push(entry);
    } else if (diff >= 2 && entryDay <= in7Days) {
      groups.THIS_WEEK.push(entry);
    } else {
      groups.LATER.push(entry);
    }
  }

  // Within each group, float urgent entries to the top, then sort by closingDate asc
  function sortGroup(arr: OfferWindowEntry[]): OfferWindowEntry[] {
    return [...arr].sort((a, b) => {
      const aUrgent = a.closingDate ? isUrgent(a.closingDate) : false;
      const bUrgent = b.closingDate ? isUrgent(b.closingDate) : false;
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      if (!a.closingDate && !b.closingDate) return 0;
      if (!a.closingDate) return 1;
      if (!b.closingDate) return -1;
      return new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime();
    });
  }

  const result: Group[] = [];
  if (groups.TODAY.length > 0)
    result.push({ label: "TODAY", entries: sortGroup(groups.TODAY) });
  if (groups.TOMORROW.length > 0)
    result.push({ label: "TOMORROW", entries: sortGroup(groups.TOMORROW) });
  if (groups.THIS_WEEK.length > 0)
    result.push({ label: "THIS WEEK", entries: sortGroup(groups.THIS_WEEK) });
  if (groups.LATER.length > 0)
    result.push({ label: "LATER", entries: sortGroup(groups.LATER) });
  if (groups.NO_DATE.length > 0)
    result.push({ label: "NO CLOSING DATE", entries: groups.NO_DATE });

  return result;
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(closingDate: string | null): string | null {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!closingDate) return;

    function compute() {
      const ms = new Date(closingDate!).getTime() - Date.now();
      if (ms <= 0) {
        setText("Closed");
        return;
      }
      const totalMins = Math.floor(ms / 60_000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      if (hours > 0) {
        setText(`${hours}h ${mins}m remaining`);
      } else {
        setText(`${mins}m remaining`);
      }
    }

    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [closingDate]);

  return text;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE: { label: "Active", bg: "#dcfce7", color: "#15803d" },
  COMING_SOON: { label: "Coming Soon", bg: "#e0e7ff", color: "#3730a3" },
  UNDER_OFFER: { label: "Under Offer", bg: "#f3f4f6", color: "#374151" },
};

function closingSoonBadge(): { label: string; bg: string; color: string } {
  return { label: "Closing Soon", bg: "#fef9c3", color: "#a16207" };
}

// ─── Entry row ────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: OfferWindowEntry }) {
  const showTodayCountdown =
    entry.closingDate !== null && toAWSTDate(entry.closingDate).getTime() === todayAWST().getTime();
  const urgent = entry.closingDate ? isUrgent(entry.closingDate) : false;
  const countdown = useCountdown(showTodayCountdown ? entry.closingDate : null);

  const badge =
    urgent && entry.closingDate
      ? closingSoonBadge()
      : STATUS_BADGE[entry.status] ?? { label: entry.status, bg: "#f3f4f6", color: "#374151" };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        background: urgent ? "rgba(232,168,56,0.07)" : "#ffffff",
        border: "1px solid #e5e2db",
        borderLeft: urgent ? "3px solid #e8a838" : "1px solid #e5e2db",
        borderRadius: 10,
        padding: "14px 16px",
        transition: "box-shadow 0.15s",
      }}
    >
      {/* Thumbnail + link */}
      <Link
        href={`/listings/${entry.listingId}`}
        style={{ flexShrink: 0, textDecoration: "none" }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            overflow: "hidden",
            background: entry.thumbnailUrl
              ? undefined
              : "linear-gradient(135deg, #0f1a2e, #334766)",
            flexShrink: 0,
          }}
        >
          {entry.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.thumbnailUrl}
              alt={entry.streetAddress}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
      </Link>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Address link */}
        <Link
          href={`/listings/${entry.listingId}`}
          style={{ textDecoration: "none" }}
        >
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: "#0f1a2e",
              marginBottom: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.streetAddress}
          </p>
        </Link>

        {/* Suburb / state */}
        <p
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 4,
          }}
        >
          {entry.suburb}, {entry.state} {entry.postcode}
        </p>

        {/* Closing time */}
        {entry.closingDate ? (
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 12,
              color: urgent ? "#e8a838" : "#6b7280",
              marginBottom: 4,
              fontWeight: urgent ? 600 : 400,
            }}
          >
            Closes {formatClosingTime(entry.closingDate)} AWST
            {countdown && (
              <span
                style={{
                  marginLeft: 6,
                  color: urgent ? "#e8a838" : "#9ca3af",
                  fontWeight: urgent ? 700 : 400,
                }}
              >
                ({countdown})
              </span>
            )}
            {!showTodayCountdown && (
              <span style={{ color: "#9ca3af", marginLeft: 4 }}>
                &middot; {formatClosingDateFull(entry.closingDate)}
              </span>
            )}
          </p>
        ) : (
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 4,
            }}
          >
            No closing date set
          </p>
        )}

        {/* Offer row */}
        {entry.myOffer && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Your offer:
            </span>
            <span
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "#0f1a2e",
              }}
            >
              {formatCurrency(entry.myOffer.amountCents)}
            </span>

            {entry.isHighest ? (
              <span
                style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  borderRadius: 10,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                Highest offer
              </span>
            ) : entry.highestOfferCents !== null ? (
              <span
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: 12,
                  color: "#e8a838",
                  fontWeight: 500,
                }}
              >
                Higher offer placed, current highest: {formatCurrency(entry.highestOfferCents)}
              </span>
            ) : null}

            {!entry.isHighest && entry.highestOfferCents !== null && (
              <Link
                href={`/listings/${entry.listingId}/offer`}
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: 12,
                  color: "#e8a838",
                  textDecoration: "underline",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Update Your Offer
              </Link>
            )}
          </div>
        )}

        {/* No personal offer, but listing is watchlisted */}
        {!entry.myOffer && entry.highestOfferCents !== null && (
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 12,
              color: "#6b7280",
              marginTop: 4,
            }}
          >
            Current highest offer: {formatCurrency(entry.highestOfferCents)}
          </p>
        )}
      </div>

      {/* Status badge */}
      <span
        style={{
          background: badge.bg,
          color: badge.color,
          borderRadius: 6,
          padding: "3px 9px",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "Outfit, sans-serif",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {badge.label}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OfferWindowsTab({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<OfferWindowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const joinedListingsRef = useRef<Set<string>>(new Set());

  async function fetchEntries() {
    try {
      const res = await fetch("/api/buyer/offer-windows");
      if (!res.ok) return;
      const data = (await res.json()) as { entries: OfferWindowEntry[] };
      setEntries(data.entries);
    } catch {
      // silently fail, stale data is acceptable
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    void fetchEntries();
  }, []);

  // Socket.io: join rooms for all listed listings, re-fetch on new offer
  useEffect(() => {
    if (entries.length === 0) return;

    if (!socketRef.current) {
      socketRef.current = io({ path: "/socket.io" });
    }
    const socket = socketRef.current;

    const listingIds = Array.from(new Set(entries.map((e) => e.listingId)));
    const toJoin = listingIds.filter((id) => !joinedListingsRef.current.has(id));

    for (const id of toJoin) {
      socket.emit("join_listing", { listingId: id });
      joinedListingsRef.current.add(id);
    }

    function onOfferNew({ listingId }: { listingId: string }) {
      if (joinedListingsRef.current.has(listingId)) {
        void fetchEntries();
      }
    }

    socket.on("offer:new", onOfferNew);

    return () => {
      socket.off("offer:new", onOfferNew);
    };
  }, [entries]);

  // Cleanup on unmount: leave all rooms and disconnect
  useEffect(() => {
    const joinedRef = joinedListingsRef;
    const sockRef = socketRef;
    return () => {
      const socket = sockRef.current;
      if (socket) {
        for (const id of joinedRef.current) {
          socket.emit("leave_listing", { listingId: id });
        }
        socket.disconnect();
        sockRef.current = null;
      }
    };
  }, []);

  // Suppress unused variable warning: userId is passed for potential future
  // personalisation or tracking, and is part of the component API.
  void userId;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid #e5e2db",
            borderTopColor: "#0f1a2e",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "64px 32px",
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 12,
        }}
      >
        <p
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 8,
          }}
        >
          No upcoming offer windows.
        </p>
        <p
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 12,
            color: "#9ca3af",
            marginBottom: 24,
          }}
        >
          Browse listings to find properties with active offer windows.
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
            padding: "10px 22px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  const groups = groupEntries(entries);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {groups.map((group) => (
        <div key={group.label}>
          {/* Group header */}
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            {group.label}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {group.entries.map((entry) => (
              <EntryRow key={entry.listingId} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

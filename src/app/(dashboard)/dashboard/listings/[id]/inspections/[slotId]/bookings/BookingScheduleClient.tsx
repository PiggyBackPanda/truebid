"use client";

import { useState } from "react";

type BookingStatus = "CONFIRMED" | "ATTENDED" | "NO_SHOW" | "CANCELLED";

interface Buyer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  verificationStatus: string;
}

interface Booking {
  id: string;
  status: BookingStatus;
  note: string | null;
  createdAt: string;
  attendedAt: string | null;
  buyer: Buyer;
}

interface Props {
  listingId: string;
  slotId: string;
  startTime: string;
  endTime: string;
  maxGroups: number;
  confirmedCount: number;
  notes: string | null;
  initialBookings: Booking[];
  slotPassed: boolean;
}

const STATUS_LABELS: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  CONFIRMED: { label: "Confirmed",   bg: "#dcfce7", color: "#15803d" },
  ATTENDED:  { label: "Attended",    bg: "#fef3c7", color: "#b45309" },
  NO_SHOW:   { label: "No-show",     bg: "#fee2e2", color: "#dc2626" },
  CANCELLED: { label: "Cancelled",   bg: "#f3f4f6", color: "#6b7280" },
};

function formatSlotTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end   = new Date(endIso);
  const date  = start.toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Perth",
  });
  const startT = start.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  const endT   = end.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  return `${date} · ${startT} – ${endT}`;
}

export function BookingScheduleClient({
  listingId,
  slotId,
  startTime,
  endTime,
  maxGroups,
  confirmedCount,
  notes,
  initialBookings,
  slotPassed,
}: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active   = bookings.filter((b) => b.status !== "CANCELLED");
  const spotsLeft = maxGroups - active.filter((b) => b.status === "CONFIRMED").length;

  async function markAttendance(bookingId: string, status: "ATTENDED" | "NO_SHOW") {
    setMarkingId(bookingId);
    setError(null);
    try {
      const res = await fetch(
        `/api/listings/${listingId}/inspections/${slotId}/bookings/${bookingId}/attendance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await res.json() as { booking?: { status: BookingStatus; attendedAt: string | null }; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to update attendance.");
        return;
      }
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: data.booking!.status, attendedAt: data.booking!.attendedAt }
            : b
        )
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px", fontFamily: "Outfit, sans-serif" }}>
      {/* Back link */}
      <a
        href={`/dashboard/listings/${listingId}/inspections`}
        style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}
      >
        ← Back to inspections
      </a>

      {/* Slot summary */}
      <div style={{ background: "#f9fafb", border: "1px solid #e5e2db", borderRadius: 12, padding: "16px 20px", marginBottom: 32 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f1a2e", margin: "0 0 4px" }}>
          {formatSlotTime(startTime, endTime)}
        </p>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          {confirmedCount} confirmed · {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining of {maxGroups}
        </p>
        {notes && (
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, fontStyle: "italic" }}>{notes}</p>
        )}
      </div>

      {/* Section header */}
      <h1 style={{ fontFamily: "DM Serif Display, Georgia, serif", fontSize: 22, color: "#0f1a2e", marginBottom: 4 }}>
        Booking Schedule
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        {slotPassed
          ? "Mark attendance for each buyer who attended."
          : "Buyers who have booked this inspection slot."}
      </p>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
          {error}
        </div>
      )}

      {active.length === 0 ? (
        <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 12, padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
          No confirmed bookings for this slot.
        </div>
      ) : (
        <div>
          {active.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              slotPassed={slotPassed}
              onMark={markAttendance}
              isMarking={markingId === booking.id}
            />
          ))}
        </div>
      )}

      {/* Cancelled bookings */}
      {bookings.some((b) => b.status === "CANCELLED") && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Cancelled
          </h2>
          {bookings
            .filter((b) => b.status === "CANCELLED")
            .map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                slotPassed={slotPassed}
                onMark={markAttendance}
                isMarking={false}
              />
            ))}
        </section>
      )}
    </div>
  );
}

// ── BookingRow ─────────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  slotPassed,
  onMark,
  isMarking,
}: {
  booking: Booking;
  slotPassed: boolean;
  onMark: (id: string, status: "ATTENDED" | "NO_SHOW") => void;
  isMarking: boolean;
}) {
  const badge = STATUS_LABELS[booking.status] ?? STATUS_LABELS.CONFIRMED;
  const canMarkAttendance = slotPassed && booking.status === "CONFIRMED";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e2db",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 10,
        opacity: booking.status === "CANCELLED" ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        {/* Buyer info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0f1a2e", margin: 0 }}>
              {booking.buyer.firstName} {booking.buyer.lastName}
            </p>
            {booking.buyer.verificationStatus === "VERIFIED" && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 20, background: "#dcfce7", color: "#15803d", textTransform: "uppercase" }}>
                Verified
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 2px" }}>
            <a href={`mailto:${booking.buyer.email}`} style={{ color: "#6b7280", textDecoration: "none" }}>
              {booking.buyer.email}
            </a>
          </p>
          {booking.buyer.phone && (
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
              <a href={`tel:${booking.buyer.phone}`} style={{ color: "#6b7280", textDecoration: "none" }}>
                {booking.buyer.phone}
              </a>
            </p>
          )}
          {booking.note && (
            <p style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", marginTop: 6 }}>
              &ldquo;{booking.note}&rdquo;
            </p>
          )}
        </div>

        {/* Status + attendance actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>

          {canMarkAttendance && (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => onMark(booking.id, "ATTENDED")}
                disabled={isMarking}
                style={attendanceBtn("#dcfce7", "#15803d")}
              >
                {isMarking ? "…" : "Attended"}
              </button>
              <button
                onClick={() => onMark(booking.id, "NO_SHOW")}
                disabled={isMarking}
                style={attendanceBtn("#fee2e2", "#dc2626")}
              >
                {isMarking ? "…" : "No-show"}
              </button>
            </div>
          )}

          {booking.status === "ATTENDED" && booking.attendedAt && (
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
              Marked{" "}
              {new Date(booking.attendedAt).toLocaleTimeString("en-AU", {
                hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function attendanceBtn(bg: string, color: string): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
    background: bg, color, border: "none", cursor: "pointer",
    fontFamily: "Outfit, sans-serif",
  };
}

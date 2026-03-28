"use client";

import { useState } from "react";

type SlotType = "OPEN_HOUSE" | "SCHEDULED";
type SlotStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface Slot {
  id: string;
  type: SlotType;
  status: SlotStatus;
  startTime: string;
  endTime: string;
  maxGroups: number;
  notes: string | null;
  confirmedBookings: number;
}

interface Props {
  listingId: string;
  listingAddress: string;
  listingStatus: string;
  requireInspection: boolean;
  initialSlots: Slot[];
}

function formatSlotTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateStr = start.toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Perth",
  });
  const startTime = start.toLocaleTimeString("en-AU", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth",
  });
  const endTime = end.toLocaleTimeString("en-AU", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth",
  });
  return `${dateStr} · ${startTime} – ${endTime}`;
}

function isPast(startIso: string): boolean {
  return new Date(startIso) < new Date();
}

export function InspectionManagementClient({
  listingId,
  listingAddress,
  initialSlots,
}: Props) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<SlotType>("SCHEDULED");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const upcoming = slots.filter((s) => s.status !== "CANCELLED" && !isPast(s.startTime));
  const past = slots.filter((s) => s.status === "COMPLETED" || (isPast(s.startTime) && s.status !== "CANCELLED"));
  const cancelled = slots.filter((s) => s.status === "CANCELLED");

  async function handleCancel(slotId: string) {
    if (!confirm("Cancel this inspection slot? Booked attendees will be notified.")) return;
    setCancelling(slotId);
    try {
      const res = await fetch(`/api/listings/${listingId}/inspections/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, status: "CANCELLED" } : s));
      }
    } finally {
      setCancelling(null);
    }
  }

  function onSlotCreated(slot: Slot) {
    setSlots((prev) => [...prev, slot].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
    setShowAddModal(false);
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px", fontFamily: "Outfit, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <a
          href={`/dashboard/seller/${listingId}`}
          style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}
        >
          ← Back to dashboard
        </a>
        <h1 style={{ fontFamily: "DM Serif Display, Georgia, serif", fontSize: 26, color: "#0f1a2e", marginBottom: 4 }}>
          Inspections
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>{listingAddress}</p>
      </div>

      {/* Add buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <button
          onClick={() => { setAddType("SCHEDULED"); setShowAddModal(true); }}
          style={btnStyle("#0f1a2e", "#ffffff")}
        >
          + Scheduled Slot
        </button>
        <button
          onClick={() => { setAddType("OPEN_HOUSE"); setShowAddModal(true); }}
          style={btnStyle("#f3f4f6", "#374151")}
        >
          + Open House
        </button>
      </div>

      {/* Upcoming slots */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 && (
          <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 12, padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            No upcoming inspections scheduled.
          </div>
        )}
        {upcoming.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            listingId={listingId}
            onCancel={handleCancel}
            cancelling={cancelling === slot.id}
          />
        ))}
      </section>

      {/* Past slots */}
      {past.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Past ({past.length})
          </h2>
          {past.map((slot) => (
            <SlotCard key={slot.id} slot={slot} listingId={listingId} onCancel={handleCancel} cancelling={false} isPast />
          ))}
        </section>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Cancelled ({cancelled.length})
          </h2>
          {cancelled.map((slot) => (
            <SlotCard key={slot.id} slot={slot} listingId={listingId} onCancel={handleCancel} cancelling={false} />
          ))}
        </section>
      )}

      {/* Add slot modal */}
      {showAddModal && (
        <AddSlotModal
          listingId={listingId}
          defaultType={addType}
          onCreated={onSlotCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ── SlotCard ──────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  listingId,
  onCancel,
  cancelling,
  isPast: past = false,
}: {
  slot: Slot;
  listingId: string;
  onCancel: (id: string) => void;
  cancelling: boolean;
  isPast?: boolean;
}) {
  const isCancelled = slot.status === "CANCELLED";

  return (
    <div
      style={{
        background: isCancelled ? "#fafafa" : "#ffffff",
        border: `1px solid ${isCancelled ? "#e5e7eb" : "#e5e2db"}`,
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 12,
        opacity: isCancelled ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              padding: "2px 8px", borderRadius: 20,
              background: slot.type === "OPEN_HOUSE" ? "#dbeafe" : "#dcfce7",
              color: slot.type === "OPEN_HOUSE" ? "#1d4ed8" : "#15803d",
            }}>
              {slot.type === "OPEN_HOUSE" ? "Open House" : "Scheduled"}
            </span>
            {isCancelled && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#fee2e2", color: "#dc2626" }}>
                Cancelled
              </span>
            )}
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0f1a2e", margin: 0 }}>
            {formatSlotTime(slot.startTime, slot.endTime)}
          </p>
          {slot.type === "SCHEDULED" && !isCancelled && (
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              {slot.confirmedBookings} / {slot.maxGroups} spots booked
            </p>
          )}
          {slot.type === "OPEN_HOUSE" && (
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>No booking required</p>
          )}
          {slot.notes && (
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, fontStyle: "italic" }}>{slot.notes}</p>
          )}
        </div>

        {!isCancelled && !past && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {slot.type === "SCHEDULED" && (
              <a
                href={`/dashboard/listings/${listingId}/inspections/${slot.id}/bookings`}
                style={smallLinkStyle}
              >
                View Bookings
              </a>
            )}
            <button
              onClick={() => onCancel(slot.id)}
              disabled={cancelling}
              style={{ ...smallBtnStyle, color: "#dc2626", opacity: cancelling ? 0.5 : 1 }}
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AddSlotModal ──────────────────────────────────────────────────────────────

function AddSlotModal({
  listingId,
  defaultType,
  onCreated,
  onClose,
}: {
  listingId: string;
  defaultType: SlotType;
  onCreated: (slot: Slot) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<SlotType>(defaultType);
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [maxGroups, setMaxGroups] = useState(4);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Generate time options in 30-min increments 8am–7pm
  const timeOptions: string[] = [];
  for (let h = 8; h <= 19; h++) {
    timeOptions.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 19) timeOptions.push(`${String(h).padStart(2, "0")}:30`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startHour) return;
    setSubmitting(true);
    setError("");

    const startTime = new Date(`${date}T${startHour}:00+08:00`);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    try {
      const res = await fetch(`/api/listings/${listingId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          maxGroups: type === "SCHEDULED" ? maxGroups : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json() as { slot?: Slot; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to create slot.");
        return;
      }
      onCreated({ ...data.slot!, confirmedBookings: 0 });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,26,46,0.5)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ fontFamily: "DM Serif Display, Georgia, serif", fontSize: 20, color: "#0f1a2e", marginBottom: 20 }}>
          Add Inspection Slot
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Type selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["SCHEDULED", "OPEN_HOUSE"] as SlotType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: `2px solid ${type === t ? "#0f1a2e" : "#e5e7eb"}`,
                  background: type === t ? "#0f1a2e" : "#ffffff",
                  color: type === t ? "#ffffff" : "#374151",
                }}
              >
                {t === "SCHEDULED" ? "Scheduled (book a time)" : "Open House (walk in)"}
              </button>
            ))}
          </div>

          {/* Date */}
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            required
            style={inputStyle}
          />

          {/* Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Start time</label>
              <select value={startHour} onChange={(e) => setStartHour(e.target.value)} style={inputStyle}>
                {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={inputStyle}>
                {[15, 20, 30, 45, 60].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>

          {/* Capacity (SCHEDULED only) */}
          {type === "SCHEDULED" && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Max groups</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button" onClick={() => setMaxGroups(Math.max(1, maxGroups - 1))} style={stepperBtn}>−</button>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#0f1a2e", minWidth: 24, textAlign: "center" }}>{maxGroups}</span>
                <button type="button" onClick={() => setMaxGroups(Math.min(20, maxGroups + 1))} style={stepperBtn}>+</button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes for attendees (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder='e.g. "Park on the street"'
              style={{ ...inputStyle, resize: "none" }}
            />
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{notes.length}/300</p>
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button type="button" onClick={onClose} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || !date} style={btnStyle("#e8a838", "#0f1a2e")}>
              {submitting ? "Adding…" : "Add slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", fontSize: 14, color: "#0f1a2e",
  border: "1px solid #e5e7eb", borderRadius: 8,
  padding: "9px 12px", background: "#ffffff", marginBottom: 16,
  boxSizing: "border-box", fontFamily: "Outfit, sans-serif",
};

const stepperBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb",
  background: "#f9fafb", fontSize: 18, cursor: "pointer", color: "#374151",
};

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: bg, color, border: "none", cursor: "pointer", fontFamily: "Outfit, sans-serif",
  };
}

const smallBtnStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, background: "none", border: "1px solid currentColor",
  borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "Outfit, sans-serif",
};

const smallLinkStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: "#0f1a2e", textDecoration: "none",
  border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px",
};

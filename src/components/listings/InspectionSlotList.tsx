"use client";

import { useState } from "react";

interface Slot {
  id: string;
  type: "OPEN_HOUSE" | "SCHEDULED";
  startTime: string;
  endTime: string;
  availableSpots: number | null;
  isFull: boolean;
  notes: string | null;
}

interface Props {
  slots: Slot[];
  listingId: string;
  isLoggedIn: boolean;
}

function formatSlotTime(startIso: string, endIso: string): { date: string; time: string } {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Perth",
  });
  const startTime = start.toLocaleTimeString("en-AU", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth",
  });
  const endTime = end.toLocaleTimeString("en-AU", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth",
  });
  return { date, time: `${startTime} – ${endTime}` };
}

function generateIcal(slot: Slot, address: string): string {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  const formatDt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TrueBid//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatDt(start)}`,
    `DTEND:${formatDt(end)}`,
    `SUMMARY:Property Inspection — ${address}`,
    `LOCATION:${address}`,
    `DESCRIPTION:Property inspection at ${address}. Book via TrueBid.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcal(slot: Slot, address: string) {
  const content = generateIcal(slot, address);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inspection.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function InspectionSlotList({ slots, listingId, isLoggedIn }: Props) {
  const [bookingSlot, setBookingSlot] = useState<Slot | null>(null);

  if (slots.length === 0) return null;

  function handleBook(slot: Slot) {
    if (!isLoggedIn) {
      window.location.assign(`/login?callbackUrl=${encodeURIComponent(`/listings/${listingId}`)}`);
      return;
    }
    setBookingSlot(slot);
  }

  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-navy mb-3">Upcoming Inspections</h2>
      <div className="bg-white border border-border rounded-[12px] divide-y divide-border overflow-hidden">
        {slots.map((slot) => {
          const { date, time } = formatSlotTime(slot.startTime, slot.endTime);
          return (
            <div key={slot.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-navy">{date}</p>
                <p className="text-sm text-text-muted">{time}</p>
                {slot.type === "SCHEDULED" && (
                  <p className="text-xs text-text-muted mt-1">
                    {slot.isFull ? (
                      <span className="text-red-600 font-medium">Fully Booked</span>
                    ) : (
                      <span className="text-green font-medium">
                        {slot.availableSpots} spot{slot.availableSpots !== 1 ? "s" : ""} remaining
                      </span>
                    )}
                  </p>
                )}
                {slot.type === "OPEN_HOUSE" && (
                  <p className="text-xs text-green font-medium mt-1">Open House — no booking required</p>
                )}
                {slot.notes && (
                  <p className="text-xs text-text-muted mt-1 italic">{slot.notes}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                {slot.type === "SCHEDULED" && !slot.isFull && (
                  <button
                    onClick={() => handleBook(slot)}
                    className="text-xs font-semibold bg-amber text-navy px-4 py-2 rounded-[8px] hover:bg-amber/90 transition-colors whitespace-nowrap"
                  >
                    Book this inspection
                  </button>
                )}
                {slot.type === "SCHEDULED" && slot.isFull && (
                  <span className="text-xs font-medium text-gray-400 px-4 py-2 border border-gray-200 rounded-[8px]">
                    Fully Booked
                  </span>
                )}
                <button
                  onClick={() => downloadIcal(slot, "this property")}
                  className="text-xs text-text-muted hover:text-text transition-colors text-center"
                >
                  + Add to calendar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {bookingSlot && (
        <BookInspectionModal
          slot={bookingSlot}
          listingId={listingId}
          onClose={() => setBookingSlot(null)}
          onBooked={() => {
            setBookingSlot(null);
            // Reload to refresh available spots
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// ── Booking modal placeholder (fully implemented in Task 03) ──────────────────

function BookInspectionModal({
  slot,
  listingId,
  onClose,
  onBooked,
}: {
  slot: Slot;
  listingId: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { date, time } = formatSlotTime(slot.startTime, slot.endTime);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/listings/${listingId}/inspections/${slot.id}/bookings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note.trim() || undefined }),
        }
      );
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to book inspection.");
        return;
      }
      onBooked();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-2xl p-6 max-w-sm w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
          aria-label="Close"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="font-serif text-xl text-navy mb-1">Book Inspection</h2>
        <p className="text-sm text-text-muted mb-4">{date} · {time}</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-2">
            Note for the seller (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="e.g. Bringing my partner and a building inspector"
            className="w-full border border-border rounded-[8px] px-3 py-2.5 text-sm text-text resize-none mb-4 focus:outline-none focus:border-navy"
          />
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber text-navy font-semibold text-sm py-3 rounded-[10px] hover:bg-amber/90 transition-colors disabled:opacity-60"
          >
            {submitting ? "Booking…" : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}

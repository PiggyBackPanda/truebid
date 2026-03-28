"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  bookingId: string;
  listingId: string;
  slotId: string;
  address: string;
  timeStr: string;
}

export function CancelBookingClient({ bookingId, listingId, slotId, address, timeStr }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/listings/${listingId}/inspections/${slotId}/bookings/${bookingId}`,
        { method: "DELETE" }
      );
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Unable to cancel this booking.");
        return;
      }
      router.push("/dashboard/inspections");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", fontFamily: "Outfit, sans-serif", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <h1 style={{ fontFamily: "DM Serif Display, Georgia, serif", fontSize: 24, color: "#0f1a2e", marginBottom: 8 }}>
        Cancel inspection booking?
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>{address}</p>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>{timeStr}</p>

      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28 }}>
        You cannot cancel within 2 hours of the inspection. The seller will be notified.
      </p>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <a
          href="/dashboard/inspections"
          style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151", background: "#f3f4f6", textDecoration: "none" }}
        >
          Keep booking
        </a>
        <button
          onClick={handleCancel}
          disabled={submitting}
          style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: submitting ? "#fca5a5" : "#dc2626", color: "#ffffff",
            border: "none", cursor: submitting ? "not-allowed" : "pointer",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          {submitting ? "Cancelling…" : "Yes, cancel it"}
        </button>
      </div>
    </div>
  );
}

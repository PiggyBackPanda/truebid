import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

function formatSlotTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Perth",
  });
  const startT = start.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  const endT = end.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  return `${date} · ${startT} – ${endT}`;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  CONFIRMED: { label: "Confirmed", bg: "#dcfce7", color: "#15803d" },
  ATTENDED:  { label: "Attended ✓", bg: "#fef3c7", color: "#b45309" },
  NO_SHOW:   { label: "No-show", bg: "#fee2e2", color: "#dc2626" },
  CANCELLED: { label: "Cancelled", bg: "#f3f4f6", color: "#6b7280" },
};

export default async function BuyerInspectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string };

  const bookings = await prisma.inspectionBooking.findMany({
    where: { buyerId: user.id },
    orderBy: { slot: { startTime: "asc" } },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      slot: {
        select: {
          startTime: true,
          endTime: true,
          listing: {
            select: {
              id: true,
              streetAddress: true,
              suburb: true,
              state: true,
              postcode: true,
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.slot.startTime) > now
  );
  const past = bookings.filter(
    (b) => b.status !== "CANCELLED" && new Date(b.slot.startTime) <= now
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px", fontFamily: "Outfit, sans-serif" }}>
      <h1 style={{ fontFamily: "DM Serif Display, Georgia, serif", fontSize: 26, color: "#0f1a2e", marginBottom: 4 }}>
        My Inspections
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>
        Your upcoming and past property inspections
      </p>

      {/* Upcoming */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Upcoming ({upcoming.length})
        </h2>

        {upcoming.length === 0 && (
          <div style={{ background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 12, padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            No upcoming inspections.{" "}
            <Link href="/listings" style={{ color: "#e8a838", textDecoration: "none" }}>
              Browse listings
            </Link>
          </div>
        )}

        {upcoming.map((b) => (
          <BookingCard key={b.id} booking={b} showCancelLink />
        ))}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Past ({past.length})
          </h2>
          {past.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </section>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  showCancelLink = false,
}: {
  booking: {
    id: string;
    status: string;
    note: string | null;
    slot: {
      startTime: Date;
      endTime: Date;
      listing: { id: string; streetAddress: string; suburb: string; state: string; postcode: string };
    };
  };
  showCancelLink?: boolean;
}) {
  const { listing } = booking.slot;
  const address = `${listing.streetAddress}, ${listing.suburb} ${listing.state}`;
  const timeStr = formatSlotTime(booking.slot.startTime.toISOString(), booking.slot.endTime.toISOString());
  const badge = STATUS_LABELS[booking.status] ?? { label: booking.status, bg: "#f3f4f6", color: "#6b7280" };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5e2db", borderRadius: 12, padding: "16px 20px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0f1a2e", margin: "0 0 2px" }}>
            <Link href={`/listings/${listing.id}`} style={{ color: "#0f1a2e", textDecoration: "none" }}>
              {address}
            </Link>
          </p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 8px" }}>{timeStr}</p>
          {booking.note && (
            <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", margin: 0 }}>
              &ldquo;{booking.note}&rdquo;
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
          <a
            href={`/api/inspections/${booking.id}/calendar`}
            style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}
          >
            + Calendar
          </a>
          {showCancelLink && (
            <Link href={`/dashboard/inspections/${booking.id}/cancel`} style={{ fontSize: 12, color: "#dc2626", textDecoration: "none" }}>
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

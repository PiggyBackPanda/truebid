import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CancelBookingClient } from "./CancelBookingClient";

type Props = { params: Promise<{ bookingId: string }> };

function formatSlotTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end   = new Date(endIso);
  const date  = start.toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Perth",
  });
  const startT = start.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  const endT   = end.toLocaleTimeString("en-AU",   { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  return `${date} · ${startT} – ${endT}`;
}

export default async function CancelBookingPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { bookingId } = await params;
  const user = session.user as { id: string };

  const booking = await prisma.inspectionBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      buyerId: true,
      status: true,
      slot: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          listing: {
            select: {
              id: true,
              streetAddress: true,
              suburb: true,
              state: true,
            },
          },
        },
      },
    },
  });

  if (!booking) return notFound();
  if (booking.buyerId !== user.id) redirect("/dashboard/inspections");
  if (booking.status !== "CONFIRMED") redirect("/dashboard/inspections");

  const { listing } = booking.slot;
  const address = `${listing.streetAddress}, ${listing.suburb} ${listing.state}`;
  const timeStr = formatSlotTime(booking.slot.startTime.toISOString(), booking.slot.endTime.toISOString());

  return (
    <CancelBookingClient
      bookingId={bookingId}
      listingId={listing.id}
      slotId={booking.slot.id}
      address={address}
      timeStr={timeStr}
    />
  );
}

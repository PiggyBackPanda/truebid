import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BookingScheduleClient } from "./BookingScheduleClient";

type Props = { params: Promise<{ id: string; slotId: string }> };

export default async function BookingSchedulePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id: listingId, slotId } = await params;
  const user = session.user as { id: string };

  const slot = await prisma.inspectionSlot.findUnique({
    where: { id: slotId },
    select: {
      id: true,
      listingId: true,
      startTime: true,
      endTime: true,
      maxGroups: true,
      notes: true,
      listing: { select: { id: true, sellerId: true, streetAddress: true, suburb: true, state: true } },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });

  if (!slot || slot.listingId !== listingId) return notFound();
  if (slot.listing.sellerId !== user.id) redirect("/dashboard");

  const bookings = await prisma.inspectionBooking.findMany({
    where: { slotId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,
      attendedAt: true,
      buyer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          verificationStatus: true,
        },
      },
    },
  });

  const slotPassed = slot.startTime < new Date();

  return (
    <BookingScheduleClient
      listingId={listingId}
      slotId={slotId}
      startTime={slot.startTime.toISOString()}
      endTime={slot.endTime.toISOString()}
      maxGroups={slot.maxGroups}
      confirmedCount={slot._count.bookings}
      notes={slot.notes ?? null}
      slotPassed={slotPassed}
      initialBookings={bookings.map((b) => ({
        id: b.id,
        status: b.status as "CONFIRMED" | "ATTENDED" | "NO_SHOW" | "CANCELLED",
        note: b.note,
        createdAt: b.createdAt.toISOString(),
        attendedAt: b.attendedAt?.toISOString() ?? null,
        buyer: {
          firstName: b.buyer.firstName,
          lastName: b.buyer.lastName,
          email: b.buyer.email,
          phone: b.buyer.phone ?? null,
          verificationStatus: b.buyer.verificationStatus,
        },
      }))}
    />
  );
}

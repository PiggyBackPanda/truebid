import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InspectionManagementClient } from "./InspectionManagementClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InspectionManagementPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string };

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      sellerId: true,
      streetAddress: true,
      suburb: true,
      state: true,
      status: true,
      requireInspection: true,
      inspectionSlots: {
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          type: true,
          status: true,
          startTime: true,
          endTime: true,
          maxGroups: true,
          notes: true,
          _count: {
            select: {
              bookings: { where: { status: "CONFIRMED" } },
            },
          },
        },
      },
    },
  });

  if (!listing || listing.sellerId !== user.id) notFound();

  const slots = listing.inspectionSlots.map((s) => ({
    id: s.id,
    type: s.type as "OPEN_HOUSE" | "SCHEDULED",
    status: s.status as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    maxGroups: s.maxGroups,
    notes: s.notes ?? null,
    confirmedBookings: s._count.bookings,
  }));

  return (
    <InspectionManagementClient
      listingId={id}
      listingAddress={`${listing.streetAddress}, ${listing.suburb} ${listing.state}`}
      listingStatus={listing.status}
      requireInspection={listing.requireInspection}
      initialSlots={slots}
    />
  );
}

import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsClient } from "./SettingsClient";

type Props = { params: Promise<{ id: string }> };

export default async function ListingSettingsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const user = session.user as { id: string };

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      sellerId: true,
      streetAddress: true,
      suburb: true,
      state: true,
      requireInspection: true,
      addressVisibility: true,
      _count: { select: { offers: { where: { status: "ACTIVE" } } } },
    },
  });

  if (!listing) return notFound();
  if (listing.sellerId !== user.id) redirect("/dashboard");

  const address = `${listing.streetAddress}, ${listing.suburb} ${listing.state}`;

  return (
    <SettingsClient
      listingId={id}
      listingAddress={address}
      initialRequireInspection={listing.requireInspection}
      initialAddressVisibility={listing.addressVisibility as "PUBLIC" | "LOGGED_IN" | "BOOKED_ONLY"}
      hasOffers={listing._count.offers > 0}
    />
  );
}

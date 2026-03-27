import type { Metadata } from "next";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "Buyer Dashboard",
  description: "Track your offers, saved listings, and messages.",
};
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { BuyerDashboardClient } from "@/components/dashboard/BuyerDashboardClient";

export default async function BuyerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: string; firstName?: string };

  const saveRows = await prisma.favourite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { listingId: true, createdAt: true },
  });

  const [savedListingsRaw, rawOffers, messages, unreadGroups] = await Promise.all([
    saveRows.length === 0
      ? Promise.resolve([])
      : prisma.listing.findMany({
          where: { id: { in: saveRows.map((s) => s.listingId) } },
          select: {
            id: true,
            streetAddress: true,
            suburb: true,
            state: true,
            status: true,
            saleMethod: true,
            closingDate: true,
            _count: { select: { offers: { where: { status: "ACTIVE" } } } },
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { thumbnailUrl: true },
            },
          },
        }),

    prisma.offer.findMany({
      where: { buyerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        amountCents: true,
        conditionType: true,
        conditionText: true,
        settlementDays: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        listing: {
          select: {
            id: true,
            streetAddress: true,
            suburb: true,
            state: true,
            status: true,
            saleMethod: true,
            closingDate: true,
            offers: {
              where: { status: "ACTIVE" },
              select: { id: true, amountCents: true },
              orderBy: { amountCents: "desc" },
            },
          },
        },
      },
    }),

    prisma.message.findMany({
      where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
      orderBy: { createdAt: "desc" },
      select: {
        senderId: true,
        recipientId: true,
        listingId: true,
        content: true,
        status: true,
        createdAt: true,
        listing: { select: { streetAddress: true, suburb: true } },
        sender: {
          select: { id: true, firstName: true, lastName: true, publicAlias: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, publicAlias: true },
        },
      },
    }),

    prisma.message.groupBy({
      by: ["listingId", "senderId"],
      where: { recipientId: user.id, status: { not: "READ" } },
      _count: { id: true },
    }),
  ]);

  // Process saved listings — join save rows with listing data, preserve order
  const listingById = new Map(savedListingsRaw.map((l) => [l.id, l]));
  const savedListings = saveRows
    .map((s) => {
      const l = listingById.get(s.listingId);
      if (!l) return null;
      return {
        savedAt: s.createdAt.toISOString(),
        listing: {
          id: l.id,
          streetAddress: l.streetAddress,
          suburb: l.suburb,
          state: l.state,
          status: l.status,
          saleMethod: l.saleMethod,
          closingDate: l.closingDate?.toISOString() ?? null,
          activeOfferCount: l._count.offers,
          thumbnail: l.images[0]?.thumbnailUrl ?? null,
        },
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  // Process offers with computed rank
  const myOffers = rawOffers.map((o) => {
    const allActive = o.listing.offers;
    const rankIdx = o.status === "ACTIVE" ? allActive.findIndex((a) => a.id === o.id) : -1;
    const rank = rankIdx >= 0 ? rankIdx + 1 : null;
    return {
      id: o.id,
      amountCents: o.amountCents,
      conditionType: o.conditionType,
      conditionText: o.conditionText,
      settlementDays: o.settlementDays,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      rank,
      totalOffers: allActive.length,
      listing: {
        id: o.listing.id,
        streetAddress: o.listing.streetAddress,
        suburb: o.listing.suburb,
        state: o.listing.state,
        status: o.listing.status,
        saleMethod: o.listing.saleMethod,
        closingDate: o.listing.closingDate?.toISOString() ?? null,
      },
    };
  });

  // Build unread lookup: "listingId:senderId" → count
  const unreadMap = new Map<string, number>();
  for (const row of unreadGroups) {
    unreadMap.set(`${row.listingId}:${row.senderId}`, row._count.id);
  }

  // Group messages into conversations by (listingId, counterpartyId)
  type Conversation = {
    listingId: string;
    listingAddress: string;
    counterparty: { id: string; firstName: string; lastName: string; publicAlias: string };
    lastMessage: { content: string; createdAt: string; isFromMe: boolean };
    unreadCount: number;
  };

  const seen = new Map<string, Conversation>();
  for (const msg of messages) {
    const counterparty = msg.senderId === user.id ? msg.recipient : msg.sender;
    const key = `${msg.listingId}:${counterparty.id}`;
    if (!seen.has(key)) {
      seen.set(key, {
        listingId: msg.listingId,
        listingAddress: `${msg.listing.streetAddress}, ${msg.listing.suburb}`,
        counterparty: {
          id: counterparty.id,
          firstName: counterparty.firstName,
          lastName: counterparty.lastName,
          publicAlias: counterparty.publicAlias,
        },
        lastMessage: {
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          isFromMe: msg.senderId === user.id,
        },
        unreadCount: unreadMap.get(`${msg.listingId}:${counterparty.id}`) ?? 0,
      });
    }
  }

  const conversations = Array.from(seen.values());

  return (
    <BuyerDashboardClient
      currentUserId={user.id}
      savedListings={savedListings}
      myOffers={myOffers}
      initialConversations={conversations}
    />
  );
}

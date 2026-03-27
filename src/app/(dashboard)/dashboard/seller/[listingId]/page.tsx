import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { SellerDashboardClient } from "@/components/dashboard/SellerDashboardClient";
import type { SellerOffer } from "@/hooks/useSellerDashboard";

export default async function SellerListingDashboard({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as {
    id: string;
    role?: string;
    firstName?: string;
  };

  if (user.role !== "SELLER" && user.role !== "BOTH") {
    redirect("/dashboard");
  }

  const { listingId } = await params;

  // Fetch listing and verify ownership
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      sellerId: true,
      streetAddress: true,
      suburb: true,
      state: true,
      status: true,
      saleMethod: true,
      closingDate: true,
    },
  });

  if (!listing || listing.sellerId !== user.id) {
    notFound();
  }

  const listingAddress = `${listing.streetAddress}, ${listing.suburb} ${listing.state}`;

  // Fetch offers with full buyer details
  const rawOffers = await prisma.offer.findMany({
    where: { listingId },
    orderBy: [{ amountCents: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      amountCents: true,
      conditionType: true,
      conditionText: true,
      settlementDays: true,
      personalNote: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      buyer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          publicAlias: true,
          verificationStatus: true,
        },
      },
      history: {
        orderBy: { createdAt: "desc" },
        select: {
          previousAmountCents: true,
          newAmountCents: true,
          changeType: true,
          createdAt: true,
        },
      },
    },
  });

  const initialOffers: SellerOffer[] = rawOffers.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    history: o.history.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
  }));

  // Fetch aggregated stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewsToday, savesListingToday, unreadMessages] = await Promise.all([
    prisma.listingView.count({
      where: { listingId, date: { gte: today } },
    }),
    prisma.favourite.count({
      where: { listingId, createdAt: { gte: today } },
    }),
    prisma.message.count({
      where: { recipientId: user.id, status: { not: "READ" } },
    }),
  ]);

  const activeOfferCount = initialOffers.filter((o) => o.status === "ACTIVE").length;
  const highestOfferCents =
    initialOffers.find((o) => o.status === "ACTIVE")?.amountCents ?? null;

  const initialStats = {
    totalViews: listing ? rawOffers.length : 0, // will be overridden below
    totalViewsToday: viewsToday,
    totalSaves: 0,
    totalSavesToday: savesListingToday,
    activeOffers: activeOfferCount,
    highestOfferCents,
    unreadMessages,
    activeListings: 1,
  };

  // Fetch real view/save counts from the listing itself
  const listingCounts = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { viewCount: true, saveCount: true },
  });

  initialStats.totalViews = listingCounts?.viewCount ?? 0;
  initialStats.totalSaves = listingCounts?.saveCount ?? 0;

  // Fetch conversations for this listing involving the seller
  const messages = await prisma.message.findMany({
    where: {
      listingId,
      OR: [{ senderId: user.id }, { recipientId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      senderId: true,
      recipientId: true,
      content: true,
      status: true,
      createdAt: true,
      sender: {
        select: { id: true, firstName: true, lastName: true, publicAlias: true },
      },
      recipient: {
        select: { id: true, firstName: true, lastName: true, publicAlias: true },
      },
    },
  });

  // Group into conversations by counterparty
  type ConvRow = {
    listingId: string;
    listingAddress: string;
    counterparty: {
      id: string;
      firstName: string;
      lastName: string;
      publicAlias: string;
    };
    lastMessage: { content: string; createdAt: string; isFromMe: boolean };
    unreadCount: number;
  };

  const seen = new Map<string, ConvRow>();
  for (const msg of messages) {
    const counterparty =
      msg.senderId === user.id ? msg.recipient : msg.sender;
    if (!seen.has(counterparty.id)) {
      seen.set(counterparty.id, {
        listingId,
        listingAddress,
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
        unreadCount: 0,
      });
    }
  }

  // Count unread per conversation
  const unreadCounts = await prisma.message.groupBy({
    by: ["senderId"],
    where: {
      listingId,
      recipientId: user.id,
      status: { not: "READ" },
    },
    _count: { id: true },
  });

  for (const row of unreadCounts) {
    const convo = seen.get(row.senderId);
    if (convo) {
      convo.unreadCount = row._count.id;
    }
  }

  const initialConversations = Array.from(seen.values());

  // Fetch checklist progress
  const checklistRows = await prisma.checklistProgress.findMany({
    where: { userId: user.id, state: "WA" },
    select: { itemKey: true, status: true, completedAt: true },
  });

  const initialChecklist = checklistRows.map((r) => ({
    itemKey: r.itemKey,
    status: r.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
  }));

  return (
    <SellerDashboardClient
      listingId={listingId}
      listingStatus={listing.status}
      listingAddress={listingAddress}
      currentUserId={user.id}
      initialOffers={initialOffers}
      initialStats={initialStats}
      initialConversations={initialConversations}
      initialChecklist={initialChecklist}
    />
  );
}

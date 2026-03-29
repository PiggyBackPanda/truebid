import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { MessagesPageClient } from "@/components/dashboard/MessagesPageClient";

export const metadata = { title: "Messages | TrueBid" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: string };
  const { id: initialId } = await searchParams;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: user.id }, { sellerId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      buyerId: true,
      sellerId: true,
      listing: {
        select: {
          id: true,
          streetAddress: true,
          suburb: true,
          state: true,
        },
      },
      offer: { select: { amountCents: true } },
      buyer: { select: { id: true, firstName: true, lastName: true } },
      seller: { select: { id: true, firstName: true, lastName: true } },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { senderId: true, body: true, sentAt: true },
      },
    },
  });

  const unreadCounts = await Promise.all(
    conversations.map((conv) =>
      prisma.conversationMessage.count({
        where: {
          conversationId: conv.id,
          senderId: { not: user.id },
          readAt: null,
        },
      })
    )
  );

  const serialised = conversations.map((conv, i) => {
    const other = conv.buyerId === user.id ? conv.seller : conv.buyer;
    const lastMsg = conv.messages[0] ?? null;
    return {
      id: conv.id,
      createdAt: conv.createdAt.toISOString(),
      listing: {
        id: conv.listing.id,
        streetAddress: conv.listing.streetAddress,
        address: `${conv.listing.streetAddress}, ${conv.listing.suburb} ${conv.listing.state}`,
      },
      offer: { amountCents: conv.offer.amountCents },
      other: {
        id: other.id,
        firstName: other.firstName,
        lastName: other.lastName,
      },
      lastMessage: lastMsg
        ? {
            body: lastMsg.body,
            sentAt: lastMsg.sentAt.toISOString(),
            isFromMe: lastMsg.senderId === user.id,
          }
        : null,
      unreadCount: unreadCounts[i],
    };
  });

  return (
    <MessagesPageClient
      currentUserId={user.id}
      initialConversations={serialised}
      initialConversationId={initialId ?? null}
    />
  );
}

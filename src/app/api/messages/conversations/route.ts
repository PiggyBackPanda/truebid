import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";

// GET /api/messages/conversations — all conversations for the current user
export async function GET() {
  try {
    const user = await requireAuth();

    // Get latest message per (listingId, counterpartyId) pair
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: user.id }, { recipientId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        listingId: true,
        content: true,
        status: true,
        createdAt: true,
        listing: {
          select: { id: true, streetAddress: true, suburb: true },
        },
        sender: {
          select: { id: true, firstName: true, lastName: true, publicAlias: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, publicAlias: true },
        },
      },
    });

    // Group by (listingId, counterpartyId)
    const seen = new Map<string, (typeof messages)[0]>();
    for (const msg of messages) {
      const counterpartyId =
        msg.senderId === user.id ? msg.recipientId : msg.senderId;
      const key = `${msg.listingId}:${counterpartyId}`;
      if (!seen.has(key)) {
        seen.set(key, msg);
      }
    }

    // For each conversation, count unread messages from counterparty
    const conversations = await Promise.all(
      Array.from(seen.values()).map(async (msg) => {
        const counterparty =
          msg.senderId === user.id ? msg.recipient : msg.sender;
        const unreadCount = await prisma.message.count({
          where: {
            listingId: msg.listingId,
            senderId: counterparty.id,
            recipientId: user.id,
            status: { not: "READ" },
          },
        });

        return {
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
          unreadCount,
        };
      })
    );

    // Sort by most recent message
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
    );

    return Response.json({ conversations });
  } catch (error) {
    return errorResponse(error);
  }
}

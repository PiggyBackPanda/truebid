import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";

// GET /api/conversations: list all conversations for the current user
export async function GET() {
  try {
    const user = await requireAuth();

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
            streetAddress: true,
            suburb: true,
            state: true,
          },
        },
        offer: {
          select: { amountCents: true },
        },
        buyer: {
          select: { id: true, firstName: true, lastName: true },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: {
            id: true,
            senderId: true,
            body: true,
            sentAt: true,
            readAt: true,
          },
        },
      },
    });

    // Single query to get unread counts for all conversations
    const unreadGroups = await prisma.conversationMessage.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: user.id },
        readAt: null,
      },
      _count: { id: true },
    });
    const unreadMap = new Map(
      unreadGroups.map((g) => [g.conversationId, g._count.id])
    );

    const results = conversations.map((conv) => {
      const unreadCount = unreadMap.get(conv.id) ?? 0;
      const other = conv.buyerId === user.id ? conv.seller : conv.buyer;
      const lastMsg = conv.messages[0] ?? null;

      return {
        id: conv.id,
        createdAt: conv.createdAt.toISOString(),
        listing: {
          id: conv.listing.id,
          address: `${conv.listing.streetAddress}, ${conv.listing.suburb} ${conv.listing.state}`,
          streetAddress: conv.listing.streetAddress,
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
        unreadCount,
      };
    });

    // Total unread across all conversations
    const totalUnread = results.reduce((sum, c) => sum + c.unreadCount, 0);

    return Response.json({ conversations: results, totalUnread });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/conversations: seller explicitly opens a conversation with a buyer after proceeding with their offer
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { offerId } = (await req.json()) as { offerId: string };

    if (!offerId) {
      throw new ApiError(400, "MISSING_OFFER_ID", "offerId is required");
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        status: true,
        buyerId: true,
        listingId: true,
        listing: { select: { sellerId: true } },
      },
    });

    if (!offer) {
      throw new ApiError(404, "NOT_FOUND", "Offer not found");
    }

    if (offer.listing.sellerId !== user.id) {
      throw new ApiError(403, "FORBIDDEN", "Only the seller can open a conversation");
    }

    if (offer.status !== "ACCEPTED") {
      throw new ApiError(400, "INVALID_STATUS", "A conversation can only be opened after proceeding with an offer");
    }

    // Idempotent: return existing conversation if already created
    const existing = await prisma.conversation.findUnique({
      where: { offerId },
      select: { id: true },
    });

    if (existing) {
      return Response.json({ conversationId: existing.id });
    }

    const conversation = await prisma.conversation.create({
      data: {
        offerId,
        listingId: offer.listingId,
        buyerId: offer.buyerId,
        sellerId: user.id,
      },
      select: { id: true },
    });

    return Response.json({ conversationId: conversation.id });
  } catch (error) {
    return errorResponse(error);
  }
}

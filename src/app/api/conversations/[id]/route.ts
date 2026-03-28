import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";

// GET /api/conversations/[id]: fetch conversation + all messages, mark incoming as read
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 200);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
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
        offer: {
          select: {
            id: true,
            amountCents: true,
            conditionType: true,
            settlementDays: true,
          },
        },
        buyer: {
          select: { id: true, firstName: true, lastName: true },
        },
        seller: {
          select: { id: true, firstName: true, lastName: true },
        },
        messages: {
          orderBy: { sentAt: "asc" },
          take: limit,
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

    if (!conversation) {
      throw new ApiError(404, "NOT_FOUND", "Conversation not found");
    }

    if (
      conversation.buyerId !== user.id &&
      conversation.sellerId !== user.id
    ) {
      throw new ApiError(403, "FORBIDDEN", "You are not a party to this conversation");
    }

    // Mark all unread incoming messages as read
    const now = new Date();
    await prisma.conversationMessage.updateMany({
      where: {
        conversationId: id,
        senderId: { not: user.id },
        readAt: null,
      },
      data: { readAt: now },
    });

    const other =
      conversation.buyerId === user.id ? conversation.seller : conversation.buyer;

    return Response.json({
      conversation: {
        id: conversation.id,
        createdAt: conversation.createdAt.toISOString(),
        listing: {
          id: conversation.listing.id,
          address: `${conversation.listing.streetAddress}, ${conversation.listing.suburb} ${conversation.listing.state}`,
          streetAddress: conversation.listing.streetAddress,
        },
        offer: {
          id: conversation.offer.id,
          amountCents: conversation.offer.amountCents,
          conditionType: conversation.offer.conditionType,
          settlementDays: conversation.offer.settlementDays,
        },
        other: {
          id: other.id,
          firstName: other.firstName,
          lastName: other.lastName,
        },
        buyer: conversation.buyer,
        seller: conversation.seller,
      },
      messages: conversation.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        body: m.body,
        sentAt: m.sentAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
      })),
      hasMoreMessages: conversation.messages.length === limit,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

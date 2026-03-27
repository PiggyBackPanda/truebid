import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/api-helpers";

// GET /api/messages/conversations/[listingId]/[userId] — get thread and mark as read
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string; userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { listingId, userId } = await params;

    // Fetch all messages in this thread (both directions)
    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: user.id, recipientId: userId },
          { senderId: userId, recipientId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderId: true,
        content: true,
        status: true,
        createdAt: true,
      },
    });

    // Mark all messages from the other user as READ
    await prisma.message.updateMany({
      where: {
        listingId,
        senderId: userId,
        recipientId: user.id,
        status: { not: "READ" },
      },
      data: { status: "READ", readAt: new Date() },
    });

    // Check if the counterparty has an active offer on this listing (for the info bar)
    const counterpartyOffer = await prisma.offer.findFirst({
      where: { listingId, buyerId: userId, status: "ACTIVE" },
      select: { amountCents: true, conditionType: true },
    });

    return Response.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
        isFromMe: m.senderId === user.id,
      })),
      counterpartyOffer: counterpartyOffer
        ? {
            amountCents: counterpartyOffer.amountCents,
            conditionType: counterpartyOffer.conditionType,
          }
        : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

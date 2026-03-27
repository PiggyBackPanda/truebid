import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { emitToConversation } from "@/lib/socket";
import { logger } from "@/lib/logger";
import { z } from "zod";

const UNREAD_EMAIL_DELAY_MS = 15 * 60 * 1000; // 15 minutes

const sendMessageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(4000),
});

// POST /api/conversations/[id]/messages — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const raw = await req.json();
    const { body } = sendMessageSchema.parse(raw);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        listing: { select: { streetAddress: true, suburb: true, state: true } },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            notificationPreferences: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            notificationPreferences: true,
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

    const message = await prisma.conversationMessage.create({
      data: {
        conversationId: id,
        senderId: user.id,
        body,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        body: true,
        sentAt: true,
        readAt: true,
      },
    });

    const serialised = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      sentAt: message.sentAt.toISOString(),
      readAt: null,
    };

    // Emit to conversation room so the other party sees it in real-time
    emitToConversation(id, "message:new", serialised);

    // Schedule unread email notification (15-minute delay).
    // Production: replace setTimeout with Upstash QStash scheduled message.
    const listingAddress = `${conversation.listing.streetAddress}, ${conversation.listing.suburb} ${conversation.listing.state}`;
    const sender = conversation.buyerId === user.id ? conversation.buyer : conversation.seller;
    const recipient = conversation.buyerId === user.id ? conversation.seller : conversation.buyer;
    const senderName = `${sender.firstName} ${sender.lastName}`;

    const recipientPrefs = recipient.notificationPreferences as
      | { messages?: boolean }
      | null;
    const shouldNotify = recipientPrefs?.messages !== false; // default true

    if (shouldNotify) {
      const emailPayload = {
        messageId: message.id,
        conversationId: id,
        recipientEmail: recipient.email,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        senderName,
        listingAddress,
        messagePreview: body,
      };

      const qstashUrl = process.env.QSTASH_URL;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const internalSecret = process.env.INTERNAL_API_SECRET;

      if (qstashUrl && internalSecret) {
        // Production: use Upstash QStash for reliable delayed delivery
        fetch(`${qstashUrl}/v2/publish/${baseUrl}/api/internal/send-unread-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.QSTASH_TOKEN ?? ""}`,
            "Upstash-Delay": `${UNREAD_EMAIL_DELAY_MS / 1000}s`,
          },
          body: JSON.stringify(emailPayload),
        }).catch((err) => logger.error("[messages] QStash schedule failed", err));
      } else {
        // Development fallback: setTimeout (does not survive server restarts)
        setTimeout(async () => {
          try {
            const res = await fetch(`${baseUrl}/api/internal/send-unread-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-internal-secret": internalSecret ?? "",
              },
              body: JSON.stringify(emailPayload),
            });
            if (!res.ok) logger.error("[messages] send-unread-email failed", await res.text());
          } catch (err) {
            logger.error("[messages] send-unread-email fetch failed", err);
          }
        }, UNREAD_EMAIL_DELAY_MS);
      }
    }

    return Response.json({ message: serialised }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

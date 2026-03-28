import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { createMessageSchema } from "@/lib/validation";
import { sendUnreadMessageEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

const URL_PATTERN = /https?:\/\/|www\./i;
const UNREAD_EMAIL_DELAY_MS = 15 * 60 * 1000; // 15 minutes

// POST /api/messages — send a message to another user about a listing
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { recipientId, listingId, content } = createMessageSchema.parse(body);

    if (recipientId === user.id) {
      throw new ApiError(400, "INVALID_RECIPIENT", "You cannot message yourself");
    }

    if (URL_PATTERN.test(content)) {
      throw new ApiError(400, "LINKS_NOT_ALLOWED", "Links are not allowed in messages for security reasons");
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, streetAddress: true, suburb: true, state: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    if (listing.status !== "ACTIVE" && listing.status !== "UNDER_OFFER") {
      throw new ApiError(400, "LISTING_UNAVAILABLE", "This listing is not accepting messages");
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        notificationPreferences: true,
      },
    });

    if (!recipient) {
      throw new ApiError(404, "NOT_FOUND", "Recipient not found");
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId,
        listingId,
        content,
        status: "SENT",
      },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        listingId: true,
        content: true,
        status: true,
        createdAt: true,
      },
    });

    // Schedule unread email notification (deferred 15 minutes)
    const recipientPrefs = recipient.notificationPreferences as
      | { messages?: boolean }
      | null;
    const shouldNotify = recipientPrefs?.messages !== false;

    if (shouldNotify) {
      const listingAddress = `${listing.streetAddress}, ${listing.suburb} ${listing.state}`;
      const senderName = `${user.firstName} ${user.lastName}`;

      // Development: setTimeout (does not survive server restarts)
      // Production: replace with Upstash QStash scheduled message
      setTimeout(async () => {
        try {
          const msg = await prisma.message.findUnique({
            where: { id: message.id },
            select: { readAt: true },
          });

          if (!msg || msg.readAt !== null) return;

          await sendUnreadMessageEmail({
            recipientEmail: recipient.email,
            recipientName: recipient.firstName,
            senderName,
            listingAddress,
            conversationId: message.id,
            messagePreview: content,
          });
        } catch (err) {
          logger.error("[messages] send-unread-email failed", err);
        }
      }, UNREAD_EMAIL_DELAY_MS);
    }

    return Response.json(
      {
        message: {
          ...message,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { createMessageSchema } from "@/lib/validation";

import { logger } from "@/lib/logger";

const URL_PATTERN = /https?:\/\/|www\./i;
const UNREAD_EMAIL_DELAY_MS = 15 * 60 * 1000; // 15 minutes

// POST /api/messages: send a message to another user about a listing
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
        lastName: true,
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

      const emailPayload = {
        messageId: message.id,
        conversationId: message.id,
        recipientEmail: recipient.email,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        senderName,
        listingAddress,
        messagePreview: content,
      };

      // Enqueue delayed email via Upstash QStash → /api/internal/send-unread-email
      const qstashUrl = process.env.QSTASH_URL;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://truebid.com.au";
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
            logger.error("[messages] send-unread-email failed", err);
          }
        }, UNREAD_EMAIL_DELAY_MS);
      }
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

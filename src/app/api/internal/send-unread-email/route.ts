import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendUnreadMessageEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  messageId: z.string().cuid(),
  conversationId: z.string().cuid(),
  recipientEmail: z.string().email(),
  recipientName: z.string(),
  senderName: z.string(),
  listingAddress: z.string(),
  messagePreview: z.string(),
});

/**
 * POST /api/internal/send-unread-email
 *
 * Called by Upstash QStash after a 15-minute delay to send an unread message
 * notification email — if the message is still unread at that point.
 *
 * In development, this is called directly via setTimeout.
 * In production, configure Upstash QStash to POST to this endpoint after 15 minutes.
 *
 * Authentication: requires the x-internal-secret header to exactly match
 * the INTERNAL_API_SECRET environment variable. Configure QStash to include
 * this header when calling the endpoint in production.
 */
export async function POST(req: NextRequest) {
  // Verify internal secret — must match INTERNAL_API_SECRET env var.
  // When using Upstash QStash in production, configure QStash to include
  // the secret as the x-internal-secret header value.
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = req.headers.get("x-internal-secret");

  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Only send if the message is still unread
    const message = await prisma.conversationMessage.findUnique({
      where: { id: data.messageId },
      select: { readAt: true },
    });

    if (!message || message.readAt !== null) {
      return Response.json({ skipped: true, reason: "message already read" });
    }

    await sendUnreadMessageEmail({
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      senderName: data.senderName,
      listingAddress: data.listingAddress,
      conversationId: data.conversationId,
      messagePreview: data.messagePreview,
    });

    return Response.json({ sent: true });
  } catch (error) {
    logger.error("[internal/send-unread-email]", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

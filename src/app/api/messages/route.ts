import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";
import { createMessageSchema } from "@/lib/validation";

// POST /api/messages — send a message to another user about a listing
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { recipientId, listingId, content } = createMessageSchema.parse(body);

    if (recipientId === user.id) {
      throw new ApiError(400, "INVALID_RECIPIENT", "You cannot message yourself");
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true },
    });

    if (!listing) {
      throw new ApiError(404, "NOT_FOUND", "Listing not found");
    }

    if (listing.status !== "ACTIVE" && listing.status !== "UNDER_OFFER") {
      throw new ApiError(400, "LISTING_UNAVAILABLE", "This listing is not accepting messages");
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
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

import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { requireAuth, ApiError, errorResponse } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// POST /api/verification/start
// Creates a Stripe Identity verification session and returns the client_secret.
// Rate limited to 5 attempts per user per 24 hours.
export async function POST() {
  try {
    const user = await requireAuth();

    // Rate limit: 5 attempts per user per 24 hours
    const rl = await rateLimit(`verify:user:${user.id}`, 5, 86400);
    if (!rl.success) {
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "Too many verification attempts. Please try again tomorrow."
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new ApiError(500, "CONFIG_ERROR", "Verification service is not configured");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Create Stripe Identity VerificationSession
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: { userId: user.id },
      options: {
        document: {
          allowed_types: ["driving_license", "passport", "id_card"],
          require_id_number: false,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
    });

    // Update user status to PENDING
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationStatus: "PENDING" },
    });

    // Audit log
    await prisma.verificationEvent.create({
      data: {
        userId: user.id,
        eventType: "session.created",
        provider: "stripe_identity",
        refId: session.id,
      },
    });

    logger.info("Verification session created", { userId: user.id });

    // Return ONLY the client_secret: never expose the full session object
    return Response.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

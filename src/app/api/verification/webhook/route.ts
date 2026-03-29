import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

// Disable body parsing: Stripe signature validation requires the raw body
export const dynamic = "force-dynamic";

// POST /api/verification/webhook
// Receives Stripe Identity webhook events. Validates signature on every request.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logger.warn("Webhook received without stripe-signature header");
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.warn("STRIPE_WEBHOOK_SECRET not configured");
    return Response.json({ error: "Webhook not configured" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn("STRIPE_SECRET_KEY not configured");
    return Response.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logger.warn("Stripe webhook signature validation failed", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Return 200 immediately: process inline (fast DB ops)
  const response = Response.json({ received: true });

  try {
    await handleEvent(event, stripe);
  } catch (err) {
    logger.error("Webhook handler error", { eventType: event.type, err });
  }

  return response;
}

async function handleEvent(event: Stripe.Event, stripe: Stripe) {
  const session = event.data.object as Stripe.Identity.VerificationSession;
  const userId = session.metadata?.userId;

  if (!userId) {
    logger.warn("Webhook event missing userId in metadata", { eventType: event.type });
    return;
  }

  // Audit log every event
  await prisma.verificationEvent.create({
    data: {
      userId,
      eventType: event.type,
      provider: "stripe_identity",
      refId: session.id,
    },
  });

  switch (event.type) {
    case "identity.verification_session.verified": {
      // Retrieve session with expanded verified_outputs to get name
      let verifiedName: string | null = null;
      try {
        const expanded = await stripe.identity.verificationSessions.retrieve(
          session.id,
          { expand: ["verified_outputs"] }
        );
        const outputs = expanded.verified_outputs as {
          first_name?: string | null;
          last_name?: string | null;
        } | null;
        if (outputs?.first_name || outputs?.last_name) {
          const fullName = [outputs.first_name, outputs.last_name]
            .filter(Boolean)
            .join(" ");
          // Encrypt before storing: never persist plaintext PII
          verifiedName = process.env.ENCRYPTION_KEY ? encrypt(fullName) : null;
        }
      } catch (err) {
        logger.warn("Could not retrieve verified outputs", err);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: "VERIFIED",
          verificationProvider: "stripe_identity",
          verificationRefId: session.id,
          verificationDate: new Date(),
          verifiedName,
        },
      });

      logger.info("User verified", { userId });
      break;
    }

    case "identity.verification_session.requires_input": {
      await prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: "REQUIRES_REVIEW" },
      });
      logger.info("Verification requires review", { userId });
      break;
    }

    case "identity.verification_session.canceled":
    case "identity.verification_session.processing":
      // No status change needed for these transitional states
      break;

    default:
      // Unhandled event type (already audit-logged above)
      break;
  }
}

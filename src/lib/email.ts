import { Resend } from "resend";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "TrueBid <noreply@truebid.com.au>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn("Email skipped — RESEND_API_KEY not set", { to, subject });
    return;
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    logger.error("Failed to send email", { to, subject, error });
  }
}

export async function sendNewOfferEmail({
  sellerEmail,
  sellerName,
  listingAddress,
  amountCents,
}: {
  sellerEmail: string;
  sellerName: string;
  listingAddress: string;
  amountCents: number;
}): Promise<void> {
  const amount = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(amountCents / 100);

  await sendEmail({
    to: sellerEmail,
    subject: `New offer received on ${listingAddress}`,
    html: `<p>Hi ${sellerName},</p><p>A new offer of <strong>${amount}</strong> has been placed on your listing at <strong>${listingAddress}</strong>.</p><p>Log in to your dashboard to review it.</p>`,
  });
}

export async function sendOfferAcceptedEmail({
  buyerEmail,
  buyerName,
  listingAddress,
  amountCents,
}: {
  buyerEmail: string;
  buyerName: string;
  listingAddress: string;
  amountCents: number;
}): Promise<void> {
  const amount = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(amountCents / 100);

  await sendEmail({
    to: buyerEmail,
    subject: `Your offer on ${listingAddress} has been accepted!`,
    html: `<p>Hi ${buyerName},</p><p>Congratulations! Your offer of <strong>${amount}</strong> on <strong>${listingAddress}</strong> has been accepted by the seller.</p><p>The seller will be in contact shortly to progress the sale.</p>`,
  });
}

export async function sendOfferRejectedEmail({
  buyerEmail,
  buyerName,
  listingAddress,
  amountCents,
}: {
  buyerEmail: string;
  buyerName: string;
  listingAddress: string;
  amountCents: number;
}): Promise<void> {
  const amount = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(amountCents / 100);

  await sendEmail({
    to: buyerEmail,
    subject: `Update on your offer for ${listingAddress}`,
    html: `<p>Hi ${buyerName},</p><p>The seller has accepted another offer on <strong>${listingAddress}</strong>. Your offer of <strong>${amount}</strong> was not selected.</p><p>We hope you find your perfect property soon.</p>`,
  });
}

export async function sendUnreadMessageEmail({
  recipientEmail,
  recipientName,
  senderName,
  listingAddress,
  conversationId,
  messagePreview,
}: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  listingAddress: string;
  conversationId: string;
  messagePreview: string;
}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://truebid.com.au";
  const preview = messagePreview.slice(0, 100);
  const link = `${baseUrl}/dashboard/messages/${conversationId}`;

  await sendEmail({
    to: recipientEmail,
    subject: `New message from ${senderName} about ${listingAddress}`,
    html: `
      <p>Hi ${recipientName},</p>
      <p>You have a new message from <strong>${senderName}</strong> regarding <strong>${listingAddress}</strong>.</p>
      <blockquote style="border-left:3px solid #e8a838;padding-left:12px;color:#334766;margin:16px 0;">
        "${preview}${messagePreview.length > 100 ? "…" : ""}"
      </blockquote>
      <p>
        <a href="${link}" style="background:#e8a838;color:#0f1a2e;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          View conversation →
        </a>
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
        This notification was sent because the message was unread for 15 minutes.
        Manage preferences in <a href="${baseUrl}/account">account settings</a>.
      </p>
    `,
  });
}

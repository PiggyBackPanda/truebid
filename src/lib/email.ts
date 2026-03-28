import { Resend } from "resend";
import { logger } from "@/lib/logger";

const FROM = process.env.EMAIL_FROM ?? "TrueBid <noreply@truebid.com.au>";
const BASE_URL = () => process.env.NEXT_PUBLIC_BASE_URL ?? "https://truebid.com.au";

function formatAUD(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:'Outfit',Helvetica,Arial,sans-serif;color:#0f1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#0f1a2e;padding:24px 32px;text-align:center;">
            <span style="font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#e8a838;letter-spacing:0.5px;">TrueBid</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #e5e1da;">
            <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5;">
              This email was sent by <a href="${BASE_URL()}" style="color:#e8a838;text-decoration:none;">TrueBid</a> — free, transparent property sales for Australia.
            </p>
            <p style="font-size:11px;color:#c0bdb6;margin:8px 0 0;">
              <a href="${BASE_URL()}/account" style="color:#c0bdb6;text-decoration:underline;">Manage email preferences</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0 8px;text-align:center;">
  <a href="${href}" style="display:inline-block;background:#e8a838;color:#0f1a2e;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>
</p>`;
}

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

  const resend = new Resend(process.env.RESEND_API_KEY);
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
  const amount = formatAUD(amountCents);

  await sendEmail({
    to: sellerEmail,
    subject: `New offer received on ${listingAddress}`,
    html: emailLayout(`
      <h2 style="font-family:'DM Serif Display',Georgia,serif;font-size:20px;margin:0 0 16px;color:#0f1a2e;">New Offer Received</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${sellerName},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        A new offer of <strong style="color:#0f1a2e;font-size:18px;">${amount}</strong>
        has been placed on your listing at <strong>${listingAddress}</strong>.
      </p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 8px;color:#334766;">
        Review the offer details, buyer profile, and conditions in your seller dashboard.
      </p>
      ${ctaButton(`${BASE_URL()}/dashboard/seller`, "View Offer Details")}
    `),
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
  const amount = formatAUD(amountCents);

  await sendEmail({
    to: buyerEmail,
    subject: `Your offer on ${listingAddress} has been accepted!`,
    html: emailLayout(`
      <h2 style="font-family:'DM Serif Display',Georgia,serif;font-size:20px;margin:0 0 16px;color:#0f1a2e;">Offer Accepted!</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${buyerName},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        Congratulations! Your offer of <strong style="color:#0f1a2e;font-size:18px;">${amount}</strong>
        on <strong>${listingAddress}</strong> has been accepted by the seller.
      </p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 8px;color:#334766;">
        A secure conversation has been opened between you and the seller. You can now exchange details and progress the sale.
      </p>
      ${ctaButton(`${BASE_URL()}/dashboard/messages`, "View Conversation")}
    `),
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
  const amount = formatAUD(amountCents);

  await sendEmail({
    to: buyerEmail,
    subject: `Update on your offer for ${listingAddress}`,
    html: emailLayout(`
      <h2 style="font-family:'DM Serif Display',Georgia,serif;font-size:20px;margin:0 0 16px;color:#0f1a2e;">Offer Update</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${buyerName},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        The seller has accepted another offer on <strong>${listingAddress}</strong>.
        Your offer of <strong>${amount}</strong> was not selected.
      </p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 8px;color:#334766;">
        There are new properties being listed every day. Keep searching and you will find your perfect home.
      </p>
      ${ctaButton(`${BASE_URL()}/listings`, "Browse Listings")}
    `),
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
  const preview = messagePreview.slice(0, 100);
  const link = `${BASE_URL()}/dashboard/messages/${conversationId}`;

  await sendEmail({
    to: recipientEmail,
    subject: `New message from ${senderName} about ${listingAddress}`,
    html: emailLayout(`
      <h2 style="font-family:'DM Serif Display',Georgia,serif;font-size:20px;margin:0 0 16px;color:#0f1a2e;">New Message</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${recipientName},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        You have a new message from <strong>${senderName}</strong> regarding <strong>${listingAddress}</strong>.
      </p>
      <blockquote style="border-left:3px solid #e8a838;padding-left:12px;color:#334766;margin:16px 0;font-style:italic;">
        "${preview}${messagePreview.length > 100 ? "..." : ""}"
      </blockquote>
      ${ctaButton(link, "View Conversation")}
      <p style="font-size:11px;color:#c0bdb6;margin:16px 0 0;">
        This notification was sent because the message was unread for 15 minutes.
      </p>
    `),
  });
}

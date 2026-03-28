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
            <span style="font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#f59e0b;letter-spacing:0.5px;">TrueBid</span>
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
              This email was sent by <a href="${BASE_URL()}" style="color:#f59e0b;text-decoration:none;">TrueBid</a> — free, transparent property sales for Australia.
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
  <a href="${href}" style="display:inline-block;background:#f59e0b;color:#0f1a2e;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>
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
      <blockquote style="border-left:3px solid #f59e0b;padding-left:12px;color:#334766;margin:16px 0;font-style:italic;">
        "${preview}${messagePreview.length > 100 ? "..." : ""}"
      </blockquote>
      ${ctaButton(link, "View Conversation")}
      <p style="font-size:11px;color:#c0bdb6;margin:16px 0 0;">
        This notification was sent because the message was unread for 15 minutes.
      </p>
    `),
  });
}

// ── Inspection email helpers ───────────────────────────────────────────────────

function formatInspectionTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Perth",
  });
  const startT = start.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  const endT = end.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Perth" });
  return `${date}, ${startT} – ${endT}`;
}

export async function sendInspectionBookingConfirmedEmail({
  buyerEmail, buyerName, address, startTime, endTime, listingId,
}: {
  buyerEmail: string; buyerName: string; address: string;
  startTime: string; endTime: string; listingId: string;
}) {
  const timeStr = formatInspectionTime(startTime, endTime);
  await sendEmail({
    to: buyerEmail,
    subject: `Inspection confirmed — ${address}`,
    html: emailLayout(`
      <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#0f1a2e;margin:0 0 8px;">Inspection Confirmed</h1>
      <p style="color:#334766;font-size:15px;margin:0 0 20px;">Your inspection booking has been confirmed.</p>
      <table style="background:#f7f5f0;border-radius:10px;padding:16px 20px;width:100%;margin-bottom:24px;">
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Property</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;padding-bottom:12px;">${address}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Date &amp; Time</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;">${timeStr}</td></tr>
      </table>
      <p style="font-size:13px;color:#6b7280;">Hi ${buyerName}, we look forward to seeing you at the inspection.</p>
      ${ctaButton(`${BASE_URL()}/listings/${listingId}`, "View Listing")}
    `),
  });
}

export async function sendInspectionNewBookingEmail({
  sellerEmail, sellerName, buyerName, address, startTime, endTime, listingId, confirmedCount, maxGroups,
}: {
  sellerEmail: string; sellerName: string; buyerName: string; address: string;
  startTime: string; endTime: string; listingId: string; confirmedCount: number; maxGroups: number;
}) {
  const timeStr = formatInspectionTime(startTime, endTime);
  await sendEmail({
    to: sellerEmail,
    subject: `New inspection booking — ${address}`,
    html: emailLayout(`
      <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#0f1a2e;margin:0 0 8px;">New Booking</h1>
      <p style="color:#334766;font-size:15px;margin:0 0 20px;">Hi ${sellerName}, a buyer has booked your inspection.</p>
      <table style="background:#f7f5f0;border-radius:10px;padding:16px 20px;width:100%;margin-bottom:24px;">
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Buyer (identity verified)</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;padding-bottom:12px;">${buyerName}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Inspection time</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;padding-bottom:12px;">${timeStr}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Bookings</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;">${confirmedCount} / ${maxGroups} spots filled</td></tr>
      </table>
      ${ctaButton(`${BASE_URL()}/dashboard/listings/${listingId}/inspections`, "View All Bookings")}
    `),
  });
}

export async function sendInspectionCancelledEmail({
  buyerEmail, buyerName, address, startTime, endTime, listingId,
}: {
  buyerEmail: string; buyerName: string; address: string;
  startTime: string; endTime: string; listingId: string;
}) {
  const timeStr = formatInspectionTime(startTime, endTime);
  await sendEmail({
    to: buyerEmail,
    subject: `Inspection cancelled — ${address}`,
    html: emailLayout(`
      <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#0f1a2e;margin:0 0 8px;">Inspection Cancelled</h1>
      <p style="color:#334766;font-size:15px;margin:0 0 20px;">Hi ${buyerName}, your inspection at the following property has been cancelled by the seller.</p>
      <table style="background:#f7f5f0;border-radius:10px;padding:16px 20px;width:100%;margin-bottom:24px;">
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Property</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;padding-bottom:12px;">${address}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Was scheduled for</td></tr>
        <tr><td style="font-size:15px;color:#0f1a2e;">${timeStr}</td></tr>
      </table>
      <p style="font-size:13px;color:#6b7280;">Please check the listing for alternative inspection times.</p>
      ${ctaButton(`${BASE_URL()}/listings/${listingId}`, "View Listing")}
    `),
  });
}

export async function sendInspectionReminderEmail({
  buyerEmail, buyerName, address, startTime, endTime, listingId, hoursAway,
}: {
  buyerEmail: string; buyerName: string; address: string;
  startTime: string; endTime: string; listingId: string; hoursAway: number;
}) {
  const timeStr = formatInspectionTime(startTime, endTime);
  const when = hoursAway <= 2 ? "in 2 hours" : "tomorrow";
  await sendEmail({
    to: buyerEmail,
    subject: `Inspection reminder — ${address} (${when})`,
    html: emailLayout(`
      <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#0f1a2e;margin:0 0 8px;">Inspection Reminder</h1>
      <p style="color:#334766;font-size:15px;margin:0 0 20px;">Hi ${buyerName}, you have an inspection ${when}.</p>
      <table style="background:#f7f5f0;border-radius:10px;padding:16px 20px;width:100%;margin-bottom:24px;">
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Property</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;padding-bottom:12px;">${address}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Date &amp; Time</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;">${timeStr}</td></tr>
      </table>
      ${ctaButton(`${BASE_URL()}/listings/${listingId}`, "View Listing")}
    `),
  });
}

export async function sendBuyerCancelledBookingEmail({
  sellerEmail, sellerName, buyerName, address, startTime, endTime, spotsRemaining,
}: {
  sellerEmail: string; sellerName: string; buyerName: string; address: string;
  startTime: string; endTime: string; spotsRemaining: number;
}) {
  const timeStr = formatInspectionTime(startTime, endTime);
  await sendEmail({
    to: sellerEmail,
    subject: `Booking cancelled — ${address}`,
    html: emailLayout(`
      <h1 style="font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#0f1a2e;margin:0 0 8px;">Booking Cancelled</h1>
      <p style="color:#334766;font-size:15px;margin:0 0 20px;">Hi ${sellerName}, a buyer has cancelled their inspection booking.</p>
      <table style="background:#f7f5f0;border-radius:10px;padding:16px 20px;width:100%;margin-bottom:24px;">
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Buyer</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;padding-bottom:12px;">${buyerName}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Inspection time</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;padding-bottom:12px;">${timeStr}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Available spots</td></tr>
        <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;">${spotsRemaining} spot${spotsRemaining !== 1 ? "s" : ""} now available</td></tr>
      </table>
    `),
  });
}

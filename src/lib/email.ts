import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "TrueBid <noreply@truebid.com.au>";

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
    console.log(`[Email skipped — no RESEND_API_KEY] To: ${to} | ${subject}`);
    return;
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    console.error("Failed to send email:", error);
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

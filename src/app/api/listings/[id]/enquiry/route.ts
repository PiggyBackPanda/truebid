import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, ApiError } from "@/lib/api-helpers";
import { sendEmail } from "@/lib/email";
import { BASE_URL } from "@/lib/constants";
import { z } from "zod";

const enquirySchema = z.object({
  senderName: z.string().min(1, "Name is required").max(100).trim(),
  senderEmail: z.string().email("Invalid email").max(200).toLowerCase().trim(),
  message: z.string().min(1, "Message is required").max(1000).trim(),
});

const URL_PATTERN = /https?:\/\/|www\./i;

// POST /api/listings/[id]/enquiry
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        status: true,
        streetAddress: true,
        suburb: true,
        state: true,
        postcode: true,
        addressVisibility: true,
        seller: {
          select: { firstName: true, email: true },
        },
      },
    });

    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found");
    if (listing.status === "DRAFT") {
      throw new ApiError(403, "FORBIDDEN", "Cannot enquire on a draft listing");
    }

    const body = await req.json();
    const { senderName, senderEmail, message } = enquirySchema.parse(body);

    if (URL_PATTERN.test(message)) {
      throw new ApiError(400, "INVALID_CONTENT", "Links are not permitted in enquiry messages");
    }

    const address =
      listing.addressVisibility === "PUBLIC"
        ? `${listing.streetAddress}, ${listing.suburb} ${listing.state} ${listing.postcode}`
        : `${listing.suburb}, ${listing.state} ${listing.postcode}`;

    const baseUrl = BASE_URL;
    const listingUrl = `${baseUrl}/listings/${id}`;

    await sendEmail({
      to: listing.seller.email,
      subject: `New enquiry about ${address}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:'Outfit',Helvetica,Arial,sans-serif;color:#0f1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#0f1a2e;padding:24px 32px;text-align:center;">
            <span style="font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#f59e0b;letter-spacing:0.5px;">TrueBid</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px;">
            <h2 style="font-family:'DM Serif Display',Georgia,serif;font-size:20px;margin:0 0 16px;color:#0f1a2e;">New Enquiry</h2>
            <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Hi ${listing.seller.firstName},</p>
            <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
              You have received an enquiry about your property at <strong>${address}</strong>.
            </p>
            <table style="background:#f7f5f0;border-radius:10px;padding:16px 20px;width:100%;margin-bottom:24px;">
              <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">From</td></tr>
              <tr><td style="font-size:15px;font-weight:600;color:#0f1a2e;padding-bottom:12px;">${senderName} &lt;${senderEmail}&gt;</td></tr>
              <tr><td style="font-size:13px;color:#6b7280;padding-bottom:4px;">Message</td></tr>
              <tr><td style="font-size:14px;color:#334766;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td></tr>
            </table>
            <p style="margin:24px 0 8px;text-align:center;">
              <a href="${listingUrl}" style="display:inline-block;background:#f59e0b;color:#0f1a2e;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">View Listing</a>
            </p>
            <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">
              Reply directly to <a href="mailto:${senderEmail}" style="color:#9ca3af;">${senderEmail}</a> to respond to this enquiry.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #e5e1da;">
            <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5;">
              This email was sent by <a href="${baseUrl}" style="color:#f59e0b;text-decoration:none;">TrueBid</a>, free, transparent property sales for Australia.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

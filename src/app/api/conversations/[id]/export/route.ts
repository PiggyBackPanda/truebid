import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, errorResponse, ApiError } from "@/lib/api-helpers";

// GET /api/conversations/[id]/export — return a printable HTML transcript
// The client opens this in a new window; the page auto-triggers window.print()
// so the user can Save as PDF from their browser's print dialog.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const url = new URL(req.url);
    const VALID_TIMEZONES = [
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Brisbane",
      "Australia/Perth",
      "Australia/Adelaide",
      "Australia/Darwin",
      "Australia/Hobart",
      "Australia/ACT",
    ];
    const rawTz = url.searchParams.get("tz") ?? "Australia/Sydney";
    const timeZone = VALID_TIMEZONES.includes(rawTz) ? rawTz : "Australia/Sydney";

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
            streetAddress: true,
            suburb: true,
            state: true,
            postcode: true,
          },
        },
        offer: {
          select: {
            id: true,
            amountCents: true,
            acceptedAt: true,
          },
        },
        buyer: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
        messages: {
          orderBy: { sentAt: "asc" },
          select: {
            id: true,
            senderId: true,
            body: true,
            sentAt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, "NOT_FOUND", "Conversation not found");
    }

    if (
      conversation.buyerId !== user.id &&
      conversation.sellerId !== user.id
    ) {
      throw new ApiError(403, "FORBIDDEN", "You are not a party to this conversation");
    }

    const { listing, offer, buyer, seller, messages } = conversation;

    const address = `${listing.streetAddress}, ${listing.suburb} ${listing.state} ${listing.postcode}`;
    const acceptedAmount = new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
    }).format(offer.amountCents / 100);

    const formatTs = (d: Date | string) =>
      new Intl.DateTimeFormat("en-AU", {
        dateStyle: "long",
        timeStyle: "medium",
        timeZone,
      }).format(new Date(d));

    const senderName = (senderId: string) => {
      if (senderId === buyer.id) return `${buyer.firstName} ${buyer.lastName}`;
      if (senderId === seller.id) return `${seller.firstName} ${seller.lastName}`;
      return "Unknown";
    };

    const messageRows = messages
      .map(
        (m) => `
      <div class="message">
        <div class="message-meta">
          <span class="sender">${escapeHtml(senderName(m.senderId))}</span>
          <span class="timestamp">${escapeHtml(formatTs(m.sentAt))}</span>
        </div>
        <div class="message-body">${escapeHtml(m.body)}</div>
      </div>`
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TrueBid Conversation Transcript — ${escapeHtml(listing.streetAddress)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Outfit', Georgia, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #ffffff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      border-bottom: 2px solid #0f1a2e;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .logo-mark {
      width: 28px;
      height: 28px;
      background: #e8a838;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #0f1a2e;
      font-family: Georgia, serif;
    }

    .logo-name {
      font-family: Georgia, serif;
      font-size: 18px;
      color: #0f1a2e;
      letter-spacing: -0.02em;
    }

    h1 {
      font-family: Georgia, serif;
      font-size: 22px;
      font-weight: 400;
      color: #0f1a2e;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .subtitle {
      color: #6b7280;
      font-size: 13px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      background: #f7f5f0;
      border: 1px solid #e5e2db;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 28px;
    }

    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; }
    .meta-value { font-size: 13px; color: #0f1a2e; font-weight: 500; }

    .messages-heading {
      font-family: Georgia, serif;
      font-size: 16px;
      font-weight: 400;
      color: #0f1a2e;
      margin-bottom: 16px;
    }

    .message {
      padding: 14px 0;
      border-bottom: 1px solid #f0ede7;
    }
    .message:last-child { border-bottom: none; }

    .message-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
    }

    .sender {
      font-weight: 600;
      color: #0f1a2e;
      font-size: 13px;
    }

    .timestamp {
      color: #9ca3af;
      font-size: 11px;
    }

    .message-body {
      color: #334766;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e2db;
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.6;
    }

    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      @page { margin: 20mm; }
    }

    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0f1a2e;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 28px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-mark">T</div>
      <span class="logo-name">TrueBid</span>
    </div>
    <h1>Conversation Transcript</h1>
    <p class="subtitle">Generated on ${formatTs(new Date())} (${timeZone})</p>
  </div>

  <button class="print-btn no-print" onclick="window.print()">
    ⬇ Save as PDF
  </button>

  <div class="meta-grid">
    <div class="meta-item">
      <span class="meta-label">Property Address</span>
      <span class="meta-value">${escapeHtml(address)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Listing ID</span>
      <span class="meta-value">${escapeHtml(listing.id)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Offer ID</span>
      <span class="meta-value">${escapeHtml(offer.id)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Accepted Offer Amount</span>
      <span class="meta-value">${acceptedAmount}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Buyer</span>
      <span class="meta-value">${escapeHtml(`${buyer.firstName} ${buyer.lastName}`)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Seller</span>
      <span class="meta-value">${escapeHtml(`${seller.firstName} ${seller.lastName}`)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Conversation Started</span>
      <span class="meta-value">${escapeHtml(formatTs(conversation.createdAt))}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Total Messages</span>
      <span class="meta-value">${messages.length}</span>
    </div>
  </div>

  <h2 class="messages-heading">Messages (${messages.length})</h2>

  <div class="messages">
    ${messages.length === 0 ? '<p style="color:#9ca3af;font-style:italic;">No messages in this conversation yet.</p>' : messageRows}
  </div>

  <div class="footer">
    <p>
      <strong>This transcript is an official record generated by TrueBid. Messages cannot be altered after sending.</strong>
    </p>
    <p style="margin-top:8px;">
      Conversation ID: ${escapeHtml(id)} &bull;
      Exported: ${formatTs(new Date())} &bull;
      truebid.com.au
    </p>
  </div>

  <script>
    // Auto-trigger print dialog when opened directly
    if (window.opener === null && !window.location.search.includes('noprint')) {
      window.addEventListener('load', () => window.print());
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="transcript-${id.slice(0, 8)}.html"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

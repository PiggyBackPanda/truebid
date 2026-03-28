import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendInspectionReminderEmail } from "@/lib/email";
import { serializeListingAddress } from "@/lib/listing-serializer";
import type { AddressVisibility } from "@/lib/listing-serializer";

// GET /api/cron/inspection-reminders
// Called by an external scheduler (e.g. Vercel Cron) every hour.
// Sends 24h and 2h reminder emails for upcoming confirmed inspection bookings.
//
// Protect with a shared secret in the Authorization header:
//   Authorization: Bearer <CRON_SECRET>

const WINDOW_MINUTES = 70; // look 70 min ahead so hourly calls have overlap buffer

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set, refusing to run unprotected");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── 24-hour window ─────────────────────────────────────────────────────────
  // Target: slot starts between 23h and 25h from now (70-min window centred on 24h)
  const h24Start = new Date(now.getTime() + (24 * 60 - WINDOW_MINUTES / 2) * 60 * 1000);
  const h24End   = new Date(now.getTime() + (24 * 60 + WINDOW_MINUTES / 2) * 60 * 1000);

  const due24h = await prisma.inspectionBooking.findMany({
    where: {
      status: "CONFIRMED",
      reminder24hSentAt: null,
      slot: { startTime: { gte: h24Start, lte: h24End } },
    },
    select: {
      id: true,
      buyer: { select: { id: true, email: true, firstName: true } },
      slot: {
        select: {
          startTime: true,
          endTime: true,
          listing: {
            select: {
              id: true,
              streetAddress: true,
              suburb: true,
              state: true,
              postcode: true,
              addressVisibility: true,
              _count: { select: { inspectionSlots: true } },
            },
          },
        },
      },
    },
  });

  // ── 2-hour window ──────────────────────────────────────────────────────────
  const h2Start = new Date(now.getTime() + (2 * 60 - WINDOW_MINUTES / 2) * 60 * 1000);
  const h2End   = new Date(now.getTime() + (2 * 60 + WINDOW_MINUTES / 2) * 60 * 1000);

  const due2h = await prisma.inspectionBooking.findMany({
    where: {
      status: "CONFIRMED",
      reminder2hSentAt: null,
      slot: { startTime: { gte: h2Start, lte: h2End } },
    },
    select: {
      id: true,
      buyer: { select: { id: true, email: true, firstName: true } },
      slot: {
        select: {
          startTime: true,
          endTime: true,
          listing: {
            select: {
              id: true,
              streetAddress: true,
              suburb: true,
              state: true,
              postcode: true,
              addressVisibility: true,
              _count: { select: { inspectionSlots: true } },
            },
          },
        },
      },
    },
  });

  let sent24h = 0;
  let sent2h  = 0;

  function buildAddress(booking: typeof due24h[number]): string {
    const { listing } = booking.slot;
    const serialized = serializeListingAddress(
      {
        id: listing.id,
        streetAddress: listing.streetAddress,
        suburb: listing.suburb,
        state: listing.state,
        postcode: listing.postcode,
        latitude: null,
        longitude: null,
        addressVisibility: listing.addressVisibility as AddressVisibility,
        hasInspectionSlots: listing._count.inspectionSlots > 0,
      },
      { userId: booking.buyer.id, hasBooking: true }
    );
    return serialized.streetAddress
      ? `${serialized.streetAddress}, ${listing.suburb} ${listing.state}`
      : `${listing.suburb}, ${listing.state}`;
  }

  // Send 24h reminders
  const results24h = await Promise.allSettled(
    due24h.map(async (booking) => {
      await sendInspectionReminderEmail({
        buyerEmail: booking.buyer.email,
        buyerName: booking.buyer.firstName,
        address: buildAddress(booking),
        startTime: booking.slot.startTime.toISOString(),
        endTime: booking.slot.endTime.toISOString(),
        listingId: booking.slot.listing.id,
        hoursAway: 24,
      });
      await prisma.inspectionBooking.update({
        where: { id: booking.id },
        data: { reminder24hSentAt: new Date() },
      });
      sent24h++;
    })
  );
  results24h.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[cron] Failed 24h reminder for booking ${due24h[i].id}:`, result.reason);
    }
  });

  // Send 2h reminders
  const results2h = await Promise.allSettled(
    due2h.map(async (booking) => {
      await sendInspectionReminderEmail({
        buyerEmail: booking.buyer.email,
        buyerName: booking.buyer.firstName,
        address: buildAddress(booking as typeof due24h[number]),
        startTime: booking.slot.startTime.toISOString(),
        endTime: booking.slot.endTime.toISOString(),
        listingId: booking.slot.listing.id,
        hoursAway: 2,
      });
      await prisma.inspectionBooking.update({
        where: { id: booking.id },
        data: { reminder2hSentAt: new Date() },
      });
      sent2h++;
    })
  );
  results2h.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[cron] Failed 2h reminder for booking ${due2h[i].id}:`, result.reason);
    }
  });

  return Response.json({ sent24h, sent2h, processedAt: now.toISOString() });
}

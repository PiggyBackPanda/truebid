/**
 * Server-side offer business logic.
 * Do NOT import this in Client Components: it uses Prisma and socket.io.
 */

import { prisma } from "@/lib/db";
import { emitToListing } from "@/lib/socket";

const ANTI_SNIPE_WINDOW_MS = 10 * 60 * 1000;   // 10 minutes
const ANTI_SNIPE_EXTENSION_MS = 10 * 60 * 1000; // 10 minutes

type ListingForAntiSnipe = {
  id: string;
  saleMethod: string;
  closingDate: Date | null;
  status: string;
};

/**
 * Check whether an offer event triggers the anti-snipe rule.
 *
 * If the event happens within 10 minutes of closing, the closing date is
 * extended by 10 minutes from NOW (not from the current closing date).
 * Returns the new closing date if extended, null otherwise.
 *
 * Only "offer:new" and "offer:updated" trigger extension.
 * Withdrawals do NOT trigger anti-snipe.
 */
export async function checkAntiSnipe(
  listing: ListingForAntiSnipe,
  eventType: "offer:new" | "offer:updated"
): Promise<Date | null> {
  void eventType; // only new/updated calls reach this function; caller is responsible

  if (listing.saleMethod !== "OPEN_OFFERS") return null;
  if (!listing.closingDate) return null;
  if (listing.status !== "ACTIVE") return null;

  const now = new Date();
  const timeUntilClose = listing.closingDate.getTime() - now.getTime();

  // Already closed or more than 10 minutes away: no extension
  if (timeUntilClose <= 0) return null;
  if (timeUntilClose > ANTI_SNIPE_WINDOW_MS) return null;

  const newClosingDate = new Date(now.getTime() + ANTI_SNIPE_EXTENSION_MS);

  await prisma.listing.update({
    where: { id: listing.id },
    data: { closingDate: newClosingDate },
  });

  emitToListing(listing.id, "timer:extended", {
    listingId: listing.id,
    newClosingDate: newClosingDate.toISOString(),
    reason: "Anti-snipe: new activity within 10 minutes of closing",
  });

  return newClosingDate;
}

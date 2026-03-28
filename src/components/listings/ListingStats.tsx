"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface ListingStatsProps {
  listingId: string;
  initialViewerCount: number;
  initialOfferCount: number;
  isActive: boolean;
  isOwner: boolean;
}

export function ListingStats({
  listingId,
  initialViewerCount,
  initialOfferCount,
  isActive,
  isOwner,
}: ListingStatsProps) {
  const [viewerCount, setViewerCount] = useState<number | null>(
    initialViewerCount > 0 ? initialViewerCount : null
  );
  const [offerCount, setOfferCount] = useState(initialOfferCount);
  const socketRef = useRef<Socket | null>(null);

  // Record the view and fetch real counts on mount
  useEffect(() => {
    if (!isActive || isOwner) return;

    fetch(`/api/listings/${listingId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((data: { viewerCount: number | null; offerCount: number }) => {
        if (typeof data.viewerCount === "number") {
          setViewerCount(data.viewerCount);
        }
        if (typeof data.offerCount === "number") {
          setOfferCount(data.offerCount);
        }
      })
      .catch(() => {
        // Silently ignore fetch errors: stats are cosmetic
      });
  }, [listingId, isActive, isOwner]);

  // Connect to Socket.io for live updates
  useEffect(() => {
    if (!isActive || isOwner) return;

    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.emit("join_listing", { listingId });

    socket.on(
      "listing:stats",
      ({ viewerCount: vc, offerCount: oc }: { viewerCount: number; offerCount: number }) => {
        setViewerCount(vc);
        setOfferCount(oc);
      }
    );

    socket.on("offer:new", () => {
      setOfferCount((prev) => prev + 1);
    });

    return () => {
      socket.emit("leave_listing", { listingId });
      socket.disconnect();
    };
  }, [listingId, isActive, isOwner]);

  if (!isActive || isOwner) return null;

  const hasViewers = viewerCount !== null && viewerCount > 0;
  const hasOffers = offerCount > 0;

  if (!hasViewers && !hasOffers) return null;

  let text: string;
  if (hasViewers && hasOffers) {
    text = `${viewerCount} people viewing · ${offerCount} offers submitted`;
  } else if (hasViewers) {
    text = `${viewerCount} people viewing · No offers yet`;
  } else {
    text = `${offerCount} offers submitted`;
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-text-muted">
      <span
        className="w-2 h-2 rounded-full bg-green animate-pulse inline-block"
        aria-hidden="true"
      />
      {text}
    </p>
  );
}

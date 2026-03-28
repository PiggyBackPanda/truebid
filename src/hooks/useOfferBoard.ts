"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { rankOffers } from "@/lib/offer-utils";
import type { PublicOffer } from "@/lib/offer-utils";

export function useOfferBoard(
  listingId: string,
  initialOffers: PublicOffer[],
  initialClosingDate: string | null
) {
  const [offers, setOffers] = useState<PublicOffer[]>(() =>
    rankOffers(initialOffers)
  );
  const [closingDate, setClosingDate] = useState<string | null>(
    initialClosingDate
  );
  const [viewerCount, setViewerCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.emit("join_listing", { listingId });

    socket.on("offer:new", ({ offer }: { offer: PublicOffer }) => {
      setOffers((prev) => rankOffers([...prev, offer]));
    });

    socket.on("offer:updated", ({ offer }: { offer: PublicOffer }) => {
      setOffers((prev) =>
        rankOffers(prev.map((o) => (o.id === offer.id ? offer : o)))
      );
    });

    socket.on("offer:withdrawn", ({ offerId }: { offerId: string }) => {
      setOffers((prev) =>
        rankOffers(
          prev.map((o) =>
            o.id === offerId ? { ...o, status: "WITHDRAWN" } : o
          )
        )
      );
    });

    socket.on("offer:accepted", ({ offerId }: { offerId: string }) => {
      setOffers((prev) =>
        prev.map((o) => ({
          ...o,
          status:
            o.id === offerId
              ? "ACCEPTED"
              : o.status === "ACTIVE"
              ? "REJECTED"
              : o.status,
        }))
      );
    });

    socket.on(
      "timer:extended",
      ({ newClosingDate }: { newClosingDate: string }) => {
        setClosingDate(newClosingDate);
      }
    );

    socket.on("presence:count", ({ count }: { count: number }) => {
      setViewerCount(count);
    });

    // On reconnect, re-sync state from the server
    socket.on("reconnect", () => {
      fetch(`/api/listings/${listingId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.listing?.offers) {
            setOffers(rankOffers(data.listing.offers));
          }
          if (data.listing?.closingDate !== undefined) {
            setClosingDate(data.listing.closingDate);
          }
        })
        .catch(() => {/* ignore: we'll be up to date on next event */});
      socket.emit("join_listing", { listingId });
    });

    return () => {
      socket.emit("leave_listing", { listingId });
      socket.disconnect();
    };
  }, [listingId]);

  return { offers, closingDate, viewerCount };
}

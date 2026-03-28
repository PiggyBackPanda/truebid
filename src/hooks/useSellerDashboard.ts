"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { rankOffers } from "@/lib/offer-utils";

export type SellerOffer = {
  id: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    publicAlias: string;
    verificationStatus: string;
  };
  amountCents: number;
  conditionType: string;
  conditionText: string | null;
  settlementDays: number;
  personalNote: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  history: {
    previousAmountCents: number;
    newAmountCents: number;
    changeType: string;
    createdAt: string;
  }[];
};

export type Toast = {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
};

export function useSellerDashboard(listingId: string, initialOffers: SellerOffer[]) {
  const [offers, setOffers] = useState<SellerOffer[]>(() =>
    rankOffers(initialOffers)
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const socketRef = useRef<Socket | null>(null);

  function addToast(message: string, type: Toast["type"] = "info") {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Refresh offers from the seller-specific endpoint to get full buyer details
  async function refreshOffers() {
    try {
      const res = await fetch(`/api/dashboard/seller/offers/${listingId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { offers: SellerOffer[] };
      setOffers(rankOffers(data.offers));
    } catch {
      // ignore: stale data is acceptable
    }
  }

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.emit("join_listing", { listingId });

    socket.on("offer:new", ({ offer }: { offer: { id: string; publicAlias: string } }) => {
      addToast(`New offer received from ${offer.publicAlias}`, "info");
      refreshOffers();
    });

    socket.on("offer:updated", ({ offer }: { offer: { id: string; publicAlias: string; amountCents: number } }) => {
      addToast(`Offer updated by ${offer.publicAlias}`, "info");
      refreshOffers();
    });

    socket.on("offer:withdrawn", ({ offerId }: { offerId: string }) => {
      setOffers((prev) =>
        rankOffers(
          prev.map((o) =>
            o.id === offerId ? { ...o, status: "WITHDRAWN" } : o
          )
        )
      );
      addToast("An offer has been withdrawn", "warning");
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

    return () => {
      socket.emit("leave_listing", { listingId });
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  return { offers, setOffers, toasts, dismissToast, refreshOffers };
}
